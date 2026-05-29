#!/bin/bash

echo "=========================================="
echo "Starting MCP Apps Frontend Test Server"
echo "=========================================="
echo ""

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting development server..."
echo ""
echo "Once started, open:"
echo "  http://localhost:3000/test-graph"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
