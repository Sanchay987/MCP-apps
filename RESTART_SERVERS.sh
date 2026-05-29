#!/bin/bash

echo "🛑 Stopping existing servers..."

# Kill existing processes
pkill -f "mcp_server_web.py"
pkill -f "next dev"
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

sleep 2

echo "✅ Stopped all services"
echo ""
echo "🚀 Starting fresh..."
echo ""

# Start with the updated script
./START_DAY2_BLOCK3.sh
