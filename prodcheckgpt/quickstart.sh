#!/bin/bash
# Quick Start Script for Azure GPT + MCP Testing

echo "=========================================="
echo "Azure GPT + MCP Server Quick Start"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [[ ! -f "client.py" ]]; then
    echo "❌ Error: Please run this from the prodcheckgpt folder"
    echo "   cd /Users/sanchaychauhan/Downloads/KPMG/POC_MCP_APPS/prodcheckgpt"
    exit 1
fi

# Step 1: Create virtual environment if it doesn't exist
if [[ ! -d "venv" ]]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo ""
fi

# Step 2: Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Step 3: Install dependencies
echo "📚 Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Step 4: Check for config file
if [[ ! -f "config.env" ]]; then
    echo "⚠️  config.env not found!"
    echo ""
    echo "Creating config.env from template..."
    cp config.env.example config.env
    echo "✓ config.env created"
    echo ""
    echo "📝 NEXT STEP: Edit config.env with your Azure credentials"
    echo ""
    echo "   Open config.env and fill in:"
    echo "   - AZURE_OPENAI_ENDPOINT"
    echo "   - AZURE_OPENAI_API_KEY"
    echo "   - AZURE_OPENAI_DEPLOYMENT"
    echo ""
    echo "   Then run: ./quickstart.sh again"
    echo ""
    exit 0
fi

# Step 5: Verify config has values
if grep -q "your-endpoint-here" config.env; then
    echo "⚠️  config.env still has placeholder values!"
    echo ""
    echo "Please edit config.env with your actual Azure credentials:"
    echo "   nano config.env"
    echo ""
    echo "Then run: ./quickstart.sh again"
    echo ""
    exit 0
fi

# Step 6: Run the test
echo "🚀 Starting Azure GPT + MCP test..."
echo ""
python client.py

echo ""
echo "=========================================="
echo "Test completed!"
echo "=========================================="
