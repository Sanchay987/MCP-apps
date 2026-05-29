# MCP Protocol Cheatsheet

Quick reference for all Model Context Protocol messages you'll see in the Inspector.

---

## Protocol Lifecycle

```
1. INITIALIZE → Handshake between client and server
2. CAPABILITIES → Exchange what each side supports
3. LIST TOOLS → Discover available tools
4. CALL TOOL → Execute a specific tool
5. RESPONSE → Return tool results
```

---

## 1. Initialize Request

**What:** Client introduces itself to server  
**When:** First message in every session  
**Direction:** Client → Server

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
      "name": "azure-gpt-mcp-client",
      "version": "1.0.0"
    }
  }
}
```

## 2. Initialize Response

**What:** Server confirms protocol and shares capabilities  
**Direction:** Server → Client

```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "logging": {},
      "prompts": {}
    },
    "serverInfo": {
      "name": "TrivialServer",
      "version": "0.1.0"
    }
  }
}
```

---

## 3. List Tools Request

**What:** Client asks for all available tools  
**When:** After initialization  
**Direction:** Client → Server

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

## 4. List Tools Response

**What:** Server returns tool catalog with schemas  
**Direction:** Server → Client

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "check_system_health",
        "description": "Returns the current system health, including OS and memory usage.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": [],
          "additionalProperties": false
        }
      },
      {
        "name": "calculate",
        "description": "Performs basic math operations: add, subtract, multiply, divide.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "a": { "type": "number", "title": "A" },
            "b": { "type": "number", "title": "B" },
            "operation": { "type": "string", "title": "Operation" }
          },
          "required": ["a", "b", "operation"],
          "additionalProperties": false
        }
      },
      {
        "name": "greet_user",
        "description": "Generates a friendly greeting for the given name.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "title": "Name" }
          },
          "required": ["name"],
          "additionalProperties": false
        }
      }
    ]
  }
}
```

---

## 5. Call Tool Request (Example: Health Check)

**What:** Client executes a tool with no parameters  
**When:** User query triggers tool selection  
**Direction:** Client → Server

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

## 6. Call Tool Response (Health Check Result)

**What:** Server returns tool execution results  
**Direction:** Server → Client

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

## 7. Call Tool Request (Example: Calculator)

**What:** Client executes a tool with parameters  
**Direction:** Client → Server

```json
{
  "jsonrpc": "2.0",
  "id": 3,
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

## 8. Call Tool Response (Calculator Result)

**What:** Server returns calculated result  
**Direction:** Server → Client

```json
{
  "jsonrpc": "2.0",
  "id": 3,
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

## 9. Call Tool Request (Example: Greeting)

**What:** Client calls greeting tool with name parameter  
**Direction:** Client → Server

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "greet_user",
    "arguments": {
      "name": "Sanchay"
    }
  }
}
```

## 10. Call Tool Response (Greeting Result)

**What:** Server returns personalized greeting  
**Direction:** Server → Client

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Hello, Sanchay! Welcome to the MCP Apps demonstration. I'm powered by the Model Context Protocol!"
      }
    ],
    "isError": false
  }
}
```

---

## Error Response Example

**What:** Server returns error when tool execution fails  
**Direction:** Server → Client

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "detail": "Missing required parameter: 'operation'"
    }
  }
}
```

---

## JSON-RPC Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Missing jsonrpc field |
| -32601 | Method not found | Unknown tool name |
| -32602 | Invalid params | Wrong parameter type |
| -32603 | Internal error | Tool execution crashed |

---

## Message Anatomy

Every MCP message has:

```json
{
  "jsonrpc": "2.0",        // Protocol version (always "2.0")
  "id": 123,               // Request ID (for matching request/response)
  "method": "tools/call",  // What action to take
  "params": {...}          // Action parameters
}
```

Every response has:

```json
{
  "jsonrpc": "2.0",
  "id": 123,              // Same ID as request
  "result": {...}         // Success result
  // OR
  "error": {...}          // Error details
}
```

---

## Tool Input Schema Format

MCP uses JSON Schema to define tool parameters:

```json
{
  "type": "object",
  "properties": {
    "param_name": {
      "type": "string",      // string, number, boolean, array, object
      "title": "Human Name",
      "description": "Detailed help text",
      "enum": ["opt1", "opt2"],  // Optional: restrict to choices
      "default": "value"          // Optional: default value
    }
  },
  "required": ["param_name"],   // Which params are mandatory
  "additionalProperties": false  // Reject unknown params
}
```

---

## Tool Response Content Types

MCP supports multiple content types in responses:

**Text Content:**
```json
{
  "type": "text",
  "text": "The result is 42"
}
```

**Image Content (base64):**
```json
{
  "type": "image",
  "data": "iVBORw0KGgoAAAANSUhEUg...",
  "mimeType": "image/png"
}
```

**Resource Content:**
```json
{
  "type": "resource",
  "resource": {
    "uri": "file:///path/to/resource",
    "mimeType": "text/plain",
    "text": "Resource content"
  }
}
```

---

## Common Methods

| Method | Purpose | Direction |
|--------|---------|-----------|
| `initialize` | Handshake | Client → Server |
| `tools/list` | Get available tools | Client → Server |
| `tools/call` | Execute a tool | Client → Server |
| `resources/list` | Get available resources | Client → Server |
| `resources/read` | Read resource content | Client → Server |
| `prompts/list` | Get available prompts | Client → Server |
| `prompts/get` | Get prompt template | Client → Server |
| `logging/setLevel` | Configure logging | Client → Server |

---

## Inspect These Messages

To see all of the above in action:

```bash
# Start inspector
npx @modelcontextprotocol/inspector python server_copy.py

# Open browser at localhost:5173
# Click through tabs to see:
# - Server Info (initialize response)
# - Tools (tools/list response)
# - Test each tool (tools/call requests + responses)
```

---

## Key Takeaways

1. **JSON-RPC 2.0** - Industry standard, not proprietary
2. **Request/Response IDs** - Match requests to responses
3. **Typed Schemas** - JSON Schema for validation
4. **Content Types** - Flexible return formats
5. **Error Handling** - Standard error codes

**This is what makes MCP model-agnostic:** Any client that speaks JSON-RPC can use any server.

---

## Next: Compare with Azure GPT Flow

When you run `client.py`, the flow is:

1. User types: "What is 42 times 17?"
2. Azure GPT receives the query
3. Azure GPT sees tool schemas (from MCP `tools/list`)
4. Azure GPT decides to call `calculate` tool
5. Client sends MCP `tools/call` request
6. Server executes and returns result
7. Azure GPT incorporates result into answer
8. User sees: "42 × 17 = 714"

**The MCP messages in steps 5-6 are identical whether the LLM is GPT, Claude, Gemini, or anything else.**

---

*Print this cheatsheet and refer to it while exploring the Inspector!*
