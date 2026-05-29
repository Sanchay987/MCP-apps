#!/bin/bash

echo "=========================================="
echo "Starting MCP Apps - Day 2 Block 3 Demo"
echo "=========================================="
echo ""

# Activate virtual environment
echo "📦 Activating virtual environment..."
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found. Run 'python3 -m venv .venv' first."
    exit 1
fi

# Use venv Python
PYTHON=".venv/bin/python3"
echo "Using: $PYTHON"

# Check if frontend is ready
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start MCP server in background
echo "Starting MCP Server (SSE) on http://localhost:3001..."
$PYTHON server/mcp_server_web.py &
MCP_PID=$!

# Wait a bit for server to start
sleep 3

# Start frontend
echo "Starting Frontend on http://localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "✓ Services Started"
echo "=========================================="
echo ""
echo "MCP Server: http://localhost:3001/sse"
echo "Frontend:   http://localhost:3000"
echo "Chat Page:  http://localhost:3000/chat"
echo "Test Page:  http://localhost:3000/test-graph"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="
echo ""

# Wait for Ctrl+C
wait

# Cleanup
kill $MCP_PID $FRONTEND_PID 2>/dev/null
