"""
MCP Server - Copy for Azure GPT Testing
Same tools as root/server.py but isolated for testing
"""

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
    cpu_count = psutil.cpu_count()
    cpu_percent = psutil.cpu_percent(interval=1)

    return f"""System Health Report:
- OS: {platform.system()} {platform.release()}
- CPU: {cpu_count} cores, {cpu_percent}% usage
- Memory: {mem.percent}% used ({mem.used / (1024**3):.2f}GB / {mem.total / (1024**3):.2f}GB)
- Available Memory: {mem.available / (1024**3):.2f}GB"""

# Tool 2: Basic Calculator
@mcp.tool()
def calculate(a: float, b: float, operation: str) -> str:
    """Performs basic math operations: add, subtract, multiply, divide.

    Args:
        a: First number
        b: Second number
        operation: One of 'add', 'subtract', 'multiply', 'divide'
    """
    if operation == "add":
        return f"{a} + {b} = {a + b}"
    if operation == "subtract":
        return f"{a} - {b} = {a - b}"
    if operation == "multiply":
        return f"{a} × {b} = {a * b}"
    if operation == "divide":
        if b != 0:
            return f"{a} ÷ {b} = {a / b}"
        else:
            return "Error: Cannot divide by zero"
    return f"Error: Unknown operation '{operation}'. Use: add, subtract, multiply, or divide"

# Tool 3: Greeting
@mcp.tool()
def greet_user(name: str) -> str:
    """Generates a friendly greeting for the given name.

    Args:
        name: The name of the person to greet
    """
    return f"Hello, {name}! Welcome to the MCP Apps demonstration. I'm powered by the Model Context Protocol!"

if __name__ == "__main__":
    # This starts the server using standard input/output (stdio)
    mcp.run()
