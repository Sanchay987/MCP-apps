# MCP Inspector Guide - See Everything in the Protocol

The MCP Inspector lets you see every detail of the Model Context Protocol communication between client and server.

---

## What Can You Inspect?

- ✓ **All Protocol Messages** - Every JSON-RPC request and response
- ✓ **Tool Schemas** - Complete parameter definitions with types
- ✓ **Server Capabilities** - What features the server supports
- ✓ **Tool Execution** - Run tools manually and see raw results
- ✓ **Protocol Flow** - Initialize → Discovery → Execution lifecycle

---

## Quick Start with Inspector

### Option 1: One-Line Inspector (Easiest)

```bash
# Run this from the prodcheckgpt folder
npx @modelcontextprotocol/inspector python server_copy.py
```

**What happens:**
1. npm downloads the inspector (first time only)
2. Starts your MCP server
3. Opens browser at `http://localhost:5173`
4. Shows interactive UI

**No installation needed!** `npx` runs it directly.

---

## Using the Inspector UI

### Tab 1: Server Info

Shows metadata about your MCP server:

```json
{
  "name": "TrivialServer",
  "version": "1.0.0",
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {}
  }
}
```

### Tab 2: Tools

Lists all available tools with full schemas.

**Example: `check_system_health` tool**
```json
{
  "name": "check_system_health",
  "description": "Returns the current system health, including OS and memory usage.",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false
  }
}
```

**Example: `calculate` tool**
```json
{
  "name": "calculate",
  "description": "Performs basic math operations: add, subtract, multiply, divide.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "a": {
        "type": "number",
        "title": "A"
      },
      "b": {
        "type": "number",
        "title": "B"
      },
      "operation": {
        "type": "string",
        "title": "Operation"
      }
    },
    "required": ["a", "b", "operation"],
    "additionalProperties": false
  }
}
```

### Tab 3: Testing Tools

Click any tool to test it interactively.

**Example: Testing the calculator**

1. Click "Tools" in sidebar
2. Select "calculate"
3. Fill in the form:
   - `a`: 42
   - `b`: 17
   - `operation`: multiply
4. Click "Call Tool"

**You'll see the request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "calculate",
    "arguments": {
      "a": 42,
      "b": 17,
      "operation": "multiply"
    }
  }
}
```

**And the response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "42 × 17 = 714"
      }
    ],
    "isError": false
  }
}
```

---

## Understanding the Protocol Messages

### 1. Initialize Handshake

**Client → Server:**
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": {
        "listChanged": true
      }
    },
    "clientInfo": {
      "name": "mcp-inspector",
      "version": "1.0.0"
    }
  }
}
```

**Server → Client:**
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "logging": {}
    },
    "serverInfo": {
      "name": "TrivialServer",
      "version": "0.1.0"
    }
  }
}
```

### 2. Tool Discovery

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
        "name": "check_system_health",
        "description": "Returns the current system health...",
        "inputSchema": {...}
      },
      {
        "name": "calculate",
        "description": "Performs basic math operations...",
        "inputSchema": {...}
      },
      {
        "name": "greet_user",
        "description": "Generates a friendly greeting...",
        "inputSchema": {...}
      }
    ]
  }
}
```

### 3. Tool Execution

**Client → Server:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "check_system_health",
    "arguments": {}
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
        "text": "System Health Report:\n- OS: Darwin 25.3.0\n- CPU: 8 cores, 15.2% usage\n- Memory: 67.5% used (10.80GB / 16.00GB)\n- Available Memory: 5.20GB"
      }
    ],
    "isError": false
  }
}
```

---

## Advanced: CLI Inspector with Logging

For command-line debugging and logging all messages:

```bash
# Install globally (one time)
npm install -g @modelcontextprotocol/inspector

# Run with verbose logging
mcp-inspector python server_copy.py --verbose
```

**Output shows every message:**
```
→ Client sent: {"jsonrpc":"2.0","id":0,"method":"initialize",...}
← Server replied: {"jsonrpc":"2.0","id":0,"result":{...}}
→ Client sent: {"jsonrpc":"2.0","id":1,"method":"tools/list"}
← Server replied: {"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
```

---

## Adding Logging to Your Own Client

Want to see protocol messages when running `client.py`?

**Add to client.py (after imports):**

```python
import logging

# Enable debug logging for MCP
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Or be more specific
logging.getLogger('mcp').setLevel(logging.DEBUG)
```

Then run `python client.py` and you'll see all protocol traffic.

---

## Inspecting Azure GPT ↔ MCP Communication

To see the **full flow** from Azure GPT through MCP to your tools:

1. **Terminal 1: Start Inspector**
   ```bash
   npx @modelcontextprotocol/inspector python server_copy.py
   ```

2. **Terminal 2: Run client with logging**
   ```bash
   # Edit client.py to add logging.basicConfig(level=logging.DEBUG)
   python client.py
   ```

3. **Browser: Watch Inspector**
   - See each tool call as GPT makes them
   - Compare what GPT requested vs what the server returned

---

## Protocol Flow Diagram

```
┌────────────────────┐
│  Azure GPT Client  │
└─────────┬──────────┘
          │
          │ 1. initialize()
          ↓
┌────────────────────┐
│   MCP Session      │
│  (Client-side)     │
└─────────┬──────────┘
          │
          │ 2. list_tools()
          ↓
┌────────────────────┐       ┌──────────────────┐
│  stdio Transport   │◄─────►│  MCP Inspector   │
│  (JSON-RPC over    │       │  (Browser UI)    │
│   stdin/stdout)    │       └──────────────────┘
└─────────┬──────────┘
          │
          │ 3. tools/call
          ↓
┌────────────────────┐
│  MCP Server        │
│  (server_copy.py)  │
└─────────┬──────────┘
          │
          │ 4. Execute tool
          ↓
┌────────────────────┐
│  Tool Functions    │
│  @mcp.tool()       │
└────────────────────┘
```

---

## Use Cases for Inspector

### During Development
- ✓ Verify tool schemas are correct
- ✓ Test tools before connecting to LLM
- ✓ Debug parameter validation issues

### During Demo (Day 3)
- ✓ Show leadership the protocol transparency
- ✓ Demonstrate standardized contracts
- ✓ Prove no vendor lock-in (JSON-RPC standard)

### During Debugging
- ✓ See exact error messages from server
- ✓ Validate client sends correct arguments
- ✓ Trace request/response pairs

---

## Inspector vs. Client.py

| Feature | MCP Inspector | client.py |
|---------|---------------|-----------|
| See protocol messages | ✓ All messages | Only with logging |
| Test tools manually | ✓ Interactive UI | Must write code |
| No LLM needed | ✓ Direct testing | Requires Azure GPT |
| See tool schemas | ✓ Full JSON display | Only in code |
| Good for demos | ✓ Visual | ✓ End-to-end |

**Use both!**
- Inspector: Validate server works correctly
- Client.py: Prove GPT integration works

---

## Quick Reference Commands

```bash
# One-line inspector (easiest)
npx @modelcontextprotocol/inspector python server_copy.py

# Install globally (optional)
npm install -g @modelcontextprotocol/inspector
mcp-inspector python server_copy.py

# With verbose logging
mcp-inspector python server_copy.py --verbose

# Inspect a different server
npx @modelcontextprotocol/inspector python ../server.py

# Using a custom port
npx @modelcontextprotocol/inspector python server_copy.py --port 6000
```

---

## Screenshot Checklist for Day 3 Demo

Capture these Inspector views for the presentation:

- [ ] Server Info tab (shows server name + capabilities)
- [ ] Tools tab (all 3 tools with schemas visible)
- [ ] Calculate tool test (show request + response JSON)
- [ ] Tool execution results
- [ ] Compare with client.py output (same tool, same result)

This proves: **Same protocol, works with any client (Inspector, GPT, Claude, etc.)**

---

## Troubleshooting Inspector

**Error: `npx: command not found`**
- Install Node.js from https://nodejs.org
- Restart terminal after installation

**Error: Port 5173 already in use**
- Another app is using that port
- Use: `npx @modelcontextprotocol/inspector python server_copy.py --port 6000`

**Error: Browser doesn't open**
- Manually open: http://localhost:5173
- Check if a firewall is blocking it

**Error: Server crashes in Inspector**
- Check server_copy.py runs standalone: `python server_copy.py`
- Look for Python errors in the Inspector terminal output

---

## Next Steps

After inspecting the protocol:
1. ✓ You understand how MCP works at the wire level
2. ✓ You can explain it to leadership (JSON-RPC, not black box)
3. ✓ You're ready to build enterprise tools (Day 2)
4. ✓ You can debug any integration issue

**Try it now:**
```bash
npx @modelcontextprotocol/inspector python server_copy.py
```

Open http://localhost:5173 and explore!
