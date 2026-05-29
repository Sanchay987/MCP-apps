"""
mcp_apps.py — Python mirror of @modelcontextprotocol/ext-apps + @mcp-ui/server.

Provides:
  create_ui_resource(uri, html)           → UIResource
  MCPAppsServer
    .register_app_resource(resource)
    .register_app_tool(name, desc, schema, resource_uri, handler)
    .sse_app(messages_path)              → Starlette ASGI app
    .server                              → underlying mcp.server.Server

The server includes _meta.ui.resourceUri in every app-tool's schema so that
any MCP Apps-compliant host (AppRenderer, Claude Desktop, MCP Inspector) knows
which ui:// resource to fetch and render in the sandboxed iframe.
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from mcp import types
from mcp.server import Server


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class UIResource:
    uri: str
    html: str
    name: str = ""

    def __post_init__(self):
        if not self.name:
            self.name = self.uri.split("/")[-1]


def create_ui_resource(uri: str, html: str | Path, name: str = "") -> UIResource:
    """Mirror of TS createUIResource() — create a UIResource from HTML string or file."""
    if isinstance(html, Path):
        html = html.read_text(encoding="utf-8")
    return UIResource(uri=uri, html=html, name=name)


# ---------------------------------------------------------------------------
# MCPAppsServer
# ---------------------------------------------------------------------------

class MCPAppsServer:
    """
    Wraps mcp.server.Server to provide the MCP Apps standard API:
    - Registers ui:// resources (mimeType text/html)
    - Attaches _meta.ui.resourceUri to tool schemas
    - Exposes an ASGI SSE app ready for uvicorn
    """

    def __init__(self, name: str, version: str = "1.0.0"):
        self._server = Server(name)
        self._tools: dict[str, dict[str, Any]] = {}
        self._resources: dict[str, UIResource] = {}
        self._version = version
        self._wire_handlers()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register_app_resource(self, resource: UIResource) -> None:
        """Register a ui:// resource. Called before the server starts."""
        self._resources[resource.uri] = resource

    def register_app_tool(
        self,
        name: str,
        description: str,
        input_schema: dict[str, Any],
        resource_uri: str,
        handler: Callable,
    ) -> None:
        """
        Register a tool with _meta.ui.resourceUri.
        input_schema: dict of param_name → JSON-Schema property dict.
        handler: sync or async callable whose kwargs match input_schema keys.
        """
        # Include resourceUri in TWO places:
        #   1. _meta (official MCP Apps path, picked up by AppRenderer)
        #   2. x-ui-resource-uri inside inputSchema (guaranteed to survive
        #      any SDK version's serialization, used by AppRendererHost.tsx)
        properties = dict(input_schema)
        full_schema = {
            "type": "object",
            "properties": properties,
            "x-ui-resource-uri": resource_uri,
        }
        self._tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": full_schema,
            "resource_uri": resource_uri,
            "handler": handler,
        }

    @property
    def server(self) -> Server:
        return self._server

    def sse_app(self, messages_path: str = "/messages/"):
        """Return a Starlette ASGI app with SSE transport on /sse and POST on messages_path."""
        from mcp.server.sse import SseServerTransport
        from starlette.applications import Starlette
        from starlette.routing import Mount, Route
        from starlette.requests import Request

        sse = SseServerTransport(messages_path)
        mcp_server = self._server

        async def handle_sse(request: Request):
            async with sse.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                await mcp_server.run(
                    streams[0],
                    streams[1],
                    mcp_server.create_initialization_options(),
                )

        return Starlette(
            routes=[
                Route("/sse", endpoint=handle_sse),
                Mount(messages_path, app=sse.handle_post_message),
            ]
        )

    # ------------------------------------------------------------------
    # Internal: wire up mcp.server.Server handlers equivalent to api
    # ------------------------------------------------------------------

    def _wire_handlers(self):
        @self._server.list_tools()
        async def _list_tools() -> list[types.Tool]:
            result = []
            for t in self._tools.values():
                # Best-effort: inject _meta via model_validate (SDK >= 1.27 allows extra fields)
                tool_dict = {
                    "name": t["name"],
                    "description": t["description"],
                    "inputSchema": t["inputSchema"],
                    "_meta": {"ui": {"resourceUri": t["resource_uri"]}},
                }
                try:
                    tool = types.Tool.model_validate(tool_dict)
                except Exception:
                    tool = types.Tool(
                        name=t["name"],
                        description=t["description"],
                        inputSchema=t["inputSchema"],
                    )
                result.append(tool)
            return result

        @self._server.call_tool()
        async def _call_tool(
            name: str, arguments: dict | None
        ) -> list[types.TextContent]:
            if name not in self._tools:
                raise ValueError(f"Unknown tool: {name}")
            handler = self._tools[name]["handler"]
            args = arguments or {}
            try:
                if asyncio.iscoroutinefunction(handler):
                    result = await handler(**args)
                else:
                    result = handler(**args)
            except Exception as exc:
                result = json.dumps({"error": str(exc)})
            text = result if isinstance(result, str) else json.dumps(result)
            return [types.TextContent(type="text", text=text)]

        @self._server.list_resources()
        async def _list_resources() -> list[types.Resource]:
            return [
                types.Resource(
                    uri=r.uri,        # type: ignore[arg-type]
                    name=r.name,
                    mimeType="text/html",
                )
                for r in self._resources.values()
            ]

        @self._server.read_resource()
        async def _read_resource(uri) -> str:
            uri_str = str(uri)
            if uri_str not in self._resources:
                raise ValueError(f"Unknown resource: {uri_str}")
            return self._resources[uri_str].html
