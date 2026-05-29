# MCP Apps — Generative UI Proof of Concept

A proof of concept demonstrating how the **Model Context Protocol (MCP)** can be combined with **Generative UI** to let an AI chat interface automatically render structured tool responses as rich, interactive components.

The repository contains **two independent implementations** of the same idea:

| Folder | Approach | Description |
|---|---|---|
| `server/` + `frontend/` | **Client-driven UI** | Backend returns structured JSON. Frontend has hardcoded React components per tool. |
| `newMethod/` | **Server-driven UI (MCP Apps standard — SEP-1865)** | Backend bundles the HTML widget alongside the tool result. Frontend is generic — it renders whatever the server sends. |

Both implementations share the same data sources (mock JSON + live Azure Cosmos DB Gremlin graph) but illustrate different architectural philosophies.

---

## What This Demonstrates

The core idea: **when a tool returns structured data, the chat interface should render it as an interactive UI component — not as text.**

Three visualization categories are showcased:

- **Financial dashboards** — revenue summaries, metrics, alerts (mock data)
- **Knowledge graphs** — cloud security, audit methodology (mock data)
- **Regulatory policy graphs** — live data from Azure Cosmos DB Gremlin API

The same chat surface adapts its rendering to the shape of the data, allowing a single conversational interface to host many domain-specific views.

---

## Architecture

### Implementation 1 — Client-Driven UI (`server/` + `frontend/`)

```
User query
    ↓
Pattern matcher (frontend)
    ↓
MCP client over SSE
    ↓
MCP server (localhost:3001)
    ↓
Tool execution (Python)
    ↓
Structured JSON response
    ↓
Component dispatcher (frontend)
    ↓
Hardcoded React visualization
```

The frontend owns the rendering layer. Each tool maps to a specific React component selected at runtime.

### Implementation 2 — Server-Driven UI (`newMethod/`)

```
User query
    ↓
Chat router (frontend)
    ↓
Next.js API proxy → MCP SDK over SSE
    ↓
MCP server (localhost:3002)
    ↓
Tool returns text result + ui:// resource URI
    ↓
AppRendererHost fetches HTML widget
    ↓
Widget rendered in sandboxed iframe
    ↓
postMessage bridge for interaction
```

The server owns the rendering layer. Each tool ships its own self-contained HTML widget, so the same tool works in **any MCP-compliant host** (Claude Desktop, ChatGPT, VS Code, MCP Inspector, etc.) without writing host-specific code.

---

## Project Structure

```
POC_MCP_APPS/
│
├── server/                          # Client-driven backend (port 3001)
│   ├── mcp_server_web.py            # Main MCP server (SSE transport)
│   ├── mcp_server_enterprise.py     # Alternative stdio transport
│   └── tools/
│       ├── knowledge_graph.py       # Mock knowledge graph
│       ├── financial_summary.py     # Mock financial dashboard
│       ├── gremlin_cosmos.py        # Live Cosmos DB Gremlin tool
│       └── risk_wizard.py           # Risk assessment tool
│
├── frontend/                        # Client-driven Next.js app (port 3000)
│   ├── app/chat/page.tsx            # Main chat interface
│   ├── components/generative-ui/    # Hardcoded visualization components
│   │   ├── ComponentDispatcher.tsx
│   │   ├── KnowledgeGraph.tsx
│   │   └── FinancialDashboard.tsx
│   └── lib/
│       ├── mcp-client.ts            # MCP SSE client
│       └── types.ts
│
├── newMethod/                       # Server-driven MCP Apps implementation
│   ├── server/                      # Python MCP server (port 3002)
│   │   ├── server.py                # Entry point
│   │   ├── mcp_apps.py              # MCP Apps standard helper
│   │   ├── tools/                   # Tool registrations
│   │   ├── ui/                      # Self-contained HTML widgets
│   │   └── cosmos/gremlin_client.py # Cosmos DB client
│   └── frontend/                    # Standalone Next.js chat (port 3003)
│       ├── app/chat/page.tsx
│       ├── app/api/mcp/             # Server-side MCP proxy
│       └── components/AppRendererHost.tsx
│
├── RESTART_SERVERS.sh               # Restart both servers (Implementation 1)
├── START_work.sh                    # Start helper
├── .env                             # Cosmos DB credentials (not in git)
├── .env.example                     # Credentials template
├── requirements.txt                 # Python dependencies
├── pyproject.toml
└── uv.lock
```

---

## Prerequisites

- **Python 3.14+** with a virtual environment (`.venv/`)
- **Node.js 18+**
- **Azure Cosmos DB** account with Gremlin API enabled (for live data)
- Environment variables defined in `.env` (see `.env.example`)

---

## Quick Start

### Implementation 1 — Client-Driven UI

```bash
# One-command start
./RESTART_SERVERS.sh

# Or manually
.venv/bin/python3 server/mcp_server_web.py     # Terminal 1
cd frontend && npm run dev                      # Terminal 2
```

Open **http://localhost:3000/chat**

### Implementation 2 — Server-Driven UI (`newMethod/`)

```bash
cd newMethod/server && .venv/bin/python3 server.py   # Terminal 1
cd newMethod/frontend && npm run dev                  # Terminal 2
```

Open **http://localhost:3003/chat**

See `newMethod/QUICKSTART.md` for full instructions.

---

## Available Tools

### Implementation 1 (`server/`)

**Utility**
- `check_system_health` — OS, CPU, memory stats
- `calculate` — basic arithmetic
- `greet_user` — personalized greeting

**Knowledge Graph (mock)**
- `query_enterprise_knowledge_graph`
- `list_available_knowledge_topics`
- `summarize_knowledge_topic`

**Financial Dashboard (mock)**
- `query_financial_dashboard`
- `list_available_financial_reports`
- `summarize_financial_report`

**Regulatory Policies (live Cosmos DB)**
- `cosmosdb_query_regulatory_policies` — query by vertex label
- `cosmosdb_list_policy_categories` — list available labels
- `cosmosdb_search_policies` — keyword search

### Implementation 2 (`newMethod/`)

| Tool | Trigger | Widget |
|---|---|---|
| `calculator` | "open the calculator" | Interactive number pad |
| `cosmos_graph_live` | "show regulatory graph" | Live Cytoscape graph from Cosmos DB |
| `start_risk_wizard` | "start risk assessment" | 5-step assessment wizard |

---

## Example Queries

**Financial dashboards**
```
Show me the quarterly summary
Show me the client engagement summary
List financial reports
```

**Knowledge graphs (mock)**
```
Show me cloud security
Show me audit methodology
List available topics
```

**Regulatory policies (live)**
```
Show me regulatory BusinessRules
Show me regulatory Obligations
Show me policies about Bribery
List policy categories
```

---

## Technology Stack

**Backend**
- FastMCP (Model Context Protocol framework)
- Python 3.14
- Uvicorn + Starlette (SSE transport)
- `gremlinpython` (Azure Cosmos DB client)
- `psutil` (system metrics)

**Frontend**
- Next.js 15 with React 19
- TypeScript
- TailwindCSS
- `react-force-graph-2d` (Implementation 1)
- Cytoscape.js (Implementation 2 widget)
- `@modelcontextprotocol/sdk`

**Data sources**
- Mock JSON fixtures (financial + knowledge graph)
- Azure Cosmos DB Gremlin API (regulatory policy graph)

---

## Data Model — Cosmos DB

**Graph:** `regkg-graph-dev`
**Vertices:** ~100
**Categories:** `BusinessRules`, `Obligations`, `Processes`, `Controls`

Each vertex carries 5W1H metadata (`why`, `what`, `who`, `where`, `when`, `how`) along with the originating document name and page number for traceability.

Sample entries:
- `Economic_Crime_Prevention_Policy`
- `Anti-Bribery_Legislation_Compliance`
- `Economic_Crime_Risk_Management_Process`

---

## Security & Configuration

- Credentials live in `.env` and are excluded from version control via `.gitignore`.
- CORS is restricted to `localhost:3000` / `localhost:3003` for the POC.
- No authentication layer is included — this is a demonstration build, not a production deployment.

Required environment variables (see `.env.example`):

```
COSMOS_DB_ENDPOINT
COSMOS_DB_PRIMARY_KEY
COSMOS_DB_DATABASE_NAME
COSMOS_DB_CONTAINER_NAME
COSMOS_DB_GREMLIN_USERNAME
```

---

## Troubleshooting

**Ports already in use**
```bash
lsof -i :3000 :3001 :3002 :3003
pkill -f mcp_server_web
pkill -f "next dev"
./RESTART_SERVERS.sh
```

**Cosmos DB returns 0 entities**
Usually caused by running the server outside the virtual environment. Always start with:
```bash
.venv/bin/python3 server/mcp_server_web.py
```

**Asyncio event loop conflicts**
Ensure `gremlin_cosmos.py` runs Gremlin calls inside a `ThreadPoolExecutor` (already wired in the current code).

---

## Verifying the Setup

```bash
# 1. Test live Cosmos DB connection
.venv/bin/python3 server/tools/gremlin_cosmos.py

# 2. Boot the backend
.venv/bin/python3 server/mcp_server_web.py

# 3. Boot the frontend
cd frontend && npm run dev

# 4. Open http://localhost:3000/chat and exercise each tool
```

Expected outcomes:
- Cloud Security → 8 nodes, 11 edges
- KPMG-style financial dashboard renders revenue + alerts
- Business Rules (live) → 10+ nodes streamed from Cosmos DB
- Search "Bribery" → returns anti-bribery policy vertices

---

## Roadmap

**Near term**
- Containerization (Docker / Compose)
- Architecture and sequence diagrams as living documentation
- Comparative write-up: client-driven vs. server-driven UI trade-offs

**Toward production**
- Authentication and per-user sessions
- Production-grade CORS and rate limiting
- Persistent message history
- Real LLM-driven tool selection (replacing the keyword router)
- Observability: structured logging, tracing, metrics
- Container orchestration (Kubernetes / managed service)

---

## License

Internal proof of concept. Not for redistribution.
