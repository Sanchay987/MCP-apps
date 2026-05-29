# prodcheckgpt - Complete Documentation Index

Testing MCP servers with Azure GPT and inspecting the protocol.

---

## Quick Navigation

| What do you want to do? | Read this |
|-------------------------|-----------|
| **Get started quickly** | [Quick Start](#quick-start-options) below |
| **Run Azure GPT test** | [execution.md](execution.md) |
| **Inspect MCP protocol** | [inspector_guide.md](inspector_guide.md) |
| **Understand protocol messages** | [protocol_cheatsheet.md](protocol_cheatsheet.md) |
| **Overview** | [README.md](README.md) |

---

## Quick Start Options

### Option 1: Automated Setup
```bash
cd /Users/sanchaychauhan/Downloads/KPMG/POC_MCP_APPS/prodcheckgpt
./quickstart.sh
```

### Option 2: Inspect Protocol (No Azure needed)
```bash
npx @modelcontextprotocol/inspector python server_copy.py
# Opens browser at localhost:5173
```

### Option 3: Manual Setup
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp config.env.example config.env
# Edit config.env with Azure credentials
python client.py
```

---

## File Guide

### Core Files

**server_copy.py** (1.9 KB)
- MCP server with 3 tools (health check, calculator, greeting)
- Copy of root `server.py` for isolated testing
- Uses FastMCP Python SDK

**client.py** (7.3 KB)
- Azure OpenAI GPT client
- Connects to MCP server via stdio transport
- Runs 4 test queries automatically
- Shows tool selection and execution flow

**config.env.example** (503 B)
- Template for Azure OpenAI credentials
- Copy to `config.env` and fill in your values
- Required: endpoint, API key, deployment name

**requirements.txt** (421 B)
- Python dependencies
- Includes: openai, mcp, python-dotenv, psutil
- Optional: MCP Inspector (npm package)

### Automation

**quickstart.sh** (2.1 KB)
- Automated setup and run script
- Creates venv, installs deps, checks config
- Guides you through missing credentials
- Executable: `./quickstart.sh`

### Documentation

**README.md** (1.2 KB)
- Project overview
- Quick start commands
- File listing

**execution.md** (8.6 KB)
- Complete step-by-step guide
- Azure GPT testing instructions
- MCP Inspector usage
- Troubleshooting section
- Expected output examples

**inspector_guide.md** (10 KB)
- Deep dive on MCP Inspector tool
- Protocol message inspection
- UI walkthrough
- CLI usage
- Logging configuration
- Use cases for demos and debugging

**protocol_cheatsheet.md** (8.8 KB)
- Quick reference for all MCP messages
- Request/response examples
- JSON-RPC format
- Error codes
- Tool schema format
- Print-friendly reference

**INDEX.md** (this file)
- Navigation guide
- File descriptions
- Quick links

---

## What Each Document Teaches You

### execution.md
**Audience:** Developers setting up the test  
**Goal:** Get Azure GPT + MCP running  
**Covers:**
- Environment setup
- Azure credential configuration
- Running the test
- Using MCP Inspector (overview)
- Troubleshooting

### inspector_guide.md
**Audience:** Developers wanting protocol-level visibility  
**Goal:** Understand MCP at the message level  
**Covers:**
- Installing and running Inspector
- UI walkthrough (tabs, features)
- Protocol message examples
- CLI inspection with logging
- Integration with client.py
- Demo preparation tips

### protocol_cheatsheet.md
**Audience:** Anyone needing quick protocol reference  
**Goal:** Look up MCP message formats  
**Covers:**
- All 10 core message types with examples
- JSON-RPC structure
- Error codes
- Tool schema format
- Content types
- Method reference table

---

## Learning Path

### Beginner (Never used MCP before)
1. Read **README.md** (5 min)
2. Run `./quickstart.sh` (10 min)
3. Review output, see tools being called (5 min)
4. **Done!** You've seen MCP in action.

### Intermediate (Want to understand how it works)
1. Run **quickstart.sh** first (verify it works)
2. Read **execution.md** sections 1-4 (15 min)
3. Run Inspector: `npx @modelcontextprotocol/inspector python server_copy.py`
4. Explore UI, test each tool manually (10 min)
5. Read **protocol_cheatsheet.md** while using Inspector (15 min)
6. **Done!** You understand the protocol lifecycle.

### Advanced (Building demos or debugging)
1. Complete Intermediate path first
2. Read full **inspector_guide.md** (20 min)
3. Add logging to client.py (5 min)
4. Run client.py and Inspector simultaneously (watch both) (10 min)
5. Take screenshots for Day 3 presentation (10 min)
6. Read **protocol_cheatsheet.md** error handling section
7. **Done!** You can debug any MCP integration and demo it to leadership.

---

## Common Workflows

### "I want to test Azure GPT integration"
```bash
./quickstart.sh
# Follow prompts
```
**Read:** execution.md sections 1-4

### "I want to see the protocol messages"
```bash
npx @modelcontextprotocol/inspector python server_copy.py
```
**Read:** inspector_guide.md, protocol_cheatsheet.md

### "I want to understand what MCP is"
**Read:** 
1. README.md
2. protocol_cheatsheet.md (Protocol Lifecycle section)
3. Run Inspector and click through tabs

### "I'm debugging a connection issue"
**Do:**
1. Run `python server_copy.py` alone (test server)
2. Check `config.env` has correct values
3. Add `logging.basicConfig(level=logging.DEBUG)` to client.py
4. Run Inspector to verify server works independently

**Read:** execution.md Troubleshooting section

### "I'm preparing the Day 3 demo"
**Do:**
1. Run client.py (record the output)
2. Run Inspector (take screenshots of each tab)
3. Test both tools work with GPT and with Inspector
4. Prepare side-by-side comparison

**Read:** inspector_guide.md "Why This Matters for Day 3"

---

## Protocol Message Flow Reference

Quick visual for presentations:

```
User Query: "What is 42 times 17?"
    ↓
Azure GPT receives query
    ↓
Azure GPT sees available tools (from MCP tools/list)
    ↓
Azure GPT decides: use calculate(a=42, b=17, operation="multiply")
    ↓
client.py sends MCP tools/call request
    ↓
server_copy.py executes tool function
    ↓
server_copy.py returns: "42 × 17 = 714"
    ↓
Azure GPT incorporates result
    ↓
User sees: "The result is 714"
```

**See:** protocol_cheatsheet.md for exact JSON messages

---

## Dependencies Overview

### Python (via requirements.txt)
- `openai>=1.54.0` - Azure OpenAI SDK
- `mcp>=1.27.1` - Model Context Protocol SDK
- `python-dotenv>=1.0.0` - Environment variable loader
- `psutil>=7.2.2` - System monitoring (for health check tool)
- `anyio>=4.13.0` - Async I/O support
- `pydantic>=2.13.4` - Data validation

### Node.js (optional, for Inspector)
- `@modelcontextprotocol/inspector` - MCP protocol inspector
- Install with: `npx @modelcontextprotocol/inspector` (no permanent install)
- Or globally: `npm install -g @modelcontextprotocol/inspector`

---

## Testing Checklist

Before Day 3 demo, verify:

- [ ] `./quickstart.sh` runs successfully
- [ ] All 4 test queries complete in client.py
- [ ] Inspector opens and shows 3 tools
- [ ] Each tool can be tested manually in Inspector
- [ ] Screenshots captured of Inspector UI
- [ ] Video recorded of client.py output
- [ ] config.env is .gitignored (don't commit API keys!)
- [ ] Root folder untouched (server.py, plan.md still pristine)

---

## Key Concepts Explained

### What is MCP?
Model Context Protocol - a standard way for LLMs to discover and call external tools.

### What is stdio transport?
Communication via standard input/output (like piping commands in terminal).

### What is JSON-RPC 2.0?
Industry-standard protocol for remote procedure calls using JSON.

### What is FastMCP?
High-level Python SDK that makes building MCP servers easy (decorator-based).

### What is the Inspector?
Web-based debugging tool to see all MCP protocol messages.

### Why Azure GPT?
Proves MCP is model-agnostic - same server works with GPT, Claude, Gemini, etc.

---

## Troubleshooting Index

| Problem | Solution Location |
|---------|------------------|
| Missing Azure credentials | execution.md → Step 3 |
| Connection errors | execution.md → Troubleshooting |
| Inspector won't start | inspector_guide.md → Troubleshooting |
| Protocol errors | protocol_cheatsheet.md → Error Codes |
| Server crashes | execution.md → Troubleshooting |
| Port conflicts | inspector_guide.md → Custom port flag |

---

## Related Root Files

These files in the parent directory are related:

- `../server.py` - Original MCP server (server_copy.py is a copy)
- `../plan.md` - 3-day execution plan (this is Day 1 testing)
- `../requirements.txt` - Root dependencies
- `../pyproject.toml` - Root project config

**This folder is isolated** - changes here don't affect root.

---

## Next Steps After Testing

Once you've successfully run both client.py and Inspector:

1. ✓ You've validated Day 1 Block 2 (MCP server works)
2. ✓ You've validated Day 1 Block 3 (Host connection with Azure GPT)
3. ✓ You've proven model agnosticism (GPT works, not just Claude)

**Move to Day 2:**
- Build enterprise tools (Knowledge Graph, Financial Data, etc.)
- Define Generative UI contracts
- Implement SSE transport for web clients

See `../plan.md` for Day 2 details.

---

## Questions?

**"Which file should I read first?"**  
README.md → execution.md → Try it → inspector_guide.md

**"How do I run everything?"**  
`./quickstart.sh` for Azure GPT test  
`npx @modelcontextprotocol/inspector python server_copy.py` for Inspector

**"Where are the protocol messages defined?"**  
protocol_cheatsheet.md has all examples

**"How do I debug issues?"**  
execution.md Troubleshooting + inspector_guide.md Troubleshooting

**"What do I show leadership?"**  
Run client.py (Azure GPT integration) + Inspector (protocol transparency)

---

*Last updated: 2026-05-18*  
*Part of: MCP Apps POC - Day 1 Testing*
