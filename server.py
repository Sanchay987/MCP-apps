from mcp.server.fastmcp import FastMCP
import platform
import psutil

# Initialize the MCP Server
mcp = FastMCP("TrivialServer")

# Tool 1: System Health Check
@mcp.tool()
def check_system_health() -> str:
    """Returns the current system health, including OS and memory usage."""
    mem = psutil.virtual_memory()
    return f"OS: {platform.system()} {platform.release()}, Memory Used: {mem.percent}%"

# Tool 2: Basic Calculator
@mcp.tool()
def calculate(a: float, b: float, operation: str) -> str:
    """Performs basic math operations: add, subtract, multiply, divide."""
    if operation == "add": return str(a + b)
    if operation == "subtract": return str(a - b)
    if operation == "multiply": return str(a * b)
    if operation == "divide": return str(a / b) if b != 0 else "Cannot divide by zero"
    return "Unknown operation"

if __name__ == "__main__":
    # This starts the server using standard input/output (stdio)
    mcp.run()