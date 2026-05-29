# MCP APPS — Proof of Concept Execution Plan

**Project:** Model Context Protocol (MCP) Applications with Integrated Generative UI
**Team:** (Backend + MCP Protocol) |(Frontend + Generative UI Components)
**Duration:** 3 Days
**Objective:** Demonstrate to KPMG leadership that the MCP architecture enables a universal, model-agnostic connector pattern where LLM-powered chat interfaces can invoke enterprise tools and render their responses as rich, interactive UI components — not just plain text.

---

## What We Are Building (Executive Summary)

A chat application where:
1. A user asks a question in natural language
2. The LLM intelligently selects the right backend tool (MCP Server) to answer it
3. The tool returns structured data (not raw text)
4. The chat UI renders that data as an **interactive visual component** (graph, table, chart) directly inside the conversation

This proves MCP can serve as a **universal connector** between any LLM and any enterprise data source, with the frontend dynamically adapting its rendering per tool.

---

## Alignment with Task Requirements (from handwritten brief)

| Requirement from Brief | Where It's Covered |
|---|---|
| MCP with UI integrated to it | Day 2 (Generative UI contract) + Day 3 (end-to-end) |
| Called "MCP Apps" | Full project naming convention |
| Chat UI renders tool-specific components | Day 2 (React visualization component per MCP tool) |
| Specific UI per agent / MCP tool | Day 2 (structured schema → component mapping) |
| Frontend chat app integrated | Day 2 (Next.js AI Chatbot) + Day 3 (full integration) |

---

## Day 1: Protocol Architecture, Local Foundations & Out-of-the-Box Demo

**Goal:** Get a working MCP server running locally, prove the protocol lifecycle works, and validate the concept through Claude Desktop before building custom UI.

### Block 1 — Environment Isolation & Package Management (09:00 – 10:30)

**What to do:**
- Create a clean Python virtual environment inside the `POC_MCP_APPS` workspace
- Install the MCP Python SDK (`mcp` package) and all required dependencies
- Install the MCP Inspector tool (official debugging/testing interface for MCP servers)
- Set up a `requirements.txt` for reproducibility

**Why this matters:**
- Clean isolation prevents dependency conflicts
- Inspector lets us test the server independently of any LLM client — critical for debugging
- `requirements.txt` will be needed on Day 3 for Docker containerization

**Deliverable:** A ready-to-go Python environment with all MCP tooling installed and verified.

### Block 2 — Authoring the Baseline "Trivial Server" (10:30 – 12:30)

**What to do:**
- Create a minimal MCP server using the Python SDK's `FastMCP` high-level API
- Register 2-3 simple tools:
  - A system health check tool (returns machine info like OS, CPU, memory)
  - A basic calculator tool (takes two numbers and an operation, returns result)
  - A greeting tool (takes a name, returns a formatted greeting)
- Each tool must have proper name, description, and input schema annotations
- Launch the server using the MCP Inspector and verify:
  - All tools appear in the inspector's tool list
  - Tool schemas (parameters, types, descriptions) are correctly discovered
  - Invoking each tool from the inspector returns the expected response

**Why this matters:**
- This proves the protocol layer works before adding complexity
- The inspector validates that our server is fully MCP-compliant
- These simple tools become our "smoke test" throughout the project

**Deliverable:** A running MCP server with 2-3 tools, fully verified through the Inspector interface. Screenshot the Inspector showing discovered tools.

### Block 3 — Host Connection & Local Verification (13:30 – 15:30)

**What to do:**
- Open Claude Desktop's configuration file (`claude_desktop_config.json`)
- Add our local MCP server as a registered server (point to the Python executable and server script path)
- Restart Claude Desktop completely
- Verify that our tools appear as available capabilities in Claude Desktop's interface (look for the hammer icon / tool indicator)
- Test by typing natural language prompts that should trigger tool use:
  - "What's the health of my system?" → should invoke the health check tool
  - "What is 42 times 17?" → should invoke the calculator tool
- Confirm the full lifecycle: User prompt → LLM decides to use tool → MCP protocol call → Server executes → Response returned to LLM → LLM presents result

**Why this matters:**
- This is the "out-of-the-box" demo — proves MCP works with a production LLM client
- Claude Desktop serves as our staging environment and fallback demo surface
- Validates the Host ↔ Client ↔ Server architecture with a real model making real tool selection decisions

**Deliverable:** Claude Desktop successfully invoking our local MCP server tools. Screen-record this interaction for Day 3 backup.

### Block 4 — Technical Analysis & Architectural Review (16:00 – 17:30)

**What to do:**
- Document the architecture clearly with a diagram showing:
  - **Host** (Claude Desktop / Web App) → **Client** (MCP Client inside host) → **Server** (our Python backend)
- Write up definitive Pros:
  - **Decoupled Architecture:** Tools are separate from models — swap the LLM without touching tools
  - **Standardized Contracts:** Every tool speaks the same protocol — no custom API integrations per tool
  - **Model Agnostic:** Works with Claude, GPT, Gemini, or any model that supports MCP
  - **Discovery Built-In:** Clients automatically discover available tools — no manual wiring
  - **Security Boundary:** Each server runs in its own process — natural sandboxing
- Write up definitive Cons/Risks:
  - **State Management:** MCP servers are stateless by default — complex workflows need external state stores
  - **Transport Complexity:** Local `stdio` transport won't work for web deployments — must migrate to SSE or HTTP Streamable
  - **Error Handling:** Protocol error propagation is still maturing — need robust fallback patterns
  - **Auth & Multi-Tenancy:** Production deployments need auth layers that MCP doesn't prescribe
  - **Cold Start:** Each tool invocation may spin up a process — latency considerations for real-time use

**Deliverable:** Architecture diagram + Pros/Cons document ready for Day 3 presentation.

---

## Day 2: Custom Data Engineering, Generative UI Protocols & Front-End Alignment

**Goal:** Upgrade the backend to serve enterprise-grade structured data, define the Generative UI contract between backend and frontend, and begin full-stack integration.

### Block 1 — Elevating the Server: Enterprise Use-Case Simulation (09:00 – 11:30)

**What to do:**
- Replace/augment the trivial tools with a domain-specific enterprise tool. Choose ONE compelling use case:
  - **Option A — Knowledge Graph:** A tool that returns entities and relationships (nodes + edges) for a given topic. Simulates querying an enterprise knowledge base.
  - **Option B — Financial Dashboard Data:** A tool that returns structured financial metrics (revenue, costs, trends) for a given business unit. Simulates querying an internal analytics platform.
  - **Option C — Audit Trail Viewer:** A tool that returns structured audit log entries with actors, actions, timestamps, and risk scores. Simulates an enterprise compliance system.
- **CRITICAL:** The tool must return **structured data** (a well-defined JSON schema with typed fields), NOT a paragraph of text. This is what enables Generative UI.
- Define the response schema explicitly. Example for Knowledge Graph:
  ```
  {
    "tool_name": "query_knowledge_graph",
    "response_schema": {
      "nodes": [{"id": str, "label": str, "type": str}],
      "edges": [{"source": str, "target": str, "relationship": str}],
      "metadata": {"query": str, "result_count": int, "timestamp": str}
    }
  }
  ```
- Build a mock data layer that returns realistic-looking sample data (hardcoded is fine — this is a POC, not a production pipeline)
- Test through Inspector to confirm the structured payload comes back correctly

**Why this matters:**
- Raw text responses can't drive Generative UI — structured schemas are the bridge
- The schema IS the contract between backend and frontend
- A compelling enterprise use case makes the demo resonate with leadership

**Deliverable:** An MCP server with at least one enterprise-grade tool returning structured JSON, verified through Inspector.

### Block 2 — Engineering Alignment & Front-End Briefing (11:30 – 13:00)

**What to do:**
- Sync to finalize the communication contract:
  1. Share the exact response schema from Block 1
  2. Agree on which visual component maps to which tool response type
  3. Define the component contract:
     - Knowledge Graph → Interactive network graph (e.g., using `react-force-graph` or `vis-network`)
     - Financial Data → Dashboard cards + bar/line chart (e.g., using `recharts`)
     - Audit Trail → Filterable data table (e.g., using a styled table component)
- Advise on the frontend stack:
  - Start from an AI chatbot template (Next.js AI Chatbot or similar) — do NOT build chat UI from scratch
  - The template gives us: message threading, streaming support, model integration
  - Frontend job: Add a **component dispatcher** that checks if an assistant message contains structured tool output, and if so, renders the appropriate React component instead of plain text
- Define the Generative UI flow:
  ```
  User types message
    → Frontend sends to LLM (via AI SDK / API)
    → LLM decides to call MCP tool
    → MCP Server returns structured JSON
    → LLM passes structured JSON back in its response
    → Frontend component dispatcher detects structured data
    → Renders interactive React component in chat bubble
  ```

**Why this matters:**
- Misalignment between backend schema and frontend component is the #1 risk for Day 3
- Starting from a template saves 4-6 hours of boilerplate work
- The component dispatcher pattern is the core innovation of this POC — it's what makes it "MCP Apps" and not just "MCP + chat"

**Deliverable:** Shared schema document, agreed component mapping, Akash's frontend repo initialized from template.

### Block 3 — Transport Layer & Server-Side Integration (14:00 – 17:00)

**What to do:**
- Add SSE (Server-Sent Events) transport to the Python MCP server
  - The MCP SDK supports SSE transport — configure the server to expose an HTTP endpoint
  - This replaces `stdio` transport (which only works for local desktop clients)
  - The SSE endpoint allows the web frontend to communicate with our MCP server over HTTP
- Configure CORS headers to allow the frontend (likely running on `localhost:3000`) to connect
- Test the SSE endpoint:
  - Use `curl` or Postman to verify the endpoint responds correctly
  - Connect the MCP Inspector via SSE transport (instead of stdio) to verify tools still work
  - Verify capability negotiation: client sends `initialize` → server responds with capabilities list
- If time permits, start testing the connection from Akash's frontend to the SSE endpoint

**Why this matters:**
- Web applications cannot use `stdio` — SSE is the bridge between web frontend and MCP server
- CORS misconfiguration is a common blocker — fixing it today prevents a Day 3 crisis
- This block transforms our server from "local demo tool" to "network-accessible service"

**Deliverable:** MCP server running with SSE transport, accessible over HTTP, CORS configured, verified with Inspector and/or curl.

---

## Day 3: End-to-End Assembly, Containerization Strategy & Stakeholder Demonstration

**Goal:** Wire everything together, build the deployment story, and deliver a presentation that earns leadership approval to move to production.

### Block 1 — Full-Stack End-to-End Integration (09:00 – 11:00)

**What to do:**
- Launch the Python MCP server (SSE transport) on a defined port
- Launch frontend web client (Next.js dev server)
- Open the web app in a browser and run the golden path test:
  1. Type a natural language query: e.g., "Show me the knowledge graph for cloud security"
  2. Watch the LLM interpret the request and decide to invoke the MCP tool
  3. Verify the MCP server receives the call and returns structured JSON
  4. Verify the frontend's component dispatcher catches the structured data
  5. Verify the interactive visualization renders inside the chat bubble
- Test edge cases:
  - What happens when the user asks a question that does NOT require a tool? (Should get normal text response)
  - What happens when the tool returns an error? (Should show graceful fallback)
  - What happens with rapid consecutive tool calls? (Should queue properly)
- Debug and fix any integration issues. Common issues to watch for:
  - CORS errors (check browser console)
  - Schema mismatches between backend response and frontend component expectations
  - SSE connection drops or timeouts
  - Component rendering failures (check React error boundaries)

**Why this matters:**
- This is the moment of truth — all three days of work converge here
- Finding and fixing bugs now (not during the demo) is critical
- The edge case tests prove robustness, which leadership will question

**Deliverable:** A fully working end-to-end demo running in the browser. Screen-record the successful run as backup.

### Block 2 — Enterprise Deployment Architecture (11:00 – 13:00)

**What to do:**
- Create a `Dockerfile` for the Python MCP server:
  - Base image: `python:3.11-slim`
  - Copy requirements and install dependencies
  - Expose the SSE port
  - Set the entry command to launch the server with SSE transport
- Create a `docker-compose.yml` that orchestrates:
  - The MCP server container
  - (Optionally) the frontend container
  - Network configuration between them
- Build and test the Docker image locally to verify it works
- Document the microservice deployment pattern:
  ```
  [Load Balancer / API Gateway]
        |
  [MCP Server Container A] — Knowledge Graph Tool
  [MCP Server Container B] — Financial Analytics Tool
  [MCP Server Container C] — Compliance Audit Tool
        |
  [Any LLM-Powered Frontend]  ← model-agnostic, talks MCP
  ```
- This diagram shows leadership HOW this scales: each enterprise data source gets its own MCP server container, and any frontend can connect to any/all of them

**Why this matters:**
- Leadership needs to see a path from POC to production — Docker gives them that
- The microservice diagram shows how MCP naturally maps to enterprise architecture
- "One container per tool, any frontend can connect" is the killer message

**Deliverable:** Working Dockerfile, docker-compose.yml, and microservice architecture diagram.

### Block 3 — Technical Presentation & Risk Mitigation (14:00 – 15:30)

**What to do:**
- Build the executive briefing (PowerPoint or similar). Structure:
  1. **The Problem:** Every AI integration today requires custom API glue code. N models x M tools = N*M integrations.
  2. **The Solution:** MCP — a universal protocol. N models + M tools = N+M integrations. Tools are built once and work with any model.
  3. **What We Built:** Live architecture diagram showing Host → Client → Server flow
  4. **Live Demo:** (or video backup) Full chat interaction showing Generative UI
  5. **Enterprise Value:**
     - Any internal data source can become an MCP server
     - Any chat interface (internal or client-facing) can consume it
     - Model-agnostic: swap Claude for GPT or Gemini without touching tools
     - Security: each server is sandboxed, tools never access the model directly
  6. **Deployment Blueprint:** Docker + microservice diagram
  7. **Pros/Cons & Risk Analysis:** Honest assessment with mitigation strategies
  8. **Recommended Next Steps:** Production pilot with one real data source
- Record the comprehensive video walkthrough:
  - Screen-record the full interaction from browser
  - Narrate each step: what the user does, what the system does, what's happening at the protocol level
  - This video is the ironclad backup if the live demo fails

**Why this matters:**
- The presentation IS the deliverable for leadership — the code is supporting evidence
- A video backup eliminates the #1 demo risk (live failure)
- Framing it as "Universal Connector" (not "chatbot") positions it as enterprise infrastructure

**Deliverable:** Complete presentation deck + video walkthrough saved and tested.

### Block 4 — Executive Review Session (16:00 – 17:00)

**What to do:**
- Present to leadership following this flow:
  1. Open with the problem statement (2 min)
  2. Show the architecture diagram (3 min)
  3. Run the baseline demo via Claude Desktop — proves out-of-the-box MCP works (5 min)
  4. Transition to the custom web chat app — this is the "MCP Apps" moment (10 min)
     - Issue a query
     - Show the Generative UI component rendering live
     - Show a second query type if multiple tools are built
  5. Show the Docker deployment blueprint (5 min)
  6. Present Pros/Cons analysis (5 min)
  7. Propose next steps and timeline for production pilot (5 min)
  8. Q&A (15 min)

**Deliverable:** Leadership approval to proceed to production pilot.

---

## Risk Register & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Live demo fails during presentation | Medium | High | Pre-recorded video walkthrough as backup |
| SSE connection drops under load | Low | Medium | Keep demo data small; test repeatedly on Day 3 morning |
| Frontend component doesn't render correctly | Medium | High | Day 2 Block 2 alignment sync; test on Day 3 Block 1 |
| Claude Desktop config breaks after restart | Low | Low | Document exact config; keep backup copy |
| Schema mismatch between backend and frontend | Medium | High | Shared schema document created on Day 2; both sides validate against it |
| Docker build fails on Day 3 | Low | Medium | Build is a bonus, not the core demo; can show Dockerfile + diagram instead |
| Akash's frontend not ready by Day 3 | Medium | High | Have Claude Desktop demo as fallback; Akash starts from template (not scratch) |

---

## Additional Suggestions (Beyond Original Plan)

### 1. Add a Second MCP Tool for "Wow Factor"
Having two different tools that render two different UI components proves the pattern is generalizable, not a one-off. E.g., Knowledge Graph (network visualization) + Financial Summary (dashboard cards). This makes the "Universal Connector" argument much stronger.

### 2. Show Model Agnosticism Live (If Time Permits)
If possible, swap the LLM backend from Claude to another model during the demo and show the same tools still work. This is the single most powerful proof point for MCP's value proposition.

### 3. Prepare a "What If" Slide for Authentication
Leadership will ask about security. Have a slide ready showing where OAuth/API-key auth would plug into the MCP server layer — even if not implemented in the POC.

### 4. Capture Metrics During Demo
Time the end-to-end latency from user query to rendered UI component. Having a concrete number ("the full round trip takes 2.3 seconds") shows engineering rigor and gives leadership a performance baseline.

### 5. Prepare a One-Page Architecture Decision Record (ADR)
A single page that says: "We evaluated MCP vs. custom API integrations vs. LangChain tools. Here's why MCP won." This preempts the "why not just use X?" question.

---

## File & Folder Structure (Target by End of Day 3)

```
POC_MCP_APPS/
├── plan.md                          ← This document
├── server/
│   ├── requirements.txt             ← Python dependencies
│   ├── mcp_server.py                ← Main MCP server with all tools
│   ├── tools/
│   │   ├── health_check.py          ← System health tool
│   │   ├── knowledge_graph.py       ← Enterprise KG tool (structured output)
│   │   └── ...                      ← Additional tools
│   ├── mock_data/
│   │   └── kg_data.json             ← Mock knowledge graph data
│   ├── Dockerfile                   ← Container config
│   └── docker-compose.yml           ← Multi-service orchestration
├── frontend/                        ← Akash's repo (Next.js AI Chatbot)
│   ├── components/
│   │   ├── chat/                    ← Chat UI (from template)
│   │   └── generative-ui/          ← Custom Generative UI components
│   │       ├── KnowledgeGraph.tsx   ← Network graph renderer
│   │       ├── ComponentDispatcher.tsx ← Routes structured data → component
│   │       └── ...
│   └── ...
├── docs/
│   ├── architecture-diagram.png     ← System architecture visual
│   ├── pros-cons.md                 ← Technical analysis
│   └── presentation.pptx           ← Executive briefing deck
└── demo/
    └── demo-recording.mp4          ← Backup video walkthrough
```

---

## Success Criteria

The POC is successful if we can demonstrate ALL of the following in the Day 3 review:

1. A user types a natural language question in a web chat interface
2. The LLM autonomously decides to call the appropriate MCP tool
3. The MCP server returns structured data (not plain text)
4. The chat UI renders an interactive, tool-specific visualization component
5. The architecture diagram clearly shows how this scales to N tools and M models
6. Leadership understands the "build once, use everywhere" value proposition

---

*This plan is a living document. Update it daily as decisions are made and timelines shift.*



# My add run command 

- Frontend ->

```bash
cd frontend
npm run dev
```

```bash
source .venv/bin/activate
python3 server/mcp_server_web.py
```

```bash
source .venv/bin/activate
npx @modelcontextprotocol/inspector python3 server/mcp_server_enterprise.py
```
