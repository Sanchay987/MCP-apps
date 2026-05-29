"""
newMethod MCP Apps Server — Python implementation of MCP Apps standard (SEP-1865).

Server-driven UI: tools bundle HTML inside ui:// resources.
Any MCP Apps host (AppRenderer, Claude Desktop, ChatGPT, VS Code) renders the
same interactive widgets without any host-specific frontend code.

Port: 3002  (existing KPMG server runs on 3001)
Transport: SSE  (compatible with existing Next.js MCP client)
"""

import sys
from pathlib import Path

import uvicorn
from starlette.middleware.cors import CORSMiddleware

# Make server/ importable
sys.path.insert(0, str(Path(__file__).parent))

from mcp_apps import MCPAppsServer, create_ui_resource
from tools.calculator import register_calculator
from tools.cosmos_graph import register_cosmos_graph
from tools.risk_wizard import register_risk_wizard

# ---------------------------------------------------------------------------
# Load HTML widgets
# ---------------------------------------------------------------------------
UI = Path(__file__).parent / "ui"

calculator_ui  = create_ui_resource("ui://newmethod/calculator",  UI / "calculator.html",  "Calculator UI")
cosmos_ui      = create_ui_resource("ui://newmethod/cosmos-graph", UI / "graph.html",       "Cosmos Graph UI")
risk_wizard_ui = create_ui_resource("ui://newmethod/risk-wizard",  UI / "risk_wizard.html", "Risk Wizard UI")

# ---------------------------------------------------------------------------
# Build server
# ---------------------------------------------------------------------------
mcp = MCPAppsServer("newmethod-kpmg-mcp-apps", version="1.0.0")

# Register UI resources first (so read_resource works before tools are called)
mcp.register_app_resource(calculator_ui)
mcp.register_app_resource(cosmos_ui)
mcp.register_app_resource(risk_wizard_ui)

# Register tools (each tool gets linked to its UI resource)
register_calculator(mcp, calculator_ui)
register_cosmos_graph(mcp, cosmos_ui)
register_risk_wizard(mcp, risk_wizard_ui)

# ---------------------------------------------------------------------------
# ASGI app — SSE transport + /resource HTTP shortcut for AppRendererHost
# ---------------------------------------------------------------------------
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse
from starlette.routing import Route

# Gather registered resources for the HTTP shortcut
_all_resources = {r.uri: r for r in [calculator_ui, cosmos_ui, risk_wizard_ui]}


async def serve_resource(request: Request):
    """GET /resource?uri=ui://newmethod/calculator → returns the raw HTML.
    Used by AppRendererHost.tsx (direct iframe mode) to fetch widget HTML
    without going through the full MCP SSE protocol."""
    uri = request.query_params.get("uri", "")
    if not uri:
        return JSONResponse({"error": "uri param required"}, status_code=400)
    resource = _all_resources.get(uri)
    if resource is None:
        return JSONResponse({"error": f"Resource not found: {uri}"}, status_code=404)
    return HTMLResponse(resource.html)


# Merge the MCP SSE app routes with the /resource shortcut
_sse_app = mcp.sse_app()

from starlette.applications import Starlette
from starlette.routing import Route as StarletteRoute

app = Starlette(
    routes=[
        StarletteRoute("/resource", endpoint=serve_resource),
        *_sse_app.routes,
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 65)
    print("newMethod — MCP Apps Standard Server  (SEP-1865)")
    print("=" * 65)
    print("Port     : 3002")
    print("Transport: SSE  →  http://localhost:3002/sse")
    print()
    print("Tools:")
    print("  calculator          ui://newmethod/calculator")
    print("  cosmos_graph_live   ui://newmethod/cosmos-graph")
    print("  start_risk_wizard   ui://newmethod/risk-wizard")
    print()
    print("Resources (HTML widgets served at ui:// URIs):")
    for r in [calculator_ui, cosmos_ui, risk_wizard_ui]:
        print(f"  {r.uri}  ({len(r.html):,} bytes)")
    print("=" * 65 + "\n")

    uvicorn.run("server:app", host="0.0.0.0", port=3002, reload=False)
