# Azure GPT + MCP Server Testing

This folder contains everything needed to test our MCP server with Azure OpenAI GPT models instead of Claude Desktop.

## Purpose
- Test Day 1 MCP server functionality using production Azure GPT models
- Verify MCP protocol works with non-Claude LLMs
- Inspect and understand the MCP protocol at the message level
- Isolated environment - doesn't affect root project files

## Quick Start

**Option 1 - Run with Azure GPT:**
```bash
./quickstart.sh
# Follow prompts to configure Azure credentials
```

**Option 2 - Inspect the Protocol:**
```bash
npx @modelcontextprotocol/inspector python server_copy.py
# Opens browser at localhost:5173 to explore MCP messages
```

See `execution.md` for detailed steps and `inspector_guide.md` for protocol inspection.

## What's Inside
- `client.py` - Azure GPT client that connects to our MCP server
- `server_copy.py` - Copy of the MCP server (same tools as root)
- `config.env.example` - Template for Azure credentials
- `requirements.txt` - Dependencies for this test
- `execution.md` - Step-by-step execution guide (includes Inspector usage)
- `inspector_guide.md` - Deep dive on inspecting the MCP protocol
- `quickstart.sh` - Automated setup and run script
