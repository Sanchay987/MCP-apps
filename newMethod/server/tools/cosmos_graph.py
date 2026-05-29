"""
Cosmos DB live graph tool.

Queries Azure Cosmos DB Gremlin API and returns the graph JSON as the tool
result. The graph.html widget reads toolResult and renders an interactive
Cytoscape graph — no Next.js-side rendering code needed.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from cosmos.gremlin_client import query_graph
from mcp_apps import MCPAppsServer, UIResource


def register_cosmos_graph(mcp: MCPAppsServer, ui: UIResource) -> None:
    def handler(label: str = "BusinessRules", limit: int = 30) -> str:
        graph = query_graph(label, limit)
        return json.dumps(graph)

    mcp.register_app_tool(
        name="cosmos_graph_live",
        description=(
            "Query live regulatory policies from Azure Cosmos DB and visualise as an "
            "interactive graph. "
            "label: vertex label (BusinessRules | Obligations | Processes | Controls) "
            "or a keyword such as 'Bribery'. "
            "limit: max nodes to return (default 30)."
        ),
        input_schema={
            "label": {
                "type": "string",
                "description": "Vertex label or search keyword",
                "default": "BusinessRules",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of nodes to return",
                "default": 30,
            },
        },
        resource_uri=ui.uri,
        handler=handler,
    )
