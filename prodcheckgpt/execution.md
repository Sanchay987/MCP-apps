# Execution Guide: Azure GPT + MCP Server Testing

Complete step-by-step guide for testing MCP with Azure GPT.

## Quick Start

```bash
cd /Users/sanchaychauhan/Downloads/KPMG/POC_MCP_APPS/prodcheckgpt
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp config.env.example config.env
# Edit config.env with your Azure credentials
python client.py
```

## Detailed Steps

### 1. Setup Environment

Navigate to prodcheckgpt folder and create virtual environment:
```bash
cd /Users/sanchaychauhan/Downloads/KPMG/POC_MCP_APPS/prodcheckgpt
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs: openai, mcp, python-dotenv, psutil, anyio, pydantic

### 3. Configure Azure OpenAI

```bash
cp config.env.example config.env
nano config.env
```

Add your Azure credentials:
- AZURE_OPENAI_ENDPOINT (from Azure Portal)
- AZURE_OPENAI_API_KEY (from Keys section)
- AZURE_OPENAI_DEPLOYMENT (your model deployment name)

### 4. Run Test

```bash
python client.py
```

### Expected Behavior

The script will:
1. Connect to the MCP server (server_copy.py)
2. Discover 3 available tools
3. Run 4 test queries
4. Show GPT selecting and calling tools automatically

### Sample Output

```
✓ Connected to MCP server
✓ Available tools: ['check_system_health', 'calculate', 'greet_user']

User: What's the health of my system?
🔧 GPT decided to use tools...
  → Calling check_system_health
Assistant: Your system is running Darwin...

User: What is 42 times 17?
🔧 GPT decided to use tools...
  → Calling calculate with a=42, b=17, operation=multiply
Assistant: 42 × 17 = 714

User: Can you greet me? My name is Sanchay
🔧 GPT decided to use tools...
  → Calling greet_user with name=Sanchay
Assistant: Hello, Sanchay! Welcome to MCP Apps...

User: What is the capital of France?
Assistant: The capital of France is Paris.
(No tool needed for this)
```

## Inspecting the MCP Protocol (Optional Deep Dive)

Want to see **everything** happening at the protocol level? Use the MCP Inspector!

### Option A: Using MCP Inspector GUI

The MCP Inspector is a web-based tool that lets you interactively explore your MCP server.

**1. Install MCP Inspector:**
```bash
# Install globally via npx (no permanent installation needed)
npx @modelcontextprotocol/inspector python server_copy.py
```

**2. Open the Inspector:**
- A browser window will open automatically at `http://localhost:5173`
- You'll see a web interface showing your MCP server

**3. Explore the Protocol:**

In the Inspector UI, you can see:

- **Server Info Tab:**
  - Server name: `TrivialServer`
  - Protocol version: `2024-11-05`
  - Server capabilities

- **Tools Tab:**
  - All available tools with full schemas
  - Input parameter types and descriptions
  - Click on any tool to see its complete JSON schema

- **Resources Tab:** (if your server exposes resources)

- **Prompts Tab:** (if your server defines prompts)

**4. Test Tools Interactively:**
```
1. Click on "Tools" in the left sidebar
2. Select "check_system_health"
3. Click "Run Tool" button
4. See the raw JSON request and response
```

**Example of what you'll see:**

```json
// Request (what the client sends)
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "check_system_health",
    "arguments": {}
  },
  "id": 1
}

// Response (what the server returns)
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "System Health Report:\n- OS: Darwin 25.3.0\n..."
      }
    ]
  },
  "id": 1
}
```

### Option B: Using MCP Inspector CLI

For a command-line inspection (good for logging/debugging):

**1. Install the inspector as a package:**
```bash
npm install -g @modelcontextprotocol/inspector
```

**2. Run with verbose output:**
```bash
mcp-inspector python server_copy.py --verbose
```

This shows all JSON-RPC messages in your terminal as they flow.

### Option C: Add Debug Logging to client.py

Want to see the protocol messages during the Azure GPT test? Add this to `client.py`:

**Edit client.py and add logging:**

```python
import logging

# Add this after imports
logging.basicConfig(level=logging.DEBUG)
```

Then run `python client.py` - you'll see all MCP protocol messages in the output.

### What You Can Inspect

Using any of the above methods, you can see:

**1. Server Initialization:**
```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "azure-gpt-mcp-client",
      "version": "1.0.0"
    }
  }
}
```

**2. Tool Discovery (list_tools):**
```json
{
  "method": "tools/list",
  "result": {
    "tools": [
      {
        "name": "check_system_health",
        "description": "Returns the current system health...",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    ]
  }
}
```

**3. Tool Execution (tools/call):**
```json
{
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

**4. Tool Response:**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "42 × 17 = 714"
      }
    ]
  }
}
```

### Understanding the MCP Protocol Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. INITIALIZE                                       │
│    Client → Server: "initialize" with capabilities  │
│    Server → Client: Server info + capabilities      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. DISCOVER TOOLS                                   │
│    Client → Server: "tools/list"                    │
│    Server → Client: Array of tool schemas           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. CALL TOOL (when needed)                          │
│    Client → Server: "tools/call" with arguments     │
│    Server → Client: Tool result content             │
└─────────────────────────────────────────────────────┘
```

### Quick Inspector Demo

```bash
# Terminal 1: Start inspector
npx @modelcontextprotocol/inspector python server_copy.py

# Browser opens at localhost:5173
# Click "Tools" → "calculate"
# Fill in: a=10, b=5, operation="add"
# Click "Run Tool"
# See: Request JSON → Response JSON

# Now you understand the exact protocol messages!
```

### Why This Matters for Day 3 Presentation

Showing the Inspector to leadership demonstrates:
- ✓ **Transparency**: Every tool call is inspectable
- ✓ **Standardization**: JSON-RPC 2.0 protocol (industry standard)
- ✓ **Debugging**: Easy to troubleshoot integration issues
- ✓ **Contract Clarity**: Tool schemas are self-documenting

---

## Troubleshooting

### Error: Missing environment variables
- Make sure you copied config.env.example to config.env
- Fill in all 4 required values

### Error: Connection failed
- Check your Azure endpoint URL (should end with .openai.azure.com/)
- Verify API key is correct
- Ensure deployment name matches Azure Portal

### Error: Tool not found
- The MCP server might not be starting correctly
- Try running `python server_copy.py` directly first

### Error: Rate limit
- Azure GPT has rate limits - wait a minute and retry

## What This Proves

✓ MCP works with Azure GPT (model-agnostic architecture)
✓ GPT can discover tools automatically (no hardcoding)
✓ Full tool call lifecycle works (query → decision → execution → response)
✓ Same functionality as Claude Desktop demo, but with production GPT

## Next Steps

Once this works, you've validated:
- Day 1 Block 2: MCP server with tools ✓
- Day 1 Block 3: Host connection (GPT instead of Claude) ✓  
- Model agnosticism: Same server works with different LLMs ✓

You can now proceed with Day 2 (enterprise tools + Generative UI).
