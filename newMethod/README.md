# newMethod — MCP Apps Standard (SEP-1865)

A completely standalone project demonstrating the **MCP Apps standard** for server-driven UI.

> **Nothing in this folder connects to the old `frontend/` or `server/` at the repo root.**

---

## What this is

The **MCP Apps standard** (SEP-1865) flips how tool UIs work:

| Old way (client-driven) | newMethod (server-driven) |
|---|---|
| Server returns JSON | Server returns JSON **+** bundles the HTML widget |
| Frontend has hardcoded React components per tool | Frontend is "dumb" — just renders whatever the server sends |
| Tool only works in _this_ chat app | Tool renders in Claude Desktop, ChatGPT, VS Code, MCP Inspector — everywhere |
| Add a new UI → edit the frontend | Add a new UI → edit one HTML file on the server |

---

## Project structure

```
newMethod/
│
├── server/                    Python MCP server (port 3002)
│   ├── server.py              Entry point — starts server, registers tools & resources
│   ├── mcp_apps.py            Python mirror of @modelcontextprotocol/ext-apps
│   ├── requirements.txt       Python dependencies
│   ├── .env.example           Required env vars (Cosmos DB credentials)
│   │
│   ├── tools/
│   │   ├── calculator.py      Calculator tool registration
│   │   ├── cosmos_graph.py    Live Cosmos DB graph tool registration
│   │   └── risk_wizard.py     5-step Risk Wizard tool registration
│   │
│   ├── ui/                    Self-contained HTML widgets (the "server-driven UI")
│   │   ├── calculator.html    Interactive number pad
│   │   ├── graph.html         Cytoscape.js graph (live or mock data)
│   │   └── risk_wizard.html   5-step assessment wizard
│   │
│   └── cosmos/
│       └── gremlin_client.py  Azure Cosmos DB Gremlin client (live + mock fallback)
│
└── frontend/                  Standalone Next.js chat app (port 3003)
    ├── app/
    │   ├── chat/page.tsx      Chat interface with keyword routing
    │   └── api/mcp/
    │       ├── tools/route.ts   Server-side proxy → lists MCP tools (GET)
    │       └── call/route.ts    Server-side proxy → calls MCP tool (POST)
    ├── components/
    │   └── AppRendererHost.tsx  Fetches HTML widget → renders in sandboxed iframe
    ├── lib/mcp-client.ts      Thin fetch wrapper — calls /api/mcp/* (no SDK in browser)
    └── package.json           Isolated Node deps — no shared code with old frontend
```

---

## Tools

| Tool name | Trigger phrase | Widget |
|---|---|---|
| `calculator` | "open the calculator" | Interactive number pad, submits result to chat |
| `cosmos_graph_live` | "show regulatory graph" | Live Cytoscape graph from Azure Cosmos DB |
| `start_risk_wizard` | "start risk assessment" | 5-step wizard: client → engagement → risk factors → score → approve |

Each tool has a matching HTML widget served at a `ui://` URI. The widget is fetched by the frontend and rendered in a sandboxed iframe — the same HTML works in any MCP-compliant host.

---

## How to run

→ See **[QUICKSTART.md](./QUICKSTART.md)** for step-by-step instructions.

Short version:
```bash
# Terminal 1
cd newMethod/server && .venv/bin/python3 server.py

# Terminal 2
cd newMethod/frontend && npm run dev

# Open
http://localhost:3003/chat
```

---

## The mcp_apps.py helper

`server/mcp_apps.py` is a ~150-line Python equivalent of the TypeScript `@modelcontextprotocol/ext-apps` + `@mcp-ui/server` packages. It provides:

```python
create_ui_resource(uri, html)          # wrap HTML as a ui:// resource
MCPAppsServer.register_app_resource()  # register the resource handler
MCPAppsServer.register_app_tool()      # register a tool with _meta.ui.resourceUri
MCPAppsServer.sse_app()               # return a Starlette ASGI app
```

The server also exposes a plain HTTP shortcut:
```
GET /resource?uri=ui://newmethod/calculator  →  returns the raw HTML
```

This is used by `AppRendererHost.tsx` to fetch widget HTML without going through the full MCP SSE protocol.

---

## Architecture: how one tool call renders a widget

```
User types "open the calculator"
    │
    ▼
chat/page.tsx  keyword router  →  POST /api/mcp/call  { name: "calculator" }
    │                                         │
    │                         Next.js API route (Node.js, server-side)
    │                         uses @modelcontextprotocol/sdk to call
    │                         Python server via SSE on port 3002
    │                                         │
    ▼                                         ▼
Python server  handler()  →  returns text: "Calculator ready"
    │
    ▼
chat/page.tsx  sees toolName === "calculator"  →  mounts <AppRendererHost>
    │
    ▼
AppRendererHost  GET /resource?uri=ui://newmethod/calculator  →  gets HTML
    │
    ▼
<iframe srcDoc={html}>  loads calculator.html
    │
    ▼
iframe sends postMessage TOOL_INIT  →  widget receives toolInput
    │
    ▼
User interacts with widget
    │
    ▼
Widget sends postMessage TOOL_RESULT  →  AppRendererHost calls onMessage()
```

### Why the API proxy layer?

`@modelcontextprotocol/sdk` is a Node.js library. Importing it directly in a
`"use client"` component causes Turbopack to bundle hundreds of Node.js modules
for the browser — resulting in a compilation hang and out-of-memory crash.

Moving SDK usage to Next.js API routes (which run in Node.js) keeps the browser
bundle clean. `lib/mcp-client.ts` is now pure `fetch()` calls with zero Node.js
imports, so compilation is instant.
