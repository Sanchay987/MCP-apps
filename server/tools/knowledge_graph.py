"""
Knowledge Graph Tool - Enterprise Use Case for MCP

This tool simulates querying an enterprise knowledge base and returns
structured graph data (nodes and edges) for visualization in Generative UI.
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timezone


class KnowledgeGraphTool:
    """Enterprise knowledge graph query tool"""

    def __init__(self, data_file: str = None):
        """Initialize with mock data file"""
        if data_file is None:
            # Default to mock_data folder
            current_dir = Path(__file__).parent.parent
            data_file = current_dir / "mock_data" / "knowledge_graph_data.json"

        self.data_file = Path(data_file)
        self._load_data()

    def _load_data(self):
        """Load mock knowledge graph data"""
        try:
            with open(self.data_file, 'r') as f:
                self.graph_data = json.load(f)
        except FileNotFoundError:
            # Fallback to empty data
            self.graph_data = {}
            print(f"Warning: Data file {self.data_file} not found")

    def query(self, topic: str) -> Dict[str, Any]:
        """
        Query the knowledge graph for a specific topic.

        Args:
            topic: The topic to query (e.g., "cloud_security", "audit_methodology")

        Returns:
            Dictionary with nodes, edges, and metadata
        """
        # Normalize topic (lowercase, replace spaces with underscores)
        topic_key = topic.lower().replace(" ", "_").replace("-", "_")

        # Check if exact match exists
        if topic_key in self.graph_data:
            result = self.graph_data[topic_key].copy()
            result["query"] = topic
            result["timestamp"] = datetime.now(timezone.utc).isoformat() + "Z"
            return result

        # Check for partial matches
        for key in self.graph_data.keys():
            if topic_key in key or key in topic_key:
                result = self.graph_data[key].copy()
                result["query"] = topic
                result["timestamp"] = datetime.now(timezone.utc).isoformat() + "Z"
                result["metadata"]["match_type"] = "partial"
                return result

        # No match found - return available topics
        return {
            "error": "Topic not found",
            "query": topic,
            "available_topics": list(self.graph_data.keys()),
            "suggestion": f"Try one of: {', '.join(self.graph_data.keys())}",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }

    def get_available_topics(self) -> List[str]:
        """Get list of all available topics"""
        return list(self.graph_data.keys())

    def get_topic_summary(self, topic: str) -> Dict[str, Any]:
        """Get summary statistics for a topic"""
        result = self.query(topic)

        if "error" in result:
            return result

        return {
            "topic": result["metadata"]["topic"],
            "node_count": result["metadata"]["node_count"],
            "edge_count": result["metadata"]["edge_count"],
            "node_types": list(set(node["type"] for node in result["nodes"])),
            "relationship_types": list(set(edge["relationship"] for edge in result["edges"]))
        }


# Singleton instance for use in MCP server
_kg_tool = None


def get_knowledge_graph_tool() -> KnowledgeGraphTool:
    """Get or create singleton instance"""
    global _kg_tool
    if _kg_tool is None:
        _kg_tool = KnowledgeGraphTool()
    return _kg_tool


def query_knowledge_graph(topic: str) -> str:
    """
    MCP tool function: Query enterprise knowledge graph.

    This function is designed to be registered as an MCP tool.
    It returns structured JSON that can be rendered as an interactive
    graph visualization in the frontend (Generative UI).

    Args:
        topic: Topic to query (e.g., "cloud security", "audit methodology", "tax compliance")

    Returns:
        JSON string with graph structure (nodes, edges, metadata)
    """
    tool = get_knowledge_graph_tool()
    result = tool.query(topic)

    # Return as formatted JSON string
    return json.dumps(result, indent=2)


def list_knowledge_topics() -> str:
    """
    MCP tool function: List all available knowledge graph topics.

    Returns:
        JSON string with list of available topics
    """
    tool = get_knowledge_graph_tool()
    topics = tool.get_available_topics()

    return json.dumps({
        "available_topics": topics,
        "count": len(topics),
        "description": "Topics available in the enterprise knowledge graph"
    }, indent=2)


def get_knowledge_summary(topic: str) -> str:
    """
    MCP tool function: Get summary of a knowledge graph topic.

    Args:
        topic: Topic to summarize

    Returns:
        JSON string with summary statistics
    """
    tool = get_knowledge_graph_tool()
    summary = tool.get_topic_summary(topic)

    return json.dumps(summary, indent=2)


if __name__ == "__main__":
    # Test the tool
    print("=== Knowledge Graph Tool Test ===\n")

    tool = KnowledgeGraphTool()

    # Test 1: Query existing topic
    print("Test 1: Query 'cloud security'")
    result = tool.query("cloud security")
    print(f"Found {result['metadata']['node_count']} nodes, {result['metadata']['edge_count']} edges\n")

    # Test 2: List topics
    print("Test 2: Available topics")
    print(tool.get_available_topics())
    print()

    # Test 3: Get summary
    print("Test 3: Topic summary")
    summary = tool.get_topic_summary("audit_methodology")
    print(json.dumps(summary, indent=2))
    print()

    # Test 4: Query non-existent topic
    print("Test 4: Query non-existent topic")
    result = tool.query("blockchain")
    print(json.dumps(result, indent=2))
