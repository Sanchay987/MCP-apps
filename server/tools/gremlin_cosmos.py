"""
Gremlin CosmosDB Tool - Fetches LIVE graph data from Azure CosmosDB Gremlin API

This tool queries Azure Cosmos DB Gremlin API for regulatory policy graph data
and returns it in a format ready for visualization in Generative UI.

Data Structure:
- Vertices: BusinessRules, Obligations, Processes, Controls
- Edges: LINEAGE relationships
- Attributes: node_attributes with why/what/who/where/when/how
"""

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor

from gremlin_python.driver import client, serializer
from gremlin_python.driver.protocol import GremlinServerError

# Load environment variables
load_dotenv()

# Thread pool for running sync Gremlin queries in async context
_executor = ThreadPoolExecutor(max_workers=3)


class GremlinCosmosTools:
    """Tool for querying regulatory policy graph data from CosmosDB Gremlin API"""

    def __init__(self):
        """Initialize Gremlin client connection"""
        self.endpoint = os.getenv("COSMOS_DB_ENDPOINT")
        self.database = os.getenv("COSMOS_DB_DATABASE_NAME", "")
        self.graph = os.getenv("COSMOS_DB_CONTAINER_NAME", "")
        self.password = os.getenv("COSMOS_DB_PRIMARY_KEY")

        # Build Gremlin username from database and container names
        # Format: /dbs/{database}/colls/{container}
        gremlin_username = os.getenv("COSMOS_DB_GREMLIN_USERNAME")
        if gremlin_username:
            self.username = gremlin_username
        else:
            # Auto-generate from database and container names
            self.username = f"/dbs/{self.database}/colls/{self.graph}"

        if not all([self.endpoint, self.username, self.password, self.database, self.graph]):
            raise ValueError(
                "Missing CosmosDB credentials. Required environment variables:\n"
                "  - COSMOS_DB_ENDPOINT (wss://...)\n"
                "  - COSMOS_DB_PRIMARY_KEY\n"
                "  - COSMOS_DB_DATABASE_NAME\n"
                "  - COSMOS_DB_CONTAINER_NAME\n"
                "Check your .env file!"
            )

        # Initialize Gremlin client
        self.client = client.Client(
            url=self.endpoint,
            traversal_source='g',
            username=self.username,
            password=self.password,
            message_serializer=serializer.GraphSONSerializersV2d0()
        )

    def close(self):
        """Close Gremlin client connection"""
        if self.client:
            self.client.close()

    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """
        Execute a Gremlin query and return results.

        Handles async event loop conflicts by running in a dedicated thread.

        Args:
            query: Gremlin traversal query string

        Returns:
            List of result dictionaries
        """
        try:
            # Always run in thread pool to avoid event loop conflicts
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self._execute_sync, query)
                results = future.result(timeout=30)  # 30 second timeout
                return results
        except concurrent.futures.TimeoutError:
            print(f"Gremlin query timeout: {query}")
            return []
        except GremlinServerError as e:
            print(f"Gremlin query error: {e}")
            return []
        except Exception as e:
            print(f"Error executing Gremlin query: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _execute_sync(self, query: str) -> List[Dict[str, Any]]:
        """Execute query synchronously with its own event loop"""
        try:
            # Create a new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                callback = self.client.submit(query)
                results = callback.all().result()
                return results
            finally:
                loop.close()
        except Exception as e:
            print(f"Error in _execute_sync: {e}")
            import traceback
            traceback.print_exc()
            return []

    def parse_node_attributes(self, node_attrs_str: str) -> Dict[str, str]:
        """
        Parse node_attributes from stringified JSON array.

        Example input:
        "[{\"key\": \"why\", \"value\": \"to assist...\"}, {\"key\": \"what\", \"value\": \"...\"}]"

        Returns:
        {"why": "to assist...", "what": "..."}
        """
        try:
            if isinstance(node_attrs_str, list) and len(node_attrs_str) > 0:
                node_attrs_str = node_attrs_str[0]

            attrs_list = json.loads(node_attrs_str)
            return {item["key"]: item["value"] for item in attrs_list}
        except (json.JSONDecodeError, KeyError, TypeError):
            return {}

    def parse_relationship_attributes(self, rel_attrs_str: str) -> Dict[str, str]:
        """Parse relationship_attributes from stringified JSON array."""
        try:
            if isinstance(rel_attrs_str, str):
                attrs_list = json.loads(rel_attrs_str)
                return {item["key"]: item["value"] for item in attrs_list}
            return {}
        except (json.JSONDecodeError, KeyError, TypeError):
            return {}

    def query_by_label(
        self,
        label: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Query vertices and edges by label (BusinessRules, Obligations, etc.).

        Args:
            label: Vertex label to query
            limit: Maximum vertices to return

        Returns:
            Dictionary with nodes and edges
        """
        # Query vertices with the specified label
        vertex_query = f"g.V().hasLabel('{label}').limit({limit}).valueMap(true)"
        vertices = self.execute_query(vertex_query)

        if not vertices:
            return {
                "nodes": [],
                "edges": [],
                "metadata": {
                    "query_label": label,
                    "node_count": 0,
                    "edge_count": 0,
                    "source": "CosmosDB Gremlin API (no results)"
                }
            }

        # Extract vertex IDs for edge query
        vertex_ids = []
        for v in vertices:
            if isinstance(v, dict) and 'id' in v:
                vertex_ids.append(v['id'])

        # Query edges connected to these vertices
        edge_query = f"g.V().hasLabel('{label}').limit({limit}).outE().valueMap(true)"
        edges_raw = self.execute_query(edge_query)

        # Transform to graph format
        return self.transform_to_graph(vertices, edges_raw, label)

    def query_all_categories(self) -> List[str]:
        """
        Get all unique vertex labels (categories).

        Returns:
            List of label names
        """
        # Query to get distinct labels
        query = "g.V().label().dedup()"
        labels = self.execute_query(query)
        return labels if labels else []

    def search_by_keyword(
        self,
        keyword: str,
        limit: int = 30
    ) -> Dict[str, Any]:
        """
        Search policies by keyword in node names or IDs.

        Args:
            keyword: Search term
            limit: Maximum results

        Returns:
            Dictionary with nodes and edges
        """
        # Search in vertex IDs (contains filter)
        # Note: CosmosDB Gremlin has limited text search, using ID contains
        query = f"g.V().limit({limit * 3}).valueMap(true)"

        all_vertices = self.execute_query(query)

        # Filter vertices containing keyword (case-insensitive)
        vertices = []
        keyword_lower = keyword.lower()
        for v in all_vertices:
            if isinstance(v, dict):
                # Check in ID
                vertex_id = str(v.get('id', ''))
                # Check in name
                name_val = v.get('name', [])
                if isinstance(name_val, list) and len(name_val) > 0:
                    name_str = str(name_val[0])
                else:
                    name_str = str(name_val)

                # Check if keyword matches
                if keyword_lower in vertex_id.lower() or keyword_lower in name_str.lower():
                    vertices.append(v)
                    if len(vertices) >= limit:
                        break

        if not vertices:
            return {
                "nodes": [],
                "edges": [],
                "metadata": {
                    "search_term": keyword,
                    "node_count": 0,
                    "edge_count": 0,
                    "source": "CosmosDB Gremlin API (no matches)"
                }
            }

        # Get edges for found vertices
        edges_raw = []
        if vertices:
            # Query outgoing edges from first few vertices
            for v in vertices[:5]:  # Limit edge queries
                vertex_id = v.get('id')
                if vertex_id:
                    edge_query = f"g.V('{vertex_id}').bothE().valueMap(true)"
                    edges = self.execute_query(edge_query)
                    edges_raw.extend(edges)

        return self.transform_to_graph(vertices, edges_raw, f"search:{keyword}")

    def transform_to_graph(
        self,
        vertices: List[Dict[str, Any]],
        edges_raw: List[Dict[str, Any]],
        query_topic: str
    ) -> Dict[str, Any]:
        """
        Transform Gremlin results into frontend graph format.

        Args:
            vertices: List of vertex results from Gremlin
            edges_raw: List of edge results from Gremlin
            query_topic: Original query for metadata

        Returns:
            Dictionary with nodes, edges, and metadata
        """
        nodes = []
        edges = []

        # Transform vertices to nodes
        for vertex in vertices:
            if not isinstance(vertex, dict):
                continue

            # Extract ID (handle both formats)
            node_id = vertex.get('id')
            if isinstance(node_id, list):
                node_id = node_id[0]

            # Extract label
            label = vertex.get('label', 'Unknown')
            if isinstance(label, list):
                label = label[0]

            # Extract name
            name = vertex.get('name', node_id)
            if isinstance(name, list):
                name = name[0] if name else node_id

            # Parse node_attributes
            node_attrs_raw = vertex.get('node_attributes', '[]')
            node_attrs = self.parse_node_attributes(node_attrs_raw)

            # Build description from node_attributes
            description_parts = []
            if 'what' in node_attrs:
                description_parts.append(node_attrs['what'])
            if 'why' in node_attrs:
                description_parts.append(f"Purpose: {node_attrs['why']}")

            description = " | ".join(description_parts) if description_parts else "No description"

            # Extract entity type
            entity_type_val = vertex.get('EntityType', ['Entity'])
            if isinstance(entity_type_val, list):
                entity_type = entity_type_val[0] if entity_type_val else 'Entity'
            else:
                entity_type = entity_type_val

            node = {
                "id": str(node_id),
                "label": name.replace("_", " ").title(),
                "type": label,
                "description": description,
                "properties": {
                    "category": label,
                    "entity_type": entity_type,
                    **node_attrs  # Include all parsed attributes (why, what, who, where, when, how)
                }
            }
            nodes.append(node)

        # Create a set of valid node IDs for edge validation
        valid_node_ids = {str(n['id']) for n in nodes}

        # Transform edges
        for edge in edges_raw:
            if not isinstance(edge, dict):
                continue

            edge_id = edge.get('id', '')
            label = edge.get('label', 'RELATED')

            # Handle edge structure
            source = edge.get('outV', edge.get('source'))
            target = edge.get('inV', edge.get('target'))

            if source and target:
                source_str = str(source)
                target_str = str(target)

                # Parse relationship attributes
                rel_attrs_raw = edge.get('relationship_attributes', '[]')
                if isinstance(rel_attrs_raw, list) and len(rel_attrs_raw) > 0:
                    rel_attrs_raw = rel_attrs_raw[0]
                rel_attrs = self.parse_relationship_attributes(rel_attrs_raw)

                # Extract document source
                doc_source_val = edge.get('document_source', [''])
                if isinstance(doc_source_val, list):
                    doc_source = doc_source_val[0] if doc_source_val else ''
                else:
                    doc_source = doc_source_val

                # Extract source page
                source_page_val = edge.get('source_page', [''])
                if isinstance(source_page_val, list):
                    source_page = source_page_val[0] if source_page_val else ''
                else:
                    source_page = source_page_val

                edge_obj = {
                    "source": source_str,
                    "target": target_str,
                    "relationship": label,
                    "properties": {
                        "edge_id": str(edge_id),
                        "link_strength": rel_attrs.get('link_strength', 'medium'),
                        "link_explanation": rel_attrs.get('link_explanation', ''),
                        "document_source": doc_source,
                        "source_page": source_page
                    }
                }
                edges.append(edge_obj)

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "topic": query_topic,
                "node_count": len(nodes),
                "edge_count": len(edges),
                "source": "Azure CosmosDB Gremlin API (live data)",
                "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "database": self.database,
                "graph": self.graph
            }
        }


# Singleton instance
_gremlin_tool = None


def get_gremlin_tool() -> GremlinCosmosTools:
    """Get or create singleton instance"""
    global _gremlin_tool
    if _gremlin_tool is None:
        _gremlin_tool = GremlinCosmosTools()
    return _gremlin_tool


# ============================================================================
# MCP Tool Functions (to be registered in mcp_server_web.py)
# ============================================================================

def query_regulatory_policy_graph(label: str) -> str:
    """
    MCP tool function: Query live regulatory/policy graph from CosmosDB Gremlin API.

    This tool fetches LIVE graph data from Azure Cosmos DB using Gremlin queries
    and returns structured graph data (nodes and edges) for visualization.

    Args:
        label: Vertex label to query. Options:
               - "BusinessRules" - Top-level policies
               - "Obligations" - Compliance requirements
               - "Processes" - Operational procedures
               - "Controls" - Risk mitigation measures
               - Or search term (e.g., "Bribery", "Crime", "GDPR")

    Returns:
        JSON string with graph structure (nodes, edges, metadata)
    """
    try:
        tool = get_gremlin_tool()

        # Check if it's a standard label
        standard_labels = ["BusinessRules", "Obligations", "Processes", "Controls"]

        if label in standard_labels:
            graph_data = tool.query_by_label(label, limit=50)
        else:
            # Treat as search keyword
            graph_data = tool.search_by_keyword(label, limit=30)

        return json.dumps(graph_data, indent=2)

    except Exception as e:
        return json.dumps({
            "error": f"Failed to query Gremlin API: {str(e)}",
            "query": label,
            "nodes": [],
            "edges": [],
            "metadata": {
                "topic": label,
                "source": "CosmosDB Gremlin API (error)"
            }
        }, indent=2)


def list_policy_categories() -> str:
    """
    MCP tool function: List all available policy categories (vertex labels).

    Returns live list of vertex labels from the Gremlin graph.

    Returns:
        JSON string with list of categories
    """
    try:
        tool = get_gremlin_tool()
        labels = tool.query_all_categories()

        return json.dumps({
            "available_categories": labels,
            "count": len(labels),
            "description": "Live policy categories from CosmosDB Gremlin API",
            "source": "Azure CosmosDB Gremlin API"
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": f"Failed to fetch categories: {str(e)}",
            "available_categories": [],
            "count": 0
        }, indent=2)


def search_policies_by_term(search_term: str) -> str:
    """
    MCP tool function: Search policies by keyword.

    Args:
        search_term: Keyword to search for

    Returns:
        JSON string with matching graph data
    """
    try:
        tool = get_gremlin_tool()
        graph_data = tool.search_by_keyword(search_term, limit=30)

        return json.dumps(graph_data, indent=2)

    except Exception as e:
        return json.dumps({
            "error": f"Search failed: {str(e)}",
            "query": search_term,
            "nodes": [],
            "edges": []
        }, indent=2)


if __name__ == "__main__":
    # Test the tool
    print("=== Gremlin CosmosDB Tool Test ===\n")

    try:
        tool = GremlinCosmosTools()

        # Test 1: Get categories
        print("Test 1: Available categories (vertex labels)")
        categories = tool.query_all_categories()
        print(f"Found {len(categories)} categories: {categories}\n")

        # Test 2: Query by label
        if categories and len(categories) > 0:
            test_label = categories[0]
            print(f"Test 2: Query vertices with label '{test_label}'")
            graph = tool.query_by_label(test_label, limit=5)
            print(f"Graph: {graph['metadata']['node_count']} nodes, "
                  f"{graph['metadata']['edge_count']} edges\n")

            # Print sample node
            if graph['nodes']:
                print("Sample node:")
                print(json.dumps(graph['nodes'][0], indent=2))

        # Test 3: Search by keyword
        print("\nTest 3: Search for 'Crime'")
        search_result = tool.search_by_keyword("Crime", limit=5)
        print(f"Found {search_result['metadata']['node_count']} nodes\n")

        tool.close()

    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure:")
        print("1. .env file exists with CosmosDB credentials")
        print("2. Copy .env.example to .env and fill in your values")
        print("3. Required variables:")
        print("   - COSMOS_DB_ENDPOINT (wss://...)")
        print("   - COSMOS_DB_PRIMARY_KEY")
        print("   - COSMOS_DB_DATABASE_NAME")
        print("   - COSMOS_DB_CONTAINER_NAME")
        print("4. Endpoint uses wss:// protocol (not https://)")
        print("5. Network connectivity to Azure")
