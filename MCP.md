# Model Context Protocol (MCP) - Complete Guide

**Understanding MCP and Its Implementation in KPMG POC Project**

---

## 📖 Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Why MCP Matters](#why-mcp-matters)
3. [MCP Architecture Overview](#mcp-architecture-overview)
4. [How We Use MCP in This Project](#how-we-use-mcp-in-this-project)
5. [Step-by-Step: How Everything Works](#step-by-step-how-everything-works)
6. [Code Walkthrough](#code-walkthrough)
7. [MCP Server Implementation](#mcp-server-implementation)
8. [MCP Client Implementation](#mcp-client-implementation)
9. [MCP Tools Deep Dive](#mcp-tools-deep-dive)
10. [MCP Transport Layers](#mcp-transport-layers)
11. [Message Flow & Protocol](#message-flow--protocol)
12. [Data Structures & Schemas](#data-structures--schemas)
13. [Integration Points](#integration-points)
14. [Benefits We Get from MCP](#benefits-we-get-from-mcp)
15. [Comparison: With vs Without MCP](#comparison-with-vs-without-mcp)

---

## What is MCP?

### The Simple Explanation

**MCP (Model Context Protocol)** is like a "USB standard" for AI applications. Just like USB lets any device connect to any computer using the same port, MCP lets any AI application connect to any data source or tool using the same protocol.

### The Technical Explanation

MCP is an **open protocol** that standardizes how AI applications (clients) communicate with data sources and tools (servers). It defines:

- **How** to discover available tools
- **How** to call tools with parameters
- **How** to exchange messages
- **What** data formats to use
- **How** to handle errors

### Key Concepts

```
┌─────────────┐                    ┌─────────────┐
│   CLIENT    │ ←── MCP Protocol → │   SERVER    │
│             │                    │             │
│ (AI App,    │                    │ (Tools,     │
│  Frontend,  │                    │  Data,      │
│  Claude)    │                    │  APIs)      │
└─────────────┘                    └─────────────┘
```

**Client:** The application that wants to use tools (our Next.js frontend, Claude AI, etc.)  
**Server:** The application that provides tools (our Python backend)  
**Protocol:** The rules for how they talk (MCP specification)

### MCP vs Traditional APIs

| Aspect | Traditional REST API | MCP |
|--------|---------------------|-----|
| Discovery | Manual documentation | Automatic tool listing |
| Schema | OpenAPI, manual | Self-describing tools |
| Integration | Custom code per API | Standard protocol |
| AI-Friendly | Not optimized | Designed for AI |
| Tool Calling | Manual parsing | Structured parameters |
| Updates | Break clients | Graceful evolution |

---

## Why MCP Matters

### The Problem Before MCP

**Scenario:** You want your AI to access:
- A database (PostgreSQL)
- A file system (Local files)
- An API (Salesforce CRM)
- A calculation engine (Python)

**Without MCP:** You need to write custom integration code for each:
```python
# Custom code for database
db_result = postgres_client.query("SELECT ...")

# Custom code for files
file_data = open("file.txt").read()

# Custom code for API
crm_data = salesforce_api.get_accounts()

# Custom code for calculations
calc_result = calculator.compute(a, b)
```

**Problems:**
- ❌ Different code patterns for each
- ❌ No standard way to discover capabilities
- ❌ Hard to add new data sources
- ❌ AI can't easily understand what's available
- ❌ Maintenance nightmare

### The Solution With MCP

**With MCP:** All data sources implement the same protocol:
```python
# Same pattern for everything
tools = mcp_client.listTools()  # Discover what's available
result = mcp_client.callTool("tool_name", args)  # Use any tool
```

**Benefits:**
- ✅ One protocol for everything
- ✅ Automatic tool discovery
- ✅ Easy to add new tools
- ✅ AI can understand capabilities
- ✅ Standard, maintainable code

---

## MCP Architecture Overview

### Three-Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (React Components)                   │  │
│  │  - Chat Interface                                      │  │
│  │  - Generative UI Components                           │  │
│  │  - User Interactions                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↕ MCP Client
┌──────────────────────────────────────────────────────────────┐
│                      PROTOCOL LAYER                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  MCP Protocol (SSE Transport)                          │  │
│  │  - Tool Discovery (listTools)                         │  │
│  │  - Tool Execution (callTool)                          │  │
│  │  - Message Exchange (JSON-RPC)                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↕ MCP Server
┌──────────────────────────────────────────────────────────────┐
│                      BUSINESS LAYER                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  FastMCP Python Server                                 │  │
│  │  - 12 Tools (Functions)                               │  │
│  │  - Business Logic                                     │  │
│  │  - Data Access                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↕
┌──────────────────────────────────────────────────────────────┐
│                       DATA LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────────┐ │
│  │ Mock     │  │ Mock     │  │ Azure Cosmos DB            │ │
│  │ JSON     │  │ JSON     │  │ (Gremlin API)             │ │
│  │ Files    │  │ Files    │  │ Live Regulatory Data      │ │
│  └──────────┘  └──────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**1. MCP Client (Frontend)**
- File: `frontend/lib/mcp-client.ts`
- Purpose: Connects to MCP server, calls tools
- Technology: TypeScript, MCP SDK
- Transport: SSE (Server-Sent Events)

**2. MCP Server (Backend)**
- File: `server/mcp_server_web.py`
- Purpose: Exposes tools via MCP protocol
- Technology: Python, FastMCP
- Transport: SSE (Server-Sent Events)

**3. MCP Tools (Backend)**
- Files: `server/tools/*.py`
- Purpose: Actual business logic
- Types: 12 tools (3 basic, 6 enterprise, 3 live Gremlin)

---

## How We Use MCP in This Project

### Our MCP Stack

```
Application: MCP Apps (KPMG POC)
Purpose: Demonstrate MCP + Generative UI

Client Side:
├── Framework: Next.js 15 + React 19
├── MCP Library: @modelcontextprotocol/sdk
├── Language: TypeScript
└── Transport: SSE (HTTP/EventSource)

Server Side:
├── Framework: FastMCP (MCP Python framework)
├── Web Server: Uvicorn + Starlette
├── Language: Python 3.14
└── Transport: SSE (sse-starlette)

Tools Provided:
├── Basic: System health, calculator, greetings
├── Enterprise: Knowledge graphs, financial dashboards
└── Live Data: Azure Cosmos DB Gremlin queries
```

### Why We Chose This Stack

**FastMCP (Server):**
- ✅ Official Python implementation of MCP
- ✅ Decorator-based tool registration (simple)
- ✅ Built-in SSE support
- ✅ Type-safe with Python type hints
- ✅ Easy to add new tools

**MCP SDK (Client):**
- ✅ Official TypeScript implementation
- ✅ Works with any JavaScript framework
- ✅ SSE transport built-in
- ✅ Type-safe with TypeScript
- ✅ Promise-based async API

**SSE Transport:**
- ✅ HTTP-based (works through firewalls)
- ✅ Server-to-client streaming
- ✅ Auto-reconnection
- ✅ Simple to implement
- ✅ Good enough for POC (WebSocket overkill)

---

## Step-by-Step: How Everything Works

### The Complete Journey: User Click to Visualization

Let's trace what happens when a user clicks "🏛️ Business Rules (Live)":

#### Step 1: User Interaction (Frontend)

**File:** `frontend/app/chat/page.tsx`  
**Line:** ~405

```tsx
<button
  onClick={() => setInput('Show me regulatory BusinessRules')}
  disabled={!isConnected || isLoading}
  className="..."
>
  🏛️ Business Rules (Live)
</button>
```

**What happens:**
1. User clicks button
2. Input field is set to: "Show me regulatory BusinessRules"
3. Form is auto-submitted (triggers `handleSubmit`)

---

#### Step 2: Pattern Matching (Frontend)

**File:** `frontend/app/chat/page.tsx`  
**Line:** ~140-156

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ...
  const lowerInput = input.toLowerCase();
  
  // Pattern matching for Cosmos DB
  if (lowerInput.includes('regulatory') || lowerInput.includes('businessrules')) {
    let label = 'BusinessRules'; // detected!
    
    toolCall = {
      name: 'cosmosdb_query_regulatory_policies',
      arguments: { label: 'BusinessRules' },
    };
  }
}
```

**What happens:**
1. Input text is converted to lowercase
2. Checked against pattern rules
3. Detects "regulatory" + "businessrules" keywords
4. Creates toolCall object:
   - Tool name: `cosmosdb_query_regulatory_policies`
   - Arguments: `{ label: "BusinessRules" }`

---


#### Step 3: MCP Client Tool Call (Frontend)

**File:** `frontend/lib/mcp-client.ts`  
**Line:** ~80-120

```typescript
async callTool(name: string, arguments_: Record<string, unknown>): Promise<string> {
  // Create MCP request
  const request = {
    jsonrpc: '2.0',
    id: this.nextId++,
    method: 'tools/call',
    params: {
      name: 'cosmosdb_query_regulatory_policies',
      arguments: { label: 'BusinessRules' }
    }
  };
  
  // Send via HTTP POST
  const response = await fetch(`${this.serverUrl}/messages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  // Wait for response via SSE
  return new Promise((resolve) => {
    // SSE listener receives result
  });
}
```

**What happens:**
1. Creates JSON-RPC 2.0 message
2. Sends HTTP POST to `http://localhost:3001/messages/`
3. Listens on SSE connection for response
4. Returns promise that resolves when response arrives

**Network Traffic:**
```http
POST http://localhost:3001/messages/?session_id=abc123
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "cosmosdb_query_regulatory_policies",
    "arguments": {
      "label": "BusinessRules"
    }
  }
}
```

---

#### Step 4: MCP Server Receives Request (Backend)

**File:** `server/mcp_server_web.py`  
**Line:** ~1-40 (FastMCP framework)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("EnterpriseKPMGServer")

@mcp.tool()
def cosmosdb_query_regulatory_policies(label: str) -> str:
    """Query live regulatory policies from Azure Cosmos DB"""
    return query_regulatory_policy_graph(label)
```

**What happens:**
1. Uvicorn receives HTTP POST
2. FastMCP routes to correct tool based on `method: "tools/call"`
3. Extracts tool name: `cosmosdb_query_regulatory_policies`
4. Extracts arguments: `{ label: "BusinessRules" }`
5. Calls Python function with arguments
6. FastMCP handles:
   - Type validation (label must be string)
   - Error handling
   - Response formatting

**Console Output:**
```
INFO:     127.0.0.1:55575 - "POST /messages/?session_id=abc123 HTTP/1.1" 202 Accepted
Processing request of type CallToolRequest
```

---

#### Step 5: Tool Execution (Backend)

**File:** `server/tools/gremlin_cosmos.py`  
**Line:** ~399-441

```python
def query_regulatory_policy_graph(label: str) -> str:
    """MCP tool function: Query live regulatory policies"""
    try:
        tool = get_gremlin_tool()  # Get singleton Gremlin client
        
        # Query by label
        if label in ["BusinessRules", "Obligations", "Processes", "Controls"]:
            graph_data = tool.query_by_label(label, limit=50)
        else:
            # Treat as search keyword
            graph_data = tool.search_by_keyword(label, limit=30)
        
        return json.dumps(graph_data, indent=2)
    except Exception as e:
        return json.dumps({
            "error": f"Failed to query Gremlin API: {str(e)}",
            "nodes": [],
            "edges": []
        })
```

**What happens:**
1. Gets Gremlin client singleton
2. Checks if label is standard (BusinessRules, Obligations, etc.)
3. Calls `query_by_label("BusinessRules", limit=50)`
4. Returns JSON string

---

#### Step 6: Gremlin Database Query (Backend)

**File:** `server/tools/gremlin_cosmos.py`  
**Line:** ~120-162

```python
def query_by_label(self, label: str, limit: int = 50) -> Dict[str, Any]:
    """Query vertices and edges by label"""
    
    # Query vertices with the specified label
    vertex_query = f"g.V().hasLabel('{label}').limit({limit}).valueMap(true)"
    vertices = self.execute_query(vertex_query)
    
    # Query edges connected to these vertices
    edge_query = f"g.V().hasLabel('{label}').limit({limit}).outE().valueMap(true)"
    edges_raw = self.execute_query(edge_query)
    
    # Transform to graph format
    return self.transform_to_graph(vertices, edges_raw, label)
```

**Gremlin Query:**
```gremlin
g.V().hasLabel('BusinessRules').limit(50).valueMap(true)
```

**What happens:**
1. Constructs Gremlin traversal query
2. Executes query in thread pool (to avoid event loop conflicts)
3. Query goes to Azure Cosmos DB Gremlin API
4. Returns vertices with all properties

**Cosmos DB Query Execution:**

```python
def execute_query(self, query: str) -> List[Dict[str, Any]]:
    """Execute query in thread pool to avoid event loop conflicts"""
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(self._execute_sync, query)
        results = future.result(timeout=30)
        return results

def _execute_sync(self, query: str) -> List[Dict[str, Any]]:
    """Execute with isolated event loop"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        callback = self.client.submit(query)
        results = callback.all().result()
        return results
    finally:
        loop.close()
```

**What happens:**
1. Query runs in separate thread
2. Thread has its own event loop (no conflict with FastMCP)
3. Gremlin client submits query over WebSocket to Azure
4. Azure Cosmos DB executes Gremlin traversal
5. Returns raw vertex data

**Sample Cosmos DB Response:**
```json
[
  {
    "id": "Economic_Crime_Prevention_Policy",
    "label": ["BusinessRules"],
    "name": ["Economic Crime Prevention Policy"],
    "node_attributes": ["[{\"key\":\"why\",\"value\":\"to assist...\"}]"],
    "EntityType": ["Policy"]
  },
  {
    "id": "Anti-Bribery_Legislation_Compliance",
    "label": ["Obligations"],
    "name": ["Anti-Bribery Legislation Compliance"],
    ...
  }
]
```

---

#### Step 7: Data Transformation (Backend)

**File:** `server/tools/gremlin_cosmos.py`  
**Line:** ~242-380

```python
def transform_to_graph(
    self,
    vertices: List[Dict[str, Any]],
    edges_raw: List[Dict[str, Any]],
    query_topic: str
) -> Dict[str, Any]:
    """Transform Gremlin results into frontend graph format"""
    
    nodes = []
    edges = []
    
    # Transform vertices to nodes
    for vertex in vertices:
        node_id = vertex.get('id')
        label = vertex.get('label', 'Unknown')
        name = vertex.get('name', node_id)
        
        # Parse node_attributes JSON
        node_attrs_raw = vertex.get('node_attributes', '[]')
        node_attrs = self.parse_node_attributes(node_attrs_raw)
        
        # Build node object
        node = {
            "id": str(node_id),
            "label": name.replace("_", " ").title(),
            "type": label,
            "description": node_attrs.get('what', 'No description'),
            "properties": {
                "category": label,
                "why": node_attrs.get('why', ''),
                "what": node_attrs.get('what', ''),
                "who": node_attrs.get('who', ''),
                "where": node_attrs.get('where', ''),
                "when": node_attrs.get('when', ''),
                "how": node_attrs.get('how', '')
            }
        }
        nodes.append(node)
    
    # Transform edges
    for edge in edges_raw:
        edge_obj = {
            "source": str(edge.get('outV')),
            "target": str(edge.get('inV')),
            "relationship": edge.get('label', 'RELATED'),
            "properties": {
                "document_source": edge.get('document_source', ''),
                "source_page": edge.get('source_page', '')
            }
        }
        edges.append(edge_obj)
    
    return {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "topic": query_topic,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "source": "Azure CosmosDB Gremlin API (live data)",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "database": self.database,
            "graph": self.graph
        }
    }
```

**What happens:**
1. Converts raw Gremlin vertex data to frontend node format
2. Parses JSON-encoded node attributes (5W1H)
3. Extracts edge relationships
4. Adds metadata (source, timestamp, counts)
5. Returns structured JSON matching frontend schema

**Transformed Output:**
```json
{
  "nodes": [
    {
      "id": "Economic_Crime_Prevention_Policy",
      "label": "Economic Crime Prevention Policy",
      "type": "BusinessRules",
      "description": "Policy for preventing economic crime",
      "properties": {
        "category": "BusinessRules",
        "why": "to assist in managing economic crime risk",
        "what": "Comprehensive policy for economic crime prevention",
        "who": "Regulated Entity",
        "where": "UK and other jurisdictions",
        "when": "October 2023",
        "how": "Through risk assessment and controls"
      }
    }
  ],
  "edges": [
    {
      "source": "Economic_Crime_Prevention_Policy",
      "target": "Anti-Bribery_Legislation_Compliance",
      "relationship": "LINEAGE",
      "properties": {
        "document_source": "Economic_Crime_Policy.pdf",
        "source_page": "5"
      }
    }
  ],
  "metadata": {
    "topic": "BusinessRules",
    "node_count": 10,
    "edge_count": 8,
    "source": "Azure CosmosDB Gremlin API (live data)",
    "timestamp": "2026-05-19T22:30:00.000Z",
    "database": "your-database",
    "graph": "your-graph"
  }
}
```

---

#### Step 8: MCP Response (Backend → Frontend)

**File:** `server/mcp_server_web.py` (FastMCP framework)

**MCP Response Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"nodes\": [...], \"edges\": [...], \"metadata\": {...}}"
      }
    ]
  }
}
```

**What happens:**
1. FastMCP wraps the JSON string in MCP response format
2. Sends response via SSE back to client
3. Client's promise resolves with the result

**Network Traffic (SSE):**
```
event: message
data: {"jsonrpc":"2.0","id":5,"result":{"content":[{"type":"text","text":"{...}"}]}}
```

---

#### Step 9: Frontend Receives Response

**File:** `frontend/lib/mcp-client.ts`  
**Line:** ~100

```typescript
// Promise resolves with tool result
const result = await mcpClient.callTool('cosmosdb_query_regulatory_policies', { label: 'BusinessRules' });

// result is the JSON string returned by the tool
console.log('Tool result:', result);
```

**What happens:**
1. SSE listener receives message
2. Extracts `result.content[0].text` (the JSON string)
3. Promise resolves
4. Result is assigned to `toolCall.result`

---

#### Step 10: Create Assistant Message (Frontend)

**File:** `frontend/app/chat/page.tsx`  
**Line:** ~178-185

```tsx
// Create assistant message with tool result
const assistantMessage: Message = {
  id: (Date.now() + 1).toString(),
  role: 'assistant',
  content: result,  // The JSON string from tool
  toolCalls: [toolCall],
  timestamp: new Date(),
};

// Add to messages array
setMessages(prev => [...prev, assistantMessage]);
```

**What happens:**
1. Creates new message object
2. Role: 'assistant'
3. Content: The JSON string with graph data
4. Adds to messages state
5. React re-renders chat with new message

---

#### Step 11: Component Dispatcher (Frontend)

**File:** `frontend/components/generative-ui/ComponentDispatcher.tsx`  
**Line:** ~24-46

```tsx
export function ComponentDispatcher({ content }: { content: string | object }) {
  let parsedContent: any = content;
  
  // Parse JSON if string
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      return <pre>{content}</pre>;
    }
  }
  
  // Check if it's a Knowledge Graph response
  if (isKnowledgeGraphResponse(parsedContent)) {
    return <KnowledgeGraphVisualization data={parsedContent} />;
  }
  
  // Check if it's a Financial Dashboard response
  if (isFinancialDashboardResponse(parsedContent)) {
    return <FinancialDashboardVisualization data={parsedContent} />;
  }
  
  // Default: render as JSON
  return <pre>{JSON.stringify(parsedContent, null, 2)}</pre>;
}
```

**What happens:**
1. Receives content (JSON string)
2. Tries to parse as JSON
3. Runs type guards to determine data type
4. Routes to appropriate visualization component

**Type Guard:**

**File:** `frontend/lib/types.ts`  
**Line:** ~44-53

```typescript
export function isKnowledgeGraphResponse(content: any): boolean {
  return (
    content &&
    typeof content === 'object' &&
    Array.isArray(content.nodes) &&
    Array.isArray(content.edges) &&
    content.metadata &&
    typeof content.metadata === 'object'
  );
}
```

**What happens:**
1. Checks if object has `nodes` array
2. Checks if object has `edges` array
3. Checks if object has `metadata` object
4. Returns `true` → Routes to KnowledgeGraphVisualization

---

#### Step 12: Graph Visualization (Frontend)

**File:** `frontend/components/generative-ui/KnowledgeGraph.tsx`  
**Line:** ~50-150

```tsx
export function KnowledgeGraphVisualization({ data }: { data: KnowledgeGraphResponse }) {
  // Transform to react-force-graph format
  const graphData = {
    nodes: data.nodes.map(node => ({
      id: node.id,
      name: node.label,
      type: node.type,
      ...node
    })),
    links: data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      relationship: edge.relationship,
      ...edge
    }))
  };
  
  return (
    <div className="knowledge-graph-container">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => getColorByType(node.type)}
        linkLabel={link => link.relationship}
        onNodeClick={handleNodeClick}
        width={800}
        height={600}
      />
      <GraphMetadata metadata={data.metadata} />
    </div>
  );
}
```

**What happens:**
1. Receives parsed graph data
2. Transforms to react-force-graph-2d format
3. Maps nodes with colors by type
4. Sets up click handlers
5. Renders interactive force-directed graph
6. Shows metadata footer

**Visual Rendering:**
- 🔵 Blue nodes: BusinessRules
- 🟢 Green nodes: Obligations
- 🟡 Yellow nodes: Processes
- 🔴 Red nodes: Controls
- Arrows: LINEAGE relationships
- Interactive: Click, drag, zoom

---

#### Step 13: User Sees Visualization

**Browser Display:**
```
┌──────────────────────────────────────────────────────────┐
│ MCP Apps Chat                                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [User] Show me regulatory BusinessRules    22:30:15    │
│                                                          │
│  🔧 Called tool: cosmosdb_query_regulatory_policies     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Economic Crime           Anti-Bribery             │ │
│  │  Prevention Policy    ←→  Legislation             │ │
│  │         🔵                 Compliance               │ │
│  │                               🟢                    │ │
│  │                                                     │ │
│  │    Risk Management  ←→  Control Measures           │ │
│  │       Process              🔴                      │ │
│  │         🟡                                         │ │
│  │                                                     │ │
│  │  10 entities • 8 relationships                     │ │
│  │  Source: Azure CosmosDB Gremlin API (live data)   │ │
│  │  Query time: 145ms                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                   22:30 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ [Input: Ask me anything...]                    [Send]   │
│ 🏛️ Business Rules  📋 Obligations  🔍 Search: Bribery  │
└──────────────────────────────────────────────────────────┘
```

**User can:**
- ✅ Click nodes to see details
- ✅ Drag nodes to rearrange
- ✅ Zoom in/out
- ✅ Hover to see properties
- ✅ See document sources and page numbers

---

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
│  Click "Business Rules (Live)" button                        │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
│  1. Button sets input: "Show me regulatory BusinessRules"       │
│  2. Pattern matcher detects: regulatory + businessrules         │
│  3. Creates toolCall:                                           │
│     { name: "cosmosdb_query_regulatory_policies",              │
│       arguments: { label: "BusinessRules" } }                   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                 MCP CLIENT                          │
│  4. Creates JSON-RPC request:                                   │
│     { jsonrpc: "2.0", method: "tools/call", params: {...} }    │
│  5. Sends HTTP POST to http://localhost:3001/messages/         │
│  6. Listens on SSE connection for response                     │
└────────────────────────────┬────────────────────────────────────┘
                             ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────────┐
│                MCP SERVER (FastMCP/Python)                       │
│  7. Receives JSON-RPC request                                   │
│  8. Routes to tool: cosmosdb_query_regulatory_policies          │
│  9. Extracts arguments: label = "BusinessRules"                │
│  10. Calls Python function                                      │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              GREMLIN TOOL (Python)                               │
│  11. Gets Gremlin client singleton                              │
│  12. Constructs query: g.V().hasLabel('BusinessRules')         │
│  13. Executes in thread pool (isolated event loop)             │
└────────────────────────────┬────────────────────────────────────┘
                             ↓ WebSocket/Gremlin
┌─────────────────────────────────────────────────────────────────┐
│            AZURE COSMOS DB (Gremlin API)                         │
│  14. Receives Gremlin traversal query                           │
│  15. Executes graph query on 100 vertices                       │
│  16. Returns matching vertices + edges                          │
│  17. Includes all properties (5W1H, document sources)          │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              GREMLIN TOOL (Python)                               │
│  18. Receives raw Gremlin results                               │
│  19. Transforms to frontend format:                             │
│      - Parses node_attributes JSON                              │
│      - Extracts 5W1H properties                                 │
│      - Formats nodes and edges                                  │
│      - Adds metadata                                            │
│  20. Returns JSON string                                        │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                MCP SERVER (FastMCP/Python)                       │
│  21. Wraps result in JSON-RPC response                          │
│  22. Sends via SSE back to client                               │
└────────────────────────────┬────────────────────────────────────┘
                             ↓ SSE
┌─────────────────────────────────────────────────────────────────┐
│                 MCP CLIENT                           │
│  23. Receives SSE message                                       │
│  24. Extracts result from JSON-RPC wrapper                      │
│  25. Promise resolves with JSON string                          │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  26. Creates assistant message with result                      │
│  27. Adds to messages state                                     │
│  28. React re-renders chat                                      │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│            COMPONENT DISPATCHER (React)                          │
│  29. Receives content (JSON string)                             │
│  30. Parses JSON                                                │
│  31. Runs type guards                                           │
│  32. Detects KnowledgeGraphResponse                            │
│  33. Routes to KnowledgeGraphVisualization                      │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│          KNOWLEDGE GRAPH COMPONENT (React)                       │
│  34. Receives parsed graph data                                 │
│  35. Transforms to react-force-graph format                     │
│  36. Renders interactive visualization                          │
│  37. Shows metadata footer                                      │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       USER SEES GRAPH                            │
│  38. Interactive force-directed graph                           │
│  39. 10 nodes (BusinessRules from Cosmos DB)                   │
│  40. 8 edges (LINEAGE relationships)                           │
│  41. Click nodes to see 5W1H properties                        │
│  42. Metadata shows "live data" from Cosmos DB                 │
└─────────────────────────────────────────────────────────────────┘

```

---

## Code Walkthrough

### 1. MCP Server Code (`server/mcp_server_web.py`)

**Purpose:** Expose tools via MCP protocol

```python
# Import FastMCP framework
from mcp.server.fastmcp import FastMCP
import sys
from pathlib import Path

# Add tools directory to path
server_dir = Path(__file__).parent
sys.path.insert(0, str(server_dir))

# Import tool implementations
from tools.knowledge_graph import query_knowledge_graph
from tools.financial_summary import query_financial_summary
from tools.gremlin_cosmos import query_regulatory_policy_graph

# Initialize MCP server
mcp = FastMCP("EnterpriseKPMGServer")

# ============================================================================
# TOOL REGISTRATION
# ============================================================================

@mcp.tool()
def cosmosdb_query_regulatory_policies(label: str) -> str:
    """Query live regulatory policies from Azure Cosmos DB Gremlin API.
    
    Args:
        label: Vertex label or keyword (BusinessRules, Obligations, etc.)
    
    Returns:
        JSON string with graph structure (nodes, edges, metadata)
    """
    return query_regulatory_policy_graph(label)

@mcp.tool()
def cosmosdb_list_policy_categories() -> str:
    """List live regulatory policy categories from Cosmos DB.
    
    Returns:
        JSON string with category list
    """
    return list_policy_categories()

@mcp.tool()
def cosmosdb_search_policies(search_term: str) -> str:
    """Search live regulatory policies in Cosmos DB.
    
    Args:
        search_term: Keyword to search (e.g., "Bribery", "Crime")
    
    Returns:
        JSON string with matching graph data
    """
    return search_policies_by_term(search_term)

# ============================================================================
# START SERVER
# ============================================================================

if __name__ == "__main__":
    # Start with SSE transport
    mcp.run()
```

**Key Points:**

1. **`@mcp.tool()` Decorator:**
   - Registers function as MCP tool
   - Tool name = function name
   - Docstring becomes tool description
   - Type hints define parameter schema

2. **Type Validation:**
   - FastMCP validates parameters using type hints
   - `label: str` ensures label is a string
   - Returns JSON string (tool output)

3. **Automatic Schema Generation:**
   - FastMCP reads function signature
   - Creates MCP tool schema automatically
   - No manual schema definition needed

---

### 2. MCP Client Code (`frontend/lib/mcp-client.ts`)

**Purpose:** Connect to MCP server and call tools

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export class MCPClient {
  private client: Client | null = null;
  private transport: SSEClientTransport | null = null;
  private tools: MCPTool[] = [];
  private serverUrl: string = '';
  private nextId = 1;
  private eventSource: EventSource | null = null;
  private responseHandlers = new Map<number, (result: any) => void>();

  /**
   * Connect to MCP server via SSE
   */
  async connect(serverUrl: string): Promise<MCPTool[]> {
    this.serverUrl = serverUrl;
    
    // Establish SSE connection
    this.eventSource = new EventSource(serverUrl);
    
    // Handle incoming messages
    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Route to appropriate handler
      if (data.id && this.responseHandlers.has(data.id)) {
        const handler = this.responseHandlers.get(data.id)!;
        handler(data.result);
        this.responseHandlers.delete(data.id);
      }
    };
    
    // List available tools
    const tools = await this.listTools();
    this.tools = tools;
    
    return tools;
  }

  /**
   * List available tools from server
   */
  async listTools(): Promise<MCPTool[]> {
    const request = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'tools/list'
    };
    
    return new Promise((resolve) => {
      this.responseHandlers.set(request.id, (result) => {
        resolve(result.tools || []);
      });
      
      this.sendRequest(request);
    });
  }

  /**
   * Call a tool with arguments
   */
  async callTool(name: string, arguments_: Record<string, unknown>): Promise<string> {
    const request = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'tools/call',
      params: {
        name,
        arguments: arguments_
      }
    };
    
    return new Promise((resolve, reject) => {
      this.responseHandlers.set(request.id, (result) => {
        if (result.error) {
          reject(new Error(result.error.message));
        } else {
          // Extract text from content array
          const content = result.content || [];
          const text = content[0]?.text || '';
          resolve(text);
        }
      });
      
      this.sendRequest(request);
    });
  }

  /**
   * Send JSON-RPC request to server
   */
  private async sendRequest(request: any): Promise<void> {
    const response = await fetch(`${this.serverUrl.replace('/sse', '')}/messages/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Get cached tools
   */
  getTools(): MCPTool[] {
    return this.tools;
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}
```

**Key Points:**

1. **SSE Transport:**
   - `EventSource` for receiving messages
   - HTTP POST for sending requests
   - Bidirectional communication

2. **Promise-Based API:**
   - Each request gets unique ID
   - Response handler registered for that ID
   - Promise resolves when response arrives

3. **Type Safety:**
   - TypeScript interfaces for tools
   - Typed parameters and returns
   - Compile-time validation

---

### 3. Tool Implementation (`server/tools/gremlin_cosmos.py`)

**Purpose:** Query Azure Cosmos DB Gremlin API

```python
import json
import os
from typing import Dict, Any, List
from datetime import datetime, timezone
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor

from gremlin_python.driver import client, serializer
from gremlin_python.driver.protocol import GremlinServerError

load_dotenv()

class GremlinCosmosTools:
    """Tool for querying regulatory policy graph from Cosmos DB"""
    
    def __init__(self):
        """Initialize Gremlin client"""
        # Get credentials from .env
        self.endpoint = os.getenv("COSMOS_DB_ENDPOINT")
        self.database = os.getenv("COSMOS_DB_DATABASE_NAME")
        self.graph = os.getenv("COSMOS_DB_CONTAINER_NAME")
        self.password = os.getenv("COSMOS_DB_PRIMARY_KEY")
        self.username = f"/dbs/{self.database}/colls/{self.graph}"
        
        # Initialize Gremlin client
        self.client = client.Client(
            url=self.endpoint,
            traversal_source='g',
            username=self.username,
            password=self.password,
            message_serializer=serializer.GraphSONSerializersV2d0()
        )
    
    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute Gremlin query in thread pool (avoid event loop conflicts)"""
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self._execute_sync, query)
                results = future.result(timeout=30)
                return results
        except Exception as e:
            print(f"Error executing Gremlin query: {e}")
            return []
    
    def _execute_sync(self, query: str) -> List[Dict[str, Any]]:
        """Execute with isolated event loop"""
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                callback = self.client.submit(query)
                results = callback.all().result()
                return results
            finally:
                loop.close()
        except Exception as e:
            print(f"Error in _execute_sync: {e}")
            return []
    
    def query_by_label(self, label: str, limit: int = 50) -> Dict[str, Any]:
        """Query vertices by label"""
        # Query vertices
        vertex_query = f"g.V().hasLabel('{label}').limit({limit}).valueMap(true)"
        vertices = self.execute_query(vertex_query)
        
        # Query edges
        edge_query = f"g.V().hasLabel('{label}').limit({limit}).outE().valueMap(true)"
        edges = self.execute_query(edge_query)
        
        # Transform to graph format
        return self.transform_to_graph(vertices, edges, label)
    
    def transform_to_graph(self, vertices, edges, topic) -> Dict[str, Any]:
        """Transform Gremlin results to frontend format"""
        nodes = []
        
        # Transform vertices to nodes
        for vertex in vertices:
            node_id = vertex.get('id')
            label = vertex.get('label', ['Unknown'])[0]
            name = vertex.get('name', [node_id])[0]
            
            # Parse node_attributes JSON
            node_attrs_raw = vertex.get('node_attributes', ['[]'])[0]
            node_attrs = json.loads(node_attrs_raw)
            attrs_dict = {item['key']: item['value'] for item in node_attrs}
            
            node = {
                "id": str(node_id),
                "label": name.replace("_", " ").title(),
                "type": label,
                "description": attrs_dict.get('what', 'No description'),
                "properties": {
                    "category": label,
                    **attrs_dict  # why, what, who, where, when, how
                }
            }
            nodes.append(node)
        
        # Transform edges
        links = []
        for edge in edges:
            link = {
                "source": str(edge.get('outV')),
                "target": str(edge.get('inV')),
                "relationship": edge.get('label', 'RELATED'),
                "properties": {
                    "document_source": edge.get('document_source', [''])[0],
                    "source_page": edge.get('source_page', [''])[0]
                }
            }
            links.append(link)
        
        return {
            "nodes": nodes,
            "edges": links,
            "metadata": {
                "topic": topic,
                "node_count": len(nodes),
                "edge_count": len(links),
                "source": "Azure CosmosDB Gremlin API (live data)",
                "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "database": self.database,
                "graph": self.graph
            }
        }

# Singleton
_gremlin_tool = None

def get_gremlin_tool() -> GremlinCosmosTools:
    global _gremlin_tool
    if _gremlin_tool is None:
        _gremlin_tool = GremlinCosmosTools()
    return _gremlin_tool

# MCP Tool Function
def query_regulatory_policy_graph(label: str) -> str:
    """MCP tool: Query live regulatory policies from Cosmos DB"""
    try:
        tool = get_gremlin_tool()
        graph_data = tool.query_by_label(label, limit=50)
        return json.dumps(graph_data, indent=2)
    except Exception as e:
        return json.dumps({
            "error": str(e),
            "nodes": [],
            "edges": []
        })
```

**Key Points:**

1. **Thread Pool Execution:**
   - Gremlin queries run in separate thread
   - Each thread has isolated event loop
   - Avoids conflicts with FastMCP's asyncio loop

2. **Credentials from Environment:**
   - Loads from `.env` file
   - Endpoint, database, graph, password
   - Secure (not in code)

3. **Data Transformation:**
   - Converts Gremlin format to frontend format
   - Parses JSON-encoded attributes
   - Adds metadata

---

## MCP Tools Deep Dive

### Tool Categories

We have **12 tools** in 3 categories:

#### 1. Basic Tools (3)

**Purpose:** Demonstrate simple MCP tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `check_system_health` | Get OS, CPU, memory stats | None | Plain text report |
| `calculate` | Basic arithmetic | `a, b, operation` | Calculation result |
| `greet_user` | Personalized greeting | `name` | Greeting message |

**Example:**
```python
@mcp.tool()
def calculate(a: float, b: float, operation: str) -> str:
    """Perform basic math operations"""
    if operation == "add":
        return f"{a} + {b} = {a + b}"
    # ... more operations
```

#### 2. Enterprise Tools - Mock Data (6)

**Purpose:** Demonstrate Generative UI with mock data

**Knowledge Graph Tools:**
| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `query_enterprise_knowledge_graph` | Query knowledge graph | `topic` | JSON (nodes, edges) |
| `list_available_knowledge_topics` | List available topics | None | JSON (topic list) |
| `summarize_knowledge_topic` | Get topic summary | `topic` | JSON (metadata) |

**Financial Dashboard Tools:**
| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `query_financial_dashboard` | Query financial data | `report_type` | JSON (dashboard data) |
| `list_available_financial_reports` | List reports | None | JSON (report list) |
| `summarize_financial_report` | Get report summary | `report_type` | JSON (metadata) |

**Data Source:** JSON files in `server/mock_data/`

#### 3. Enterprise Tools - Live Data (3)

**Purpose:** Demonstrate real-time data from Azure Cosmos DB

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `cosmosdb_query_regulatory_policies` | Query by label | `label` | JSON (graph data) |
| `cosmosdb_list_policy_categories` | List categories | None | JSON (category list) |
| `cosmosdb_search_policies` | Search by keyword | `search_term` | JSON (search results) |

**Data Source:** Azure Cosmos DB Gremlin API (100 live vertices)

---

### Tool Registration Process

**Step 1: Define Function**
```python
def cosmosdb_query_regulatory_policies(label: str) -> str:
    """Query live regulatory policies from Azure Cosmos DB"""
    # Implementation
    return json_string
```

**Step 2: Add Decorator**
```python
@mcp.tool()
def cosmosdb_query_regulatory_policies(label: str) -> str:
    """Query live regulatory policies from Azure Cosmos DB"""
    # Implementation
    return json_string
```

**Step 3: FastMCP Generates Schema**
```json
{
  "name": "cosmosdb_query_regulatory_policies",
  "description": "Query live regulatory policies from Azure Cosmos DB",
  "inputSchema": {
    "type": "object",
    "properties": {
      "label": {
        "type": "string"
      }
    },
    "required": ["label"]
  }
}
```

**Step 4: Tool Available via MCP**
- Client calls `listTools()` → sees this tool
- Client calls `callTool("cosmosdb_query_regulatory_policies", {label: "BusinessRules"})`
- Server routes to Python function
- Function executes and returns result

---

## MCP Transport Layers

### What is a Transport?

A **transport** is the mechanism for sending MCP messages between client and server.

### Available Transports

| Transport | Protocol | Use Case | Pros | Cons |
|-----------|----------|----------|------|------|
| **SSE** | HTTP + Server-Sent Events | Web apps | Simple, firewall-friendly | One-way streaming (server→client) |
| **WebSocket** | WebSocket | Real-time apps | Bidirectional, low latency | More complex, some firewalls block |
| **stdio** | Standard input/output | CLI tools, Claude Desktop | Simple, no network | Local only |
| **HTTP** | HTTP POST/GET | Simple APIs | Universal, cacheable | No streaming, higher latency |

### Our Choice: SSE (Server-Sent Events)

**Why SSE?**
- ✅ HTTP-based (works through corporate firewalls)
- ✅ Built-in to FastMCP
- ✅ Auto-reconnection
- ✅ Good enough for POC (low message volume)
- ✅ Simpler than WebSocket

**How SSE Works:**

```
Client                          Server
  |                               |
  |  GET /sse                     |
  |------------------------------>|
  |                               |
  |  200 OK                       |
  |  Content-Type: text/event-stream
  |<------------------------------|
  |                               |
  |  (connection stays open)      |
  |                               |
  |  event: message               |
  |  data: {...}                  |
  |<------------------------------|
  |                               |
  |  event: message               |
  |  data: {...}                  |
  |<------------------------------|
  |                               |
```

**Client sends requests via HTTP POST:**
```
Client                          Server
  |                               |
  |  POST /messages/              |
  |  Body: {"method":"tools/call"}|
  |------------------------------>|
  |                               |
  |  202 Accepted                 |
  |<------------------------------|
  |                               |
  |  (response comes via SSE)     |
  |  event: message               |
  |  data: {result: ...}          |
  |<------------------------------|
```

### SSE Implementation

**Server (Python/FastMCP):**
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("ServerName")

# ... register tools ...

if __name__ == "__main__":
    # Start with SSE transport
    mcp.run()  # Defaults to SSE on port 3001
```

**Client (TypeScript):**
```typescript
// Establish SSE connection
const eventSource = new EventSource('http://localhost:3001/sse');

// Listen for messages
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle response
};

// Send request via HTTP POST
await fetch('http://localhost:3001/messages/', {
  method: 'POST',
  body: JSON.stringify(request)
});
```

---

## Message Flow & Protocol

### MCP Message Types

MCP uses **JSON-RPC 2.0** format for messages.

#### 1. List Tools Request

**Client → Server:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Server → Client:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "cosmosdb_query_regulatory_policies",
        "description": "Query live regulatory policies",
        "inputSchema": {
          "type": "object",
          "properties": {
            "label": {"type": "string"}
          },
          "required": ["label"]
        }
      }
    ]
  }
}
```

#### 2. Call Tool Request

**Client → Server:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "cosmosdb_query_regulatory_policies",
    "arguments": {
      "label": "BusinessRules"
    }
  }
}
```

**Server → Client:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"nodes\": [...], \"edges\": [...], \"metadata\": {...}}"
      }
    ]
  }
}
```

#### 3. Error Response

**Server → Client:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32600,
    "message": "Invalid parameters",
    "data": {
      "details": "label is required"
    }
  }
}
```

### Complete Message Flow Example

**Scenario:** User clicks "Business Rules (Live)" button

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User Action                                             │
└─────────────────────────────────────────────────────────────────┘
User clicks button
  ↓
Input set to: "Show me regulatory BusinessRules"
  ↓
Form submitted

┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Pattern Matching (Frontend)                            │
└─────────────────────────────────────────────────────────────────┘
if (lowerInput.includes('regulatory') && lowerInput.includes('businessrules')) {
  toolCall = {
    name: 'cosmosdb_query_regulatory_policies',
    arguments: { label: 'BusinessRules' }
  };
}

┌─────────────────────────────────────────────────────────────────┐
│ Step 3: MCP Request (Frontend → Backend)                       │
└─────────────────────────────────────────────────────────────────┘
POST http://localhost:3001/messages/?session_id=abc123
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "cosmosdb_query_regulatory_policies",
    "arguments": {
      "label": "BusinessRules"
    }
  }
}

Server responds: 202 Accepted

┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Tool Execution (Backend)                               │
└─────────────────────────────────────────────────────────────────┘
FastMCP routes to Python function:
cosmosdb_query_regulatory_policies(label="BusinessRules")
  ↓
Calls: query_regulatory_policy_graph("BusinessRules")
  ↓
Gets Gremlin client
  ↓
Constructs query: g.V().hasLabel('BusinessRules').limit(50).valueMap(true)
  ↓
Executes in thread pool
  ↓
Query sent to Cosmos DB via WebSocket

┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Database Query (Azure Cosmos DB)                       │
└─────────────────────────────────────────────────────────────────┘
Cosmos DB receives Gremlin query
  ↓
Executes graph traversal
  ↓
Returns 10 vertices with properties
  ↓
Returns edges (relationships)

┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Data Transformation (Backend)                          │
└─────────────────────────────────────────────────────────────────┘
Gremlin tool receives raw results
  ↓
Parses node_attributes JSON
  ↓
Extracts 5W1H properties
  ↓
Formats nodes and edges
  ↓
Adds metadata (source, timestamp, counts)
  ↓
Returns JSON string

┌─────────────────────────────────────────────────────────────────┐
│ Step 7: MCP Response (Backend → Frontend)                      │
└─────────────────────────────────────────────────────────────────┘
via SSE (event stream):

event: message
data: {
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"nodes\": [...], \"edges\": [...], \"metadata\": {...}}"
      }
    ]
  }
}

┌─────────────────────────────────────────────────────────────────┐
│ Step 8: Response Handling (Frontend)                           │
└─────────────────────────────────────────────────────────────────┘
SSE listener receives message
  ↓
Extracts result.content[0].text
  ↓
Promise resolves with JSON string
  ↓
Creates assistant message with result
  ↓
Adds to messages state
  ↓
React re-renders

┌─────────────────────────────────────────────────────────────────┐
│ Step 9: Visualization (Frontend)                               │
└─────────────────────────────────────────────────────────────────┘
ComponentDispatcher receives content
  ↓
Parses JSON
  ↓
Runs type guards
  ↓
Detects KnowledgeGraphResponse
  ↓
Routes to KnowledgeGraphVisualization
  ↓
Renders interactive graph
  ↓
User sees visualization!

Total time: ~300ms
```

---

## Data Structures & Schemas

### Knowledge Graph Response Schema

**File:** `frontend/lib/types.ts`

```typescript
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  description: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relationship: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraphMetadata {
  topic: string;
  node_count: number;
  edge_count: number;
  generated_at: string;
  query_time_ms: number;
  source: string;
  database?: string;
  graph?: string;
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metadata: KnowledgeGraphMetadata;
  query?: string;
  timestamp?: string;
}
```

### Example Response

```json
{
  "nodes": [
    {
      "id": "Economic_Crime_Prevention_Policy",
      "label": "Economic Crime Prevention Policy",
      "type": "BusinessRules",
      "description": "Comprehensive policy for preventing economic crime",
      "properties": {
        "category": "BusinessRules",
        "why": "to assist in managing economic crime risk",
        "what": "Policy framework for economic crime prevention",
        "who": "Regulated Entity",
        "where": "UK and other jurisdictions",
        "when": "October 2023",
        "how": "Through risk assessment and controls"
      }
    },
    {
      "id": "Anti-Bribery_Legislation_Compliance",
      "label": "Anti-Bribery Legislation Compliance",
      "type": "Obligations",
      "description": "Compliance with anti-bribery legislation",
      "properties": {
        "category": "Obligations",
        "why": "legal requirement to prevent bribery",
        "what": "Obligation to comply with UK Bribery Act 2010",
        "who": "Regulated Entity",
        "where": "UK",
        "when": "Ongoing",
        "how": "Through adequate procedures"
      }
    }
  ],
  "edges": [
    {
      "source": "Economic_Crime_Prevention_Policy",
      "target": "Anti-Bribery_Legislation_Compliance",
      "relationship": "LINEAGE",
      "properties": {
        "document_source": "Economic_Crime_Policy.pdf",
        "source_page": "5",
        "link_strength": "high",
        "link_explanation": "Policy requires compliance with anti-bribery legislation"
      }
    }
  ],
  "metadata": {
    "topic": "BusinessRules",
    "node_count": 10,
    "edge_count": 8,
    "source": "Azure CosmosDB Gremlin API (live data)",
    "timestamp": "2026-05-19T22:30:00.000Z",
    "database": "your-database",
    "graph": "your-graph",
    "generated_at": "2026-05-19T22:30:00.000Z",
    "query_time_ms": 145
  }
}
```

### Type Guard Implementation

```typescript
export function isKnowledgeGraphResponse(content: any): content is KnowledgeGraphResponse {
  return (
    content &&
    typeof content === 'object' &&
    Array.isArray(content.nodes) &&
    Array.isArray(content.edges) &&
    content.metadata &&
    typeof content.metadata === 'object'
  );
}
```

**How it works:**
1. Check content exists and is object
2. Check has `nodes` array
3. Check has `edges` array
4. Check has `metadata` object
5. If all true → route to KnowledgeGraphVisualization
6. If false → check next type guard (FinancialDashboardResponse)

---

## Integration Points

### Where MCP Connects Things

```
┌──────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                         │
└──────────────────────────────────────────────────────────────┘

1. Frontend ↔ MCP Client
   - Location: frontend/app/chat/page.tsx
   - Integration: getMCPClient().callTool()
   - Format: TypeScript function calls
   - Protocol: None (local function calls)

2. MCP Client ↔ MCP Server
   - Location: frontend/lib/mcp-client.ts ↔ server/mcp_server_web.py
   - Integration: HTTP/SSE
   - Format: JSON-RPC 2.0
   - Protocol: MCP specification

3. MCP Server ↔ Tools
   - Location: server/mcp_server_web.py ↔ server/tools/*.py
   - Integration: Python function calls
   - Format: Function parameters + return values
   - Protocol: None (local function calls)

4. Tools ↔ Data Sources
   - Location: server/tools/gremlin_cosmos.py ↔ Azure Cosmos DB
   - Integration: Gremlin Python client
   - Format: Gremlin queries (graph traversal language)
   - Protocol: WebSocket + Gremlin protocol
```

### Key Integration Code

**1. Frontend calls MCP Client:**

```tsx
// frontend/app/chat/page.tsx
import { getMCPClient } from '@/lib/mcp-client';

const mcpClient = getMCPClient();

// Call tool
const result = await mcpClient.callTool('cosmosdb_query_regulatory_policies', {
  label: 'BusinessRules'
});
```

**2. MCP Client calls MCP Server:**

```typescript
// frontend/lib/mcp-client.ts
async callTool(name: string, arguments_: Record<string, unknown>): Promise<string> {
  const request = {
    jsonrpc: '2.0',
    id: this.nextId++,
    method: 'tools/call',
    params: { name, arguments: arguments_ }
  };
  
  // Send via HTTP POST
  await fetch(`${this.serverUrl}/messages/`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
  
  // Response comes via SSE
  return new Promise((resolve) => {
    this.responseHandlers.set(request.id, resolve);
  });
}
```

**3. MCP Server calls Tool:**

```python
# server/mcp_server_web.py
@mcp.tool()
def cosmosdb_query_regulatory_policies(label: str) -> str:
    # FastMCP automatically routes here
    return query_regulatory_policy_graph(label)
```

**4. Tool queries Cosmos DB:**

```python
# server/tools/gremlin_cosmos.py
def query_by_label(self, label: str, limit: int) -> Dict[str, Any]:
    # Construct Gremlin query
    query = f"g.V().hasLabel('{label}').limit({limit}).valueMap(true)"
    
    # Execute via Gremlin client
    vertices = self.execute_query(query)
    
    # Transform and return
    return self.transform_to_graph(vertices, edges, label)
```

---

## Benefits We Get from MCP

### 1. **Decoupling**

**Without MCP:**
```
Frontend → Direct API calls → Database
(tightly coupled)
```

**With MCP:**
```
Frontend → MCP Client → MCP Protocol → MCP Server → Database
(loosely coupled)
```

**Benefit:** Change backend without touching frontend

---

### 2. **Automatic Discovery**

**Without MCP:**
```typescript
// Need to manually track what APIs are available
const apis = {
  getBusinessRules: '/api/business-rules',
  getObligations: '/api/obligations',
  // ... manually maintain list
};
```

**With MCP:**
```typescript
// Automatically discover what's available
const tools = await mcpClient.listTools();
// Returns: [{name: "cosmosdb_query_regulatory_policies", ...}, ...]
```

**Benefit:** No manual documentation, always up-to-date

---

### 3. **Type Safety**

**Without MCP:**
```typescript
// No type safety
const result = await fetch('/api/query', {
  body: JSON.stringify({ label: 'BusinessRules' })
});
```

**With MCP:**
```python
# Server defines schema with type hints
@mcp.tool()
def cosmosdb_query_regulatory_policies(label: str) -> str:
    ...

# Client gets schema automatically
const schema = tool.inputSchema;  // {"type": "object", "properties": {"label": {"type": "string"}}}
```

**Benefit:** Compile-time + runtime validation

---

### 4. **Standardization**

**Without MCP:**
```typescript
// Different patterns for different services
const dbResult = await db.query('SELECT ...');
const apiResult = await api.get('/endpoint');
const fileResult = await fs.readFile('file.txt');
```

**With MCP:**
```typescript
// Same pattern for everything
const dbResult = await mcp.callTool('query_database', {sql: '...'});
const apiResult = await mcp.callTool('call_api', {endpoint: '...'});
const fileResult = await mcp.callTool('read_file', {path: '...'});
```

**Benefit:** One pattern to learn, easy to maintain

---

### 5. **AI-Friendly**

**Why MCP matters for AI:**

Traditional APIs aren't designed for AI consumption:
- Documentation is human-readable (not machine-readable)
- No standard schema format
- Hard for AI to discover capabilities
- Manual integration required

MCP is designed for AI:
- Self-describing tools with schemas
- Standard protocol for discovery
- Structured parameters
- AI can automatically understand and use tools

**Example:** Claude AI can directly use MCP tools:
```
Claude Desktop
    ↓ MCP Protocol
Your MCP Server (12 tools)
    ↓
Real data sources
```

Claude can:
1. List available tools
2. Read tool schemas
3. Understand what each tool does
4. Call tools with correct parameters
5. Interpret results

**Without MCP:** You'd need to write custom code to teach Claude about each API.

---

### 6. **Easy to Extend**

**Adding a new tool:**

**Step 1:** Write function
```python
def query_tax_records(year: int) -> str:
    # Implementation
    return json.dumps(results)
```

**Step 2:** Add decorator
```python
@mcp.tool()
def query_tax_records(year: int) -> str:
    # Implementation
    return json.dumps(results)
```

**Done!** Tool is now available via MCP. No need to:
- Update API documentation
- Modify client code
- Register routes
- Write OpenAPI specs

**Benefit:** Add features in minutes, not hours

---

## Comparison: With vs Without MCP

### Scenario: Add New Data Source

Let's say we want to add a new tool to query customer data from Salesforce.

#### Without MCP (Traditional Approach)

**Backend:**
```python
# 1. Create new API endpoint
@app.route('/api/salesforce/customers', methods=['POST'])
def get_salesforce_customers():
    customer_id = request.json.get('customer_id')
    # ... implementation ...
    return jsonify(result)

# 2. Update API documentation (manual)
# 3. Add to OpenAPI spec (manual)
# 4. Test endpoint
```

**Frontend:**
```typescript
// 5. Create new API function
export async function getSalesforceCustomers(customerId: string) {
  const response = await fetch('/api/salesforce/customers', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({customer_id: customerId})
  });
  return response.json();
}

// 6. Add to pattern matching
if (lowerInput.includes('salesforce') || lowerInput.includes('customer')) {
  const result = await getSalesforceCustomers(customerId);
  // ... handle result ...
}

// 7. Add UI button
<button onClick={() => handleSalesforce()}>Get Customers</button>

// 8. Update help text
```

**Total Changes:**
- ❌ Backend: 3 files
- ❌ Frontend: 3 files
- ❌ Documentation: 2 files
- ❌ Time: ~2 hours

---

#### With MCP

**Backend:**
```python
# 1. Add tool function
@mcp.tool()
def query_salesforce_customers(customer_id: str) -> str:
    """Query customer data from Salesforce"""
    # ... implementation ...
    return json.dumps(result)
```

**Frontend:**
```typescript
// 2. Add pattern matching (optional)
else if (lowerInput.includes('salesforce') || lowerInput.includes('customer')) {
  toolCall = {
    name: 'query_salesforce_customers',
    arguments: {customer_id}
  };
}

// 3. Add UI button (optional)
<button onClick={() => setInput('Show me Salesforce customers')}>
  Get Customers
</button>
```

**Total Changes:**
- ✅ Backend: 1 function (10 lines)
- ✅ Frontend: Optional pattern matching (5 lines)
- ✅ Documentation: Auto-generated
- ✅ Time: ~15 minutes

**Benefits:**
- 🚀 8x faster implementation
- ✅ No manual documentation
- ✅ Type-safe by default
- ✅ Auto-discovery (tool shows up in `listTools()`)
- ✅ Works with any MCP client (Claude, custom apps, etc.)

---

### Architecture Comparison

#### Traditional Multi-API Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├──────────────────────────────────────────────────────────────┤
│  Database API Client                                         │
│  ├─ query()                                                  │
│  └─ Custom implementation                                    │
│                                                              │
│  Salesforce API Client                                       │
│  ├─ getCustomers()                                          │
│  └─ Custom implementation                                    │
│                                                              │
│  File System API Client                                      │
│  ├─ readFile()                                              │
│  └─ Custom implementation                                    │
│                                                              │
│  3 different patterns, 3 different error handlers          │
└──────────────────────────────────────────────────────────────┘
                     ↓ (different protocols)
┌──────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
├──────────────────────────────────────────────────────────────┤
│  Database Service (REST)                                     │
│  Salesforce Service (REST)                                   │
│  File Service (gRPC)                                        │
└──────────────────────────────────────────────────────────────┘
```

**Problems:**
- ❌ Each service needs custom client
- ❌ Different error handling per service
- ❌ Manual documentation per service
- ❌ Hard to add new services
- ❌ Inconsistent patterns

---

#### MCP Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├──────────────────────────────────────────────────────────────┤
│                   MCP Client (One Pattern)                   │
│  ├─ listTools()                                             │
│  └─ callTool(name, args)                                    │
│                                                              │
│  Works with ALL tools using same interface                  │
└──────────────────────────────────────────────────────────────┘
                     ↓ (MCP Protocol)
┌──────────────────────────────────────────────────────────────┐
│                       MCP Server                             │
├──────────────────────────────────────────────────────────────┤
│  @mcp.tool() query_database                                 │
│  @mcp.tool() query_salesforce                               │
│  @mcp.tool() read_file                                      │
│  @mcp.tool() ... (any tool)                                 │
│                                                              │
│  All tools follow same pattern                              │
└──────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ One client for everything
- ✅ Consistent error handling
- ✅ Auto-generated documentation
- ✅ Easy to add new tools
- ✅ Standard patterns

---

## Summary

### What is MCP?
A standard protocol for AI applications to communicate with tools and data sources.

### Why Use MCP?
- ✅ **Decoupling:** Frontend and backend are independent
- ✅ **Discovery:** Tools automatically advertise their capabilities
- ✅ **Type Safety:** Built-in schema validation
- ✅ **Standardization:** One pattern for everything
- ✅ **AI-Friendly:** Designed for AI consumption
- ✅ **Easy to Extend:** Add tools in minutes

### How We Use It?
1. **Backend:** FastMCP server exposes 12 tools
2. **Frontend:** MCP client calls tools via SSE
3. **Tools:** Query data sources (mock + live Cosmos DB)
4. **UI:** Automatically renders results as visualizations

### The Big Picture

**MCP is like USB for AI applications:**
- Just like USB standardized how devices connect to computers
- MCP standardizes how AI connects to data and tools
- Plug-and-play: Add new tools without changing clients
- Universal: Works with any MCP-compatible client or server

---

## 🎯 Key Takeaways

1. **MCP is a protocol, not a product**
   - Open standard anyone can implement
   - Multiple implementations (Python, TypeScript, etc.)

2. **MCP enables Generative UI**
   - Tools return structured data
   - Frontend automatically renders appropriate UI
   - Same interface, different visualizations

3. **MCP is AI-native**
   - Designed for AI agents to discover and use tools
   - Self-describing schemas
   - Works with Claude, custom apps, etc.

4. **MCP simplifies integration**
   - One pattern for all data sources
   - Type-safe by default
   - Easy to add new tools

5. **MCP is production-ready**
   - Used by Claude Desktop
   - Support for multiple transports (SSE, WebSocket, stdio)
   - Error handling, retries, reconnection

---

## 📚 Additional Resources

- **MCP Specification:** https://modelcontextprotocol.io/
- **FastMCP Documentation:** https://github.com/jlowin/fastmcp
- **MCP SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Our Project Documentation:**
  - [README.md](README.md) - Project overview
  - [COSMOS_DB_UI_INTEGRATION_COMPLETE.md](COSMOS_DB_UI_INTEGRATION_COMPLETE.md) - Latest updates
  - [COSMOS_DB_QUICK_REFERENCE.md](COSMOS_DB_QUICK_REFERENCE.md) - Quick troubleshooting

---

**Last Updated:** 2026-05-19  
**Status:** ✅ Complete and Ready for Demo  
**Project:** KPMG MCP Apps POC
