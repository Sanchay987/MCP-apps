# QUICKSTART — newMethod

> Completely standalone project. Zero connection to the old `frontend/` or `server/` folders.

---

## Folder map

```
newMethod/
├── server/      Python MCP server  →  port 3002
└── frontend/    Next.js chat app   →  port 3003
```

---

## First-time setup

Run these **once** from inside the `newMethod/` folder.

### 1. Python server

```bash
cd newMethod/server

# Create isolated virtual env
uv venv .venv --python 3.14

# Install Python dependencies
uv pip install -r requirements.txt --python .venv/bin/python3

# Copy Cosmos DB credentials (reuses the same keys as the root .env)
cp ../.env .env
```

> If `uv` is not installed: `brew install uv`

### 2. Frontend

```bash
cd newMethod/frontend

npm install

# Create env file
cp .env.local.example .env.local
```

---

## Running the project

Open **two terminals**:

### Terminal 1 — Python MCP server

```bash
cd newMethod/server
.venv/bin/python3 server.py
```

Expected output:
```
=================================================================
newMethod — MCP Apps Standard Server  (SEP-1865)
=================================================================
Port     : 3002
Transport: SSE  →  http://localhost:3002/sse

Tools:
  calculator          ui://newmethod/calculator
  cosmos_graph_live   ui://newmethod/cosmos-graph
  start_risk_wizard   ui://newmethod/risk-wizard
=================================================================
```

### Terminal 2 — Next.js frontend

```bash
cd newMethod/frontend
npm run dev
```

Expected output:
```
▲ Next.js 16.x (Turbopack)
- Local:  http://localhost:3003
✓ Ready in ~300ms
```

> The browser-side code no longer imports the MCP SDK directly — it calls
> Next.js API routes (`/api/mcp/tools` and `/api/mcp/call`) which proxy to the
> Python server. This keeps the browser bundle small and compilation fast.

### Open the app

**http://localhost:3003/chat**

---

## What you can do in the chat

Type any of these phrases or click the quick-action buttons:

| What to type | What happens |
|---|---|
| `open the calculator` | Interactive number-pad widget opens in the chat |
| `show regulatory graph` | Live Cytoscape graph from Azure Cosmos DB |
| `show obligations graph` | Graph filtered to Obligations nodes |
| `show businessrules graph` | Graph filtered to BusinessRules nodes |
| `show controls graph` | Graph filtered to Controls nodes |
| `show processes graph` | Graph filtered to Processes nodes |
| `search policy bribery` | Graph filtered by keyword "bribery" |
| `start risk assessment wizard` | Full 5-step Risk Assessment Wizard |

---

## Ports at a glance

| Service | Port | URL |
|---|---|---|
| **newMethod frontend** | **3003** | **http://localhost:3003/chat** |
| **newMethod MCP server** | **3002** | **http://localhost:3002/sse** |
| Old KPMG frontend (separate project) | 3000 | not needed here |
| Old KPMG server (separate project) | 3001 | not needed here |

---

## Test the server alone (no browser needed)

```bash
npx @modelcontextprotocol/inspector http://localhost:3002/sse
```

Opens MCP Inspector — call any tool and the widget renders inside the Inspector's sandbox.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot connect to MCP server` in browser | Make sure Terminal 1 is running (`server.py`) |
| `uv: command not found` | `brew install uv` |
| Port 3002 already in use | `lsof -ti:3002 \| xargs kill` |
| Port 3003 already in use | `lsof -ti:3003 \| xargs kill` |
| Cosmos graph shows mock data | Check `newMethod/server/.env` has valid `COSMOS_DB_*` keys |
| `.env` not found | `cp ../.env newMethod/server/.env` from repo root |
| `npm run dev` hangs at "Compiling /chat …" + OOM | Caused by old code importing MCP SDK in the browser — make sure you have the latest `lib/mcp-client.ts` (uses plain `fetch`, not the SDK) |
