"""Calculator tool — the simplest MCP App, validates the pattern end-to-end."""

from __future__ import annotations
from mcp_apps import MCPAppsServer, UIResource

# server instance mcp = MCPAppsServer("my-server")
def register_calculator(mcp: MCPAppsServer, ui: UIResource) -> None:
    def handler(initial: str = "") -> str:
        msg = f"Calculator ready{f' — initial expression: {initial}' if initial else ''}."
        return msg

    mcp.register_app_tool(
        name="calculator",
        description=(
            "Open an interactive calculator widget. "
            "Supports +, -, ×, ÷ with history. "
            "The result is posted back to the chat when submitted."
        ),
        input_schema={
            "initial": {
                "type": "string",
                "description": "Optional starting expression (e.g. '12 * 7')",
            }
        },
        resource_uri=ui.uri,
        handler=handler,
    )
