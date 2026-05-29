#!/bin/bash
# Test script for Enterprise MCP Server

echo "=========================================="
echo "Testing Enterprise MCP Server"
echo "=========================================="
echo ""

echo "1. Testing Knowledge Graph Tool standalone..."
python3 tools/knowledge_graph.py
echo ""

echo "=========================================="
echo "2. To test with MCP Inspector, run:"
echo "   npx @modelcontextprotocol/inspector python3 mcp_server_enterprise.py"
echo ""
echo "3. To test with Azure GPT client, run from prodcheckgpt:"
echo "   Update client.py to use: server_path = '../server/mcp_server_enterprise.py'"
echo "=========================================="
