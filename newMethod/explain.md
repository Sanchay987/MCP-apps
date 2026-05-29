# explain.md — Complete Demo Guide for `newMethod/`

> Everything you need to demo this project: what it is, what each file does, the exact data flow, and what to say. Read this once and you'll be able to answer any question.

---

## Table of contents

1. [The one-sentence pitch](#1-the-one-sentence-pitch)
2. [What is MCP?](#2-what-is-mcp)
3. [What is the MCP Apps Standard (SEP-1865)?](#3-what-is-the-mcp-apps-standard-sep-1865)
4. [Old method vs newMethod — visual comparison](#4-old-method-vs-newmethod--visual-comparison)
5. [Architecture: what runs where](#5-architecture-what-runs-where)
6. [Folder structure — every file explained](#6-folder-structure--every-file-explained)
7. [The three tools in detail](#7-the-three-tools-in-detail)
8. [End-to-end flow: user types → widget appears](#8-end-to-end-flow-user-types--widget-appears)
9. [The "click-to-detail" flow (the wow moment)](#9-the-click-to-detail-flow-the-wow-moment)
10. [What is a sandboxed iframe and why does it matter?](#10-what-is-a-sandboxed-iframe-and-why-does-it-matter)
11. [`mcp_apps.py` — our Python `ext-apps` mirror](#11-mcp_appspy--our-python-ext-apps-mirror)
12. [Why this matters for KPMG (talking points)](#12-why-this-matters-for-kpmg-talking-points)
13. [Demo script — what to say, what to show](#13-demo-script--what-to-say-what-to-show)
14. [Q&A — common questions](#14-qa--common-questions)
15. [Glossary](#15-glossary)

---

## 1. The one-sentence pitch

> **We built three KPMG tools (Calculator, Live Cosmos DB Graph, 5-step Risk Wizard) where the UI lives on the server, not the frontend — so the same interactive widget renders inside our chat app, Claude Desktop, ChatGPT, VS Code, or any MCP-compliant host without us writing a single line of host-specific code.**

That's the entire value proposition. Everything else explains how.

---

## 2. What is MCP?

**MCP = Model Context Protocol.** It's an open standard (created by Anthropic, now adopted by OpenAI, Google, Microsoft, etc.) that defines **how AI models talk to external systems** — databases, APIs, internal tools, file systems.

Before MCP, every AI integration was custom: ChatGPT had plugins, Claude had its own tool format, every chatbot reinvented the wheel. MCP unified that.

**The core idea:**
- An **MCP server** exposes capabilities — `tools` (functions the AI can call), `resources` (files/data the AI can read), `prompts` (templates)
- An **MCP client** (Claude Desktop, our chat app, ChatGPT, etc.) connects to the server and lets the AI use those capabilities
- They talk JSON-RPC over a transport — usually **stdio** (for local) or **SSE/HTTP** (for remote)

**In our project:**
- The Python server at `newMethod/server/server.py` is the MCP server
- The Next.js chat at `newMethod/frontend/` is the MCP client
- They talk SSE over `http://localhost:3002/sse`

---

## 3. What is the MCP Apps Standard (SEP-1865)?

This is the breakthrough. SEP-1865 is an extension to MCP that adds **UI to tools**.

Plain MCP says: a tool returns text or structured data. The host decides how to display it.

MCP Apps says: a tool **also** ships a `ui://...` resource containing the **HTML/JS widget** for displaying the result. The host renders that HTML in a sandboxed iframe. Same widget works everywhere.

**Two protocol pieces are added:**

1. **A `ui://...` resource** registered on the server — `mimeType: text/html`, content is the widget HTML
2. **`_meta.ui.resourceUri` on the tool definition** — tells the host "when you call this tool, render this UI resource"

Hosts that support MCP Apps:
- Claude Desktop
- ChatGPT (Enterprise)
- VS Code (Copilot Chat)
- Postman
- MCP Inspector
- **Our newMethod frontend** (custom implementation)

---

## 4. Old method vs newMethod — visual comparison

### Old method (the existing `frontend/` + `server/` in the repo root)

```
┌─────────────┐  JSON       ┌──────────────────┐  React        ┌────────────┐
│ Python      │ ──tool───►  │ Next.js frontend │ ──custom──►   │ User sees  │
│ MCP server  │             │ (hardcoded UI)   │   component   │   UI       │
└─────────────┘             └──────────────────┘               └────────────┘

Problem: tool only works in OUR chat app. Open it in Claude Desktop?
→ ugly raw JSON.
```

### newMethod (this folder)

```
┌─────────────┐  JSON + HTML  ┌──────────────┐  sandboxed iframe  ┌────────────┐
│ Python MCP  │ ──tool─────►  │ Any MCP host │ ──renders HTML──►  │ User sees  │
│ App server  │   widget      │ (passive)    │     directly       │   UI       │
└─────────────┘               └──────────────┘                    └────────────┘

Result: same widget renders identically in our chat, Claude, ChatGPT,
        Copilot. Write once. Render everywhere.
```

| Aspect | Old method | newMethod |
|---|---|---|
| Where the UI lives | Next.js React components | HTML files on the Python server |
| Adding a new tool UI | Edit frontend + redeploy | Edit one HTML file on the server |
| Works in Claude Desktop | No (raw JSON) | Yes (iframe renders same widget) |
| Works in ChatGPT | No | Yes |
| Client-side code per tool | One React component each | Zero |
| Standard | Custom (KPMG only) | MCP Apps (SEP-1865, industry) |

---

## 5. Architecture: what runs where

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Your machine                                                               │
│                                                                            │
│  ┌───────────────────────────────┐         ┌──────────────────────────┐   │
│  │ newMethod/server  (port 3002) │  ◄────► │ newMethod/frontend       │   │
│  │ Python · uvicorn · FastMCP    │   SSE   │ (port 3003)              │   │
│  │                               │   over  │ Next.js · React          │   │
│  │ - mcp_apps.py                 │  HTTP   │                          │   │
│  │ - tools/calculator.py         │         │ - app/chat/page.tsx      │   │
│  │ - tools/cosmos_graph.py       │         │ - components/            │   │
│  │ - tools/risk_wizard.py        │         │     AppRendererHost.tsx  │   │
│  │ - cosmos/gremlin_client.py    │         │ - lib/mcp-client.ts      │   │
│  │ - ui/calculator.html          │         │                          │   │
│  │ - ui/graph.html               │         │ Connects to /sse         │   │
│  │ - ui/risk_wizard.html         │         │ Fetches HTML from        │   │
│  │                               │         │   /resource?uri=...      │   │
│  └─────┬─────────────────────────┘         └──────────────────────────┘   │
│        │                                                                   │
│        │ wss://                                                            │
│        ▼                                                                   │
│  ┌─────────────────────────────────────┐                                  │
│  │ Azure Cosmos DB (Gremlin API)       │                                  │
│  │ <database> / <graph>                │                                  │
│  │ Vertices: BusinessRules,            │                                  │
│  │   Obligations, Processes, Controls  │                                  │
│  └─────────────────────────────────────┘                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Three running processes when demoing:**

| Process | Started by | Port | Purpose |
|---|---|---|---|
| Python MCP server | `.venv/bin/python3 server.py` | 3002 | Exposes tools + widget HTML |
| Next.js frontend | `npm run dev` | 3003 | Chat app the user interacts with |
| Azure Cosmos DB | (already running in Azure) | n/a | Live regulatory policy graph data |

---

## 6. Folder structure — every file explained

```
newMethod/
├── PLAN.md                          ← original plan, marked done
├── QUICKSTART.md                    ← how to run it
├── README.md                        ← high-level overview
├── explain.md                       ← THIS FILE — the demo deep-dive
│
├── server/                          ← Python MCP server (port 3002)
│   ├── server.py
│   ├── mcp_apps.py
│   ├── requirements.txt
│   ├── .env                         (Cosmos credentials)
│   ├── .env.example
│   ├── .gitignore
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── calculator.py
│   │   ├── cosmos_graph.py
│   │   └── risk_wizard.py
│   │
│   ├── ui/                          ← The HTML widgets — THE KEY DELIVERABLE
│   │   ├── calculator.html
│   │   ├── graph.html
│   │   └── risk_wizard.html
│   │
│   └── cosmos/
│       ├── __init__.py
│       └── gremlin_client.py
│
└── frontend/                        ← Standalone Next.js chat (port 3003)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                 (redirects → /chat)
    │   ├── globals.css              (dark KPMG theme)
    │   └── chat/page.tsx            (the chat interface)
    ├── components/
    │   └── AppRendererHost.tsx      (the bridge — fetches HTML, renders iframe)
    ├── lib/
    │   └── mcp-client.ts            (MCP SSE wrapper)
    ├── package.json
    ├── tsconfig.json
    └── .env.local.example
```

### Server-side files in detail

#### `server/server.py`
The entry point. Three things happen here:
1. **Loads HTML widgets** — reads `ui/calculator.html`, `ui/graph.html`, `ui/risk_wizard.html` from disk and wraps them as `UIResource` objects
2. **Registers tools + resources** — calls `register_calculator`, `register_cosmos_graph`, `register_risk_wizard` on the `MCPAppsServer` instance
3. **Boots the ASGI app** — exposes two routes:
   - `GET /sse` — the standard MCP SSE transport
   - `GET /resource?uri=ui://...` — a plain HTTP shortcut so `AppRendererHost` can fetch widget HTML with a normal `fetch()` call, no MCP handshake needed

#### `server/mcp_apps.py`
The heart of the project — our **Python equivalent** of the TypeScript `@modelcontextprotocol/ext-apps` + `@mcp-ui/server` libraries. Three public APIs:

```python
create_ui_resource(uri, html)              # wrap HTML as a UIResource
mcp.register_app_resource(resource)        # register a ui:// resource
mcp.register_app_tool(name, description,   # register a tool with
                      input_schema,        #   _meta.ui.resourceUri attached
                      resource_uri,        #
                      handler)             #
mcp.sse_app()                              # return a Starlette ASGI app
```

Under the hood it wraps `mcp.server.Server` from the official Python SDK. When the host calls `listTools()`, every tool's schema includes `_meta: { ui: { resourceUri: "ui://..." } }` — exactly the format defined by SEP-1865.

#### `server/tools/calculator.py`
Registers the `calculator` tool. The handler just returns a confirmation string — the **actual UI is in the HTML widget**. Input schema accepts an optional `initial` expression so you can call `calculator(initial="12 * 7")` and the widget pre-fills with that.

#### `server/tools/cosmos_graph.py`
Registers `cosmos_graph_live`. The handler calls `cosmos.gremlin_client.query_graph(label, limit)` to fetch live data from Azure, then returns the result as JSON in the text content. The `graph.html` widget reads this JSON and draws the interactive Cytoscape graph.

#### `server/tools/risk_wizard.py`
Registers `start_risk_wizard`. The handler returns the static configuration data (clients, engagement types, risk factor weights). The widget runs all 5 wizard steps inside the iframe — the server is called **once**, never again until the user clicks "Submit assessment".

#### `server/cosmos/gremlin_client.py`
Connects to Azure Cosmos DB Gremlin API. **Critical engineering note**: the entire Gremlin flow (create client → run query → close) runs inside a `ThreadPoolExecutor` with its own fresh `asyncio` event loop. This is the only way to use `gremlin-python` from inside uvicorn — uvicorn already owns the main thread's event loop, and Gremlin needs its own.

If Cosmos is unreachable, returns 11 nodes of mock data so the UI is never empty.

#### `server/ui/calculator.html`
Self-contained HTML page — number pad, +−×÷, display, "Submit" button. On submit, posts `{type:'TOOL_RESULT', result, expression}` to `window.parent` via `postMessage`. ~8 KB total.

#### `server/ui/graph.html`
Self-contained HTML page that loads Cytoscape.js from CDN. Features:
- 5 type colours (BusinessRules, Obligations, Processes, Controls, default)
- COSE layout (force-directed) with high node repulsion so nodes spread out
- Hover → tooltip with name + description
- Click node → side panel slides in showing What/Why/Who/Where/When/How + all properties + connections + raw JSON toggle
- Click node → **also** posts `NODE_SELECTED` to parent so the chat can render a detail card
- Click edge → side panel shows relationship + link strength + document source
- Clickable legend filters by type
- Floating zoom controls

#### `server/ui/risk_wizard.html`
Self-contained 5-step wizard:
1. Pick client (TechCorp / Acme / GlobalBank)
2. Pick engagement type (Audit / Tax / Advisory)
3. Multi-select risk factors with weights
4. Computed score + HIGH/MEDIUM/LOW rating + summary
5. Approve or Escalate → confirmation card

All state lives in JS inside the iframe. Server is only re-called if/when user clicks "Submit".

### Frontend files in detail

#### `frontend/app/chat/page.tsx`
The chat interface. Responsibilities:
1. **Connects to MCP server** on mount via `getMCPClient().connect('http://localhost:3002/sse')`
2. **Keyword routing** — `route(input)` function maps "show controls graph" → `cosmos_graph_live({label:'Controls'})`, "start risk assessment" → `start_risk_wizard()`, etc.
3. **Renders messages**:
   - User bubble (right, blue)
   - System bubble (full-width, info)
   - Assistant text bubble (left, dark)
   - Assistant with `toolCall` that's an MCP App → renders `<AppRendererHost>`
   - Assistant with `nodeDetail` → renders `<NodeDetailCard>` (the post-click card)
4. **Quick-action buttons** at the bottom for one-click demos
5. **Handles `onMessage` from AppRendererHost** — when the iframe posts `NODE_SELECTED`, appends a new chat message with the full node data

#### `frontend/components/AppRendererHost.tsx`
The **bridge** between MCP and the iframe. Three jobs:

1. **Fetches widget HTML** — `fetch('/resource?uri=ui://newmethod/calculator')` → loads the HTML once
2. **Injects data into iframe** — on `onLoad`, posts `{type:'TOOL_INIT', toolInput, toolResult}` to `iframe.contentWindow`
3. **Listens for messages back** — guards with `e.source === iframeRef.current.contentWindow` so multiple mounted widgets don't fire each other's listeners; forwards `TOOL_RESULT`, `NODE_SELECTED`, `EDGE_SELECTED` to the parent via `onMessage`

The iframe is `sandbox="allow-scripts allow-same-origin allow-forms"` — safe by default.

#### `frontend/lib/mcp-client.ts`
Thin wrapper around `@modelcontextprotocol/sdk` Client + SSE transport. Exposes `connect()`, `callTool()`, `getTools()`, `getToolResourceUri()`. Surfaces our custom `x-ui-resource-uri` field from the inputSchema so the frontend knows which tools are MCP Apps.

#### `frontend/app/globals.css`
The KPMG dark navy/teal theme (`#0d1b2a` background, `#00b4d8` accent). Sets fonts and scrollbar colors. Tailwind v4 imported but the chat page uses inline styles to keep everything in one file.

---

## 7. The three tools in detail

### 7.1 Calculator (the simplest — validates the pattern)

**Why it exists:** simplest possible widget to prove the round-trip works.

**Flow:**
```
User types "open the calculator"
   ↓
chat/page.tsx routes to → calculator tool
   ↓
Python handler returns "Calculator ready"  (the text doesn't matter — the UI is the point)
   ↓
AppRendererHost fetches ui://newmethod/calculator → calculator.html
   ↓
Iframe renders the number pad
   ↓
User clicks digits → JS in the iframe maintains expression
   ↓
User clicks "Submit to Chat ↑" → postMessage({type:'TOOL_RESULT', result, expression})
   ↓
AppRendererHost forwards to chat → console logs the result
```

**Talking point:** "This is the simplest possible MCP App. The Python server just says 'I have a calculator', and ships the HTML for the actual UI. If you open the exact same server in Claude Desktop, the same calculator appears there — we never write Mac/web/VS Code-specific code."

### 7.2 Cosmos Graph (the live data showcase)

**Why it exists:** prove this works with real enterprise data.

**Flow:**
```
User types "show controls graph"
   ↓
chat/page.tsx routes to → cosmos_graph_live({label:'Controls', limit:30})
   ↓
Python handler calls gremlin_client.query_graph('Controls')
   ↓
gremlin_client spawns ThreadPoolExecutor → fresh asyncio loop → connects to Azure
   ↓
Gremlin: g.V().hasLabel('Controls').limit(30).valueMap(true)
   ↓
_transform() parses node_attributes JSON, builds nodes + edges
   ↓
Returns {nodes, edges, metadata} as JSON
   ↓
AppRendererHost loads graph.html → posts TOOL_INIT with the graph data
   ↓
graph.html reads it → Cytoscape COSE layout → interactive graph renders
   ↓
User clicks a node → side panel + posts NODE_SELECTED to chat
   ↓
chat/page.tsx renders NodeDetailCard with all What/Why/Who/Where/When/How fields
```

**Talking point:** "Live regulatory policy data from Azure Cosmos DB. 30 nodes, real Bribery Act 2010 obligations, real ID schemes. Click any node — every regulatory attribute appears as a structured card in the chat. The graph rendering, the click handling, the card layout — all driven by HTML files on the server. Zero React code per tool."

### 7.3 Risk Wizard (the multi-step interactive showcase)

**Why it exists:** prove a complex multi-step interaction works in the iframe — no chained tool calls needed.

**Flow:**
```
User types "start risk assessment"
   ↓
chat/page.tsx routes to → start_risk_wizard()
   ↓
Python handler returns {clients, engagement_types, risk_factors} — STATIC CONFIG
   ↓
AppRendererHost loads risk_wizard.html → posts config to iframe
   ↓
─── EVERYTHING BELOW HAPPENS INSIDE THE IFRAME ───
   ↓
Step 1: User picks client
   ↓
Step 2: User picks engagement type
   ↓
Step 3: User checks risk factors
   ↓
Step 4: JS computes score, shows HIGH/MEDIUM/LOW summary
   ↓
Step 5: User clicks Approve or Escalate
   ↓
Iframe posts TOOL_RESULT with final assessment payload
   ↓
chat/page.tsx receives the payload (could log, save, send to API)
```

**Talking point:** "Compare this to the old `server/tools/risk_wizard.py` — that chains FIVE separate tool calls, each round-tripping to the server. Here it's **one** tool call. The entire 5-step interaction lives in the iframe. Server stays stateless and is only re-called when the user finishes."

---

## 8. End-to-end flow: user types → widget appears

Step-by-step for `"show controls graph"`:

```
1. User types in input box
   chat/page.tsx → handleSubmit → send(text)

2. send() calls route(text)
   route() returns {name:'cosmos_graph_live', args:{label:'Controls', limit:30}}

3. send() pushes loading bubble, then calls client.callTool(...)
   lib/mcp-client.ts → SSE call → POST /messages/?session_id=...
   request body: {method:'tools/call', params:{name, arguments}}

4. Python server receives the call
   server/mcp_apps.py @server.call_tool() decorator
   → finds tool by name → calls handler(label='Controls', limit=30)

5. tools/cosmos_graph.py handler runs
   → calls cosmos/gremlin_client.py: query_graph('Controls', 30)

6. gremlin_client.py executes
   _run_in_thread spawns worker thread
   → fresh asyncio loop
   → Gremlin Client connects to the configured Cosmos DB endpoint (wss://...)
   → submits: g.V().hasLabel('Controls').limit(30).valueMap(true)
   → result: list of vertex dicts from Azure
   → _transform() builds {nodes:[...], edges:[...], metadata:{...}}

7. Handler returns JSON string
   mcp_apps wraps it as TextContent and sends back via SSE

8. Frontend receives result
   chat/page.tsx swaps loading bubble with content + toolCall metadata

9. Since toolCall.name is in TOOL_RESOURCE_MAP, isMCPAppTool() returns true
   Chat renders <AppRendererHost toolName='cosmos_graph_live' toolResult={...} />

10. AppRendererHost mounts
    useEffect fires fetch('http://localhost:3002/resource?uri=ui://newmethod/cosmos-graph')
    → receives ~24 KB of HTML
    → setHtml(html)

11. <iframe srcDoc={html} sandbox="allow-scripts ..."> renders

12. iframe onLoad fires
    handleLoad() posts {type:'TOOL_INIT', toolName, toolInput, toolResult} to iframe.contentWindow

13. Inside the iframe (graph.html)
    message handler receives TOOL_INIT
    → clears the 5s fallback timer
    → tryLoad(toolResult) → parses JSON → buildGraph(data)
    → Cytoscape instance created
    → COSE layout runs (800ms animation)
    → graph appears

14. User clicks a node
    Inside iframe: cy.on('tap', 'node', showDetail)
    showDetail() renders the side panel AND
    window.parent.postMessage({type:'NODE_SELECTED', payload:{node: fullRawNode}})

15. Back in AppRendererHost
    message handler receives NODE_SELECTED
    → guards: e.source === iframeRef.current.contentWindow (only THIS iframe)
    → onMessage?.(d) bubbles up to chat/page.tsx

16. chat/page.tsx onMessage handler
    sees type === 'NODE_SELECTED'
    extracts payload.node
    pushes new message: {role:'assistant', nodeDetail: node}

17. Chat re-renders
    new message has nodeDetail set → <NodeDetailCard node={node} />
    Card shows: name, type badge, description,
                What/Why/Who/Where/When/How blocks,
                all other properties, node ID
```

That's the complete journey. **15+ steps**. But the user just sees "I typed something → a graph appeared → I clicked → a detail card appeared." That's the magic.

---

## 9. The "click-to-detail" flow (the wow moment)

This is the feature that makes the demo memorable. Walk through it slowly:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Inside iframe (graph.html)                                          │
│                                                                      │
│  User clicks node                                                    │
│      ↓                                                               │
│  cy.on('tap', 'node', evt => showDetail(evt.target))                 │
│      ↓                                                               │
│  showDetail() does TWO things:                                       │
│    (a) renders side panel inside the iframe                          │
│    (b) window.parent.postMessage({                                   │
│          type: 'NODE_SELECTED',                                      │
│          payload: { node: d.raw }      ← FULL Cosmos record          │
│        }, '*')                                                       │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ postMessage
┌─────────────────────────────────────────────────────────────────────┐
│  Parent window (Next.js page)                                        │
│                                                                      │
│  AppRendererHost listener fires:                                     │
│    if (e.source !== iframeRef.current.contentWindow) return;         │
│      ← critical guard! prevents duplicate events when multiple       │
│        AppRendererHost components are mounted in the same chat       │
│                                                                      │
│    if (d.type === 'NODE_SELECTED') onMessage(d)                      │
│      ↓                                                               │
│  chat/page.tsx onMessage:                                            │
│    setMessages(prev => [...prev, {                                   │
│      role: 'assistant',                                              │
│      nodeDetail: payload.node,                                       │
│      ts: new Date()                                                  │
│    }])                                                               │
│      ↓                                                               │
│  React re-renders → new <NodeDetailCard /> appears in chat thread    │
└─────────────────────────────────────────────────────────────────────┘
```

**Why this is impressive in a demo:**
- User clicks **inside** a sandboxed iframe rendered by HTML the SERVER sent
- That click triggers a card to appear OUTSIDE the iframe, in the chat thread
- The card shows every What/Why/Who/Where/When/How attribute from Azure Cosmos DB
- All driven by `window.postMessage` — the standard browser API
- No special framework, no React reconciliation issues, no XSS risk

---

## 10. What is a sandboxed iframe and why does it matter?

This is the security backbone of the entire MCP Apps standard. If someone asks "isn't it dangerous to run HTML from a server inside your chat app?", this is your answer.

### 10.1 What is an iframe?

An `<iframe>` (Inline Frame) is an HTML element that embeds a **completely separate web page** inside another web page. Think of it like a window cut into a wall — you can see through it into another room, but the two rooms are separate.

In our project:
- The **outer page** is `http://localhost:3003/chat` — the Next.js chat app
- The **inner page** is the HTML widget (`calculator.html`, `graph.html`, `risk_wizard.html`) served by the Python server

Without any restrictions, an iframe could be dangerous — the inner page could read the outer page's data, steal session tokens, or inject malicious code. The `sandbox` attribute fixes that.

### 10.2 What does `sandbox` do?

The `sandbox` attribute on an iframe is a **permission whitelist**. By default it blocks EVERYTHING. You then explicitly re-enable only what you need.

```html
<!-- Our iframe in AppRendererHost.tsx -->
<iframe
  srcDoc={html}
  sandbox="allow-scripts allow-same-origin allow-forms"
  title="MCP App Widget"
/>
```

We granted exactly **three permissions**:

| Permission | What it allows | Why we need it |
|---|---|---|
| `allow-scripts` | The iframe can run JavaScript | Cytoscape.js, wizard logic, calculator — all require JS |
| `allow-same-origin` | The iframe is treated as same-origin (localhost) | Allows `postMessage` to work reliably; needed for Cytoscape CDN |
| `allow-forms` | The iframe can submit HTML forms | Risk wizard's multi-select uses form elements |

### 10.3 What the sandbox BLOCKS (the important part)

Everything not in that whitelist is **blocked by the browser**, at the OS level — not by our code:

| Blocked capability | What that means |
|---|---|
| Access to parent window's DOM | Widget cannot read or modify the chat app's HTML |
| Access to `document.cookie` | Widget cannot steal the user's login session |
| Access to `localStorage` / `sessionStorage` | Widget cannot read or write stored data in the chat app |
| Opening pop-ups / new windows | Widget cannot launch phishing windows |
| Running plugins (Flash, Java, etc.) | Not applicable but blocked regardless |
| Making top-level navigation | Widget cannot redirect the whole chat app to another URL |
| Accessing other iframes | If there are 3 widgets in the chat, each is isolated from the others |

**The widget is in a jail.** Even if a malicious MCP server sent harmful HTML — a keylogger, a redirect to a phishing site, code that tries to steal cookies — the browser would block all of it.

### 10.4 Visual: what the sandbox wall looks like

```
┌─────────────────────────────────────────────────────────┐
│  CHAT APP (localhost:3003)                              │
│  - User's session / cookies                             │
│  - Chat messages state                                  │
│  - React components                                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SANDBOXED IFRAME (srcDoc = widget HTML)         │   │
│  │                                                  │   │
│  │  ✓ Can run JavaScript (Cytoscape, wizard logic)  │   │
│  │  ✓ Can use forms                                 │   │
│  │  ✓ Can use postMessage ──────────────────────►  │   │
│  │                                         (only safe │   │
│  │  ✗ Cannot read parent's DOM             channel)  │   │
│  │  ✗ Cannot access cookies                          │   │
│  │  ✗ Cannot access localStorage                    │   │
│  │  ✗ Cannot open pop-ups                           │   │
│  │  ✗ Cannot redirect the page                      │   │
│  │  ✗ Cannot touch other iframes                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 10.5 How does the widget communicate despite the sandbox?

The only communication channel the sandbox allows is `window.postMessage()` — a browser-native API designed for safe cross-frame messaging. Both sides must explicitly opt in.

**Host → Widget (sending data in):**
```javascript
// AppRendererHost.tsx — after iframe loads
iframe.contentWindow.postMessage({
  type: 'TOOL_INIT',
  toolName: 'cosmos_graph_live',
  toolInput: { label: 'Controls' },
  toolResult: { content: [{ type: 'text', text: '{"nodes":[...]}' }] }
}, '*');
//    ↑ '*' means "any origin can receive this" — safe because we control both sides
```

**Widget → Host (sending results out):**
```javascript
// Inside graph.html — when user clicks a node
window.parent.postMessage({
  type: 'NODE_SELECTED',
  payload: { node: { id: '...', label: 'Bribery Act 2010', ... } }
}, '*');
```

**Host listens and guards against wrong senders:**
```javascript
// AppRendererHost.tsx
window.addEventListener('message', (e) => {
  // CRITICAL: only handle messages from THIS specific iframe
  // Prevents a malicious third-party site from injecting fake messages
  if (e.source !== iframeRef.current.contentWindow) return;

  if (e.data.type === 'NODE_SELECTED') {
    onMessage(e.data);  // safe — we know it's from our widget
  }
});
```

The `e.source` check is essential. Without it, any page in any tab could post fake `NODE_SELECTED` messages to our chat and inject arbitrary data.

### 10.6 Why `srcDoc` instead of `src`?

We use `srcDoc={html}` (inline HTML as a string) instead of `src="http://..."` (a URL).

Why this matters:
- **`src="http://..."` approach**: the iframe makes a network request. Even with sandbox, the browser must trust that URL. If someone intercepts the request and serves malicious HTML, it renders.
- **`srcDoc` approach**: the HTML is already in memory (we fetched it from our server and stored it). The browser renders it directly, never making another network request. The origin of `srcDoc` content is treated as `null` (opaque), providing even stronger isolation.

In our code (`AppRendererHost.tsx`):
```tsx
// 1. Fetch the widget HTML from our own server
const html = await fetch('http://localhost:3002/resource?uri=ui://newmethod/graph').then(r => r.text());

// 2. Inject it as srcDoc — no further network requests from the iframe
<iframe srcDoc={html} sandbox="allow-scripts allow-same-origin allow-forms" />
```

### 10.7 Real-world analogy

**Stripe Checkout** uses the exact same model. When you click "Pay with Stripe" on a website:
- A sandboxed iframe appears with Stripe's payment form
- The host website cannot read your card number (sandboxed)
- Stripe cannot steal the host website's cookies (sandboxed)
- After payment, Stripe posts a message (`{type: 'PAYMENT_SUCCESS', token: '...'}`) to the parent
- The host website receives the token and processes the order

Our MCP Apps widgets work identically:
- Sandboxed iframe contains the tool UI
- Host cannot be tampered with by the widget
- Widget cannot steal data from the host
- Widget posts results back via `postMessage`
- Host receives and renders the result in the chat

### 10.8 What to say in the demo

> "Every widget — the calculator, the graph, the wizard — runs inside a sandboxed iframe. That means the HTML the server sends us runs in complete isolation. It cannot read the user's session, cannot access our chat app's data, cannot even see what other widgets are showing. The only way it communicates with us is through a controlled `postMessage` channel where we verify the sender every time. This is the same security model that Stripe and PayPal use for embedded payment forms."

---

## 11. `mcp_apps.py` — our Python `ext-apps` mirror  

The TypeScript reference uses two npm packages:
```ts
import { registerAppTool, registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import { createUIResource } from '@mcp-ui/server';
```

There's no official Python equivalent yet. So we wrote **150 lines** that do the same thing.

### What it actually does

```python
# 1. Wrap HTML as a ui:// resource
def create_ui_resource(uri: str, html: str | Path) -> UIResource:
    if isinstance(html, Path):
        html = html.read_text(encoding="utf-8")
    return UIResource(uri=uri, html=html)


# 2. The server class
class MCPAppsServer:
    def __init__(self, name: str):
        self._server = Server(name)             # underlying mcp.server.Server
        self._tools = {}
        self._resources = {}
        self._wire_handlers()                    # attach @list_tools, @call_tool, etc.

    def register_app_tool(self, name, description, input_schema,
                          resource_uri, handler):
        properties = dict(input_schema)
        full_schema = {
            "type": "object",
            "properties": properties,
            "x-ui-resource-uri": resource_uri,   # ← our extension for discovery
        }
        self._tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": full_schema,
            "resource_uri": resource_uri,
            "handler": handler,
        }

    def _wire_handlers(self):
        @self._server.list_tools()
        async def _list_tools():
            return [
                Tool.model_validate({
                    "name": t["name"],
                    "description": t["description"],
                    "inputSchema": t["inputSchema"],
                    "_meta": {"ui": {"resourceUri": t["resource_uri"]}},
                    # ↑ THE KEY LINE — this is what SEP-1865 mandates
                })
                for t in self._tools.values()
            ]

        @self._server.call_tool()
        async def _call_tool(name, arguments):
            handler = self._tools[name]["handler"]
            result = handler(**(arguments or {}))
            return [TextContent(type="text", text=str(result))]

        @self._server.list_resources()
        async def _list_resources():
            return [Resource(uri=r.uri, name=r.name, mimeType="text/html")
                    for r in self._resources.values()]

        @self._server.read_resource()
        async def _read_resource(uri):
            return self._resources[str(uri)].html
```

### Why we wrote it

Three reasons:
1. **Consistency** — the existing KPMG server is Python. No Node.js toolchain.
2. **Education** — writing it ourselves means we understand the protocol exactly.
3. **It's tiny** — 150 lines to mirror two npm packages. The "magic" of MCP Apps is just `_meta.ui.resourceUri`.

---

## 12. Why this matters for KPMG (talking points)

These are the lines you say when leadership asks "so what?"

### 1. "Write once, render everywhere"
> "Our knowledge graph tool today only works in our chat. With MCP Apps, the same Cosmos DB graph renders inside Claude Desktop, ChatGPT Enterprise, GitHub Copilot, VS Code. If we want to give our auditors the graph inside their existing tools, we don't need to build new integrations — we just point them at our MCP server."

### 2. "Future-proof against AI vendor lock-in"
> "Today we might use Claude. Tomorrow OpenAI. The MCP Apps standard is supported by all of them. Our tools don't care which AI is in front of them."

### 3. "Cuts frontend engineering cost"
> "Currently every new tool needs a custom React component built and tested. With this pattern, the analyst who builds the Python tool also ships the UI — one HTML file. Frontend team becomes the platform team, not a bottleneck."

### 4. "Production-grade security"
> "Every widget runs in a sandboxed iframe. The widget can't access the host's cookies, localStorage, or other tools. This is the same isolation model used by Stripe Checkout."

### 5. "It's the industry standard now"
> "SEP-1865 was accepted in late 2025. Anthropic, OpenAI, Microsoft, Postman all support it. By adopting now we're aligned with the direction the AI tooling industry is moving."

---

## 13. Demo script — what to say, what to show

### Setup (do this before the demo starts)

Two terminals running:
```bash
# Terminal 1
cd newMethod/server && .venv/bin/python3 server.py

# Terminal 2
cd newMethod/frontend && npm run dev
```

Open **http://localhost:3003/chat** in a browser. Have MCP Inspector ready in another tab if asked.

### The demo (8-10 minutes)

**0:00 — Open the chat**
> "What you're seeing is our chat app — but unlike the previous version I showed you, the UI for every tool is going to come from the server, not from this React app. This is the MCP Apps standard."

**0:30 — Click "🧮 Calculator"**
> "Watch this. I'm calling a tool called `calculator`. The Python server responds with two things: a status message AND a pointer to an HTML widget. Our frontend renders the widget in a sandboxed iframe."
>
> *Calculator renders.*
>
> "I can type a math expression here, hit Submit — and the result is posted back to the chat. The point isn't the calculator itself — it's that the entire UI just came from the server. If I opened this same MCP server in Claude Desktop right now, the same calculator would appear in Claude."

**1:30 — Click "🕸 Regulatory Graph"**
> "Now the real thing. I'm querying Azure Cosmos DB. This is live data — 29 actual regulatory policy nodes from the configured database."
>
> *Graph renders, Cytoscape COSE layout settles.*
>
> "These are real BusinessRules — the Bribery Act 2010, Deputy Director Crown Function Offence, Statutory Instrument Approval. Real Cosmos DB IDs."

**2:30 — Click a node**
> "Here's the moment. I'm clicking on Bribery Act 2010."
>
> *Detail card appears in chat AND side panel slides in.*
>
> "Look — TWO things happened. The widget shows the detail in its sandboxed side panel, AND it posted a message to the chat which rendered this rich card. The card has every What/Why/Who/Where/When/How attribute from Cosmos."
>
> "This card is React, but its content came from an HTML widget the SERVER sent. The widget posted a `NODE_SELECTED` message via `window.postMessage` — and our chat rendered a beautiful card from it."

**4:00 — Show another graph**
> "Let me click 'Obligations'. Different label, fresh query to Cosmos, different nodes. Same widget code — we only wrote `graph.html` once."

**5:00 — Click "🧭 Risk Wizard"**
> "Now the multi-step interactive one. This is a 5-step risk assessment wizard."
>
> *Walk through: pick TechCorp → Audit → check several risk factors → see HIGH score → Escalate.*
>
> "Crucial detail: I just made ONE tool call. The previous version of this in our old server chained 5 separate MCP tool calls. Here, all 5 steps live inside the iframe. The server stays stateless."

**7:00 — Show MCP Inspector (optional impressive moment)**
```bash
npx @modelcontextprotocol/inspector http://localhost:3002/sse
```
> "And here's the same server running inside MCP Inspector — Anthropic's official testing tool. No code changed. The widgets render here too. This is what 'write once, render everywhere' means."

**8:00 — Close with the architecture point**
> "Everything you saw — the calculator, the live graph, the wizard, the click-to-card — is driven by three HTML files on the Python server. Zero React per-tool code. Zero host-specific work. This is the production model we should be aiming for."

---

## 14. Q&A — common questions

**Q: How does the iframe send messages back?**
A: `window.parent.postMessage(...)`. Standard browser API. The host listens with `window.addEventListener('message', ...)` and forwards relevant messages up the React tree.

**Q: Is the iframe secure?**
A: Yes. `sandbox="allow-scripts allow-same-origin allow-forms"` — the widget can run JS and submit forms but can't access top-window cookies, localStorage, or break out. The iframe URL is `srcDoc=...` (inline HTML) so there's no third-party origin involved.

**Q: What if Cosmos DB is down?**
A: `gremlin_client.py` catches the error and returns 11 mock nodes so the demo never breaks. The stats bar shows the error message in the source field so you can debug.

**Q: Why a separate Python venv inside `newMethod/server/`?**
A: To prove it's truly isolated. Nothing in `newMethod/` depends on the root project's venv or the old `server/`. Could be moved to its own repo tomorrow.

**Q: Why a separate `frontend/` instead of using the old one?**
A: Same reason — proves isolation. The old frontend on port 3000 doesn't know `newMethod/` exists. This frontend on port 3003 only talks to the newMethod server on 3002.

**Q: Can I use `@mcp-ui/client` instead of the custom `AppRendererHost`?**
A: Yes. In `frontend/components/AppRendererHost.tsx`, replace the direct iframe fetching with `<AppRenderer>` from `@mcp-ui/client` (`npm install @mcp-ui/client` first, then set `NEXT_PUBLIC_MCP_SANDBOX_URL`). The official package handles resource fetching and sandbox management automatically — but our custom implementation works fine for the demo and avoids a dependency.

**Q: Why does the graph show 0 edges?**
A: The current Cosmos DB graph has nodes but very few `outE()` edges populated. Not a bug — that's the actual state of the data. If we populate edges in Cosmos they'll appear automatically.

**Q: What happens if I load multiple graphs in the same chat?**
A: They all work. Each `AppRendererHost` guards its message listener with `e.source === iframeRef.current.contentWindow` so clicking a node in graph #3 only produces ONE card, not three.

**Q: Can the AI model trigger tool calls automatically?**
A: This frontend uses keyword routing for the demo. To get actual LLM tool calling, you'd add an LLM (Claude, GPT-4) and pass the tool list to it. The server side is fully MCP-compliant so any agent loop works.

**Q: How do widgets get data from the server result?**
A: The host posts `{type:'TOOL_INIT', toolResult: {content: [{type:'text', text: '...'}]}}` to the iframe right after it loads. The widget JS parses `toolResult.content[0].text` as JSON.

---

## 15. Glossary

| Term | What it means |
|---|---|
| **MCP** | Model Context Protocol — open standard for AI ↔ external system communication |
| **MCP server** | A process that exposes tools, resources, and prompts for AI to use |
| **MCP client / host** | An app (Claude Desktop, our chat, ChatGPT) that connects to MCP servers |
| **Tool** | A function the AI can call. Has a name, description, input schema, handler |
| **Resource** | Data the AI can read by URI. Has mimeType and content |
| **MCP Apps (SEP-1865)** | Extension that adds UI to tools via `_meta.ui.resourceUri` |
| **`ui://` resource** | A resource at a `ui://` URI containing HTML — the widget for a tool |
| **`_meta.ui.resourceUri`** | Field on a tool's schema pointing to its UI resource |
| **SSE transport** | Server-Sent Events — how our frontend talks to the Python server |
| **stdio transport** | Standard input/output — how Claude Desktop talks to local MCP servers |
| **AppRenderer** | The `@mcp-ui/client` React component that renders MCP App widgets |
| **postMessage** | Browser API for iframe ↔ parent communication |
| **Sandbox** | `sandbox="..."` iframe attribute that restricts what the iframe can do |
| **Gremlin** | The query language for Azure Cosmos DB's graph API |
| **COSE layout** | Compound Spring Embedder — Cytoscape's force-directed graph layout |
| **uvicorn** | The ASGI server running our Python FastAPI/Starlette app |
| **FastMCP** | The Python SDK class for building MCP servers (we use `Server` directly under our `MCPAppsServer` wrapper) |

---

## You're ready

If you can explain:
1. What MCP is (§2)
2. What `_meta.ui.resourceUri` does (§3)
3. The 15-step end-to-end flow (§8)
4. Why the click-to-detail is impressive (§9)
5. The 5 talking points for KPMG (§11)

…you can answer any question in the demo.

**Good luck!**
