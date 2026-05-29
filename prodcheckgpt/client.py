"""
Azure OpenAI GPT Client with MCP Server Integration

This client connects to an MCP server and uses Azure GPT models to interpret
user queries and decide when to call MCP tools.
"""

import os
import asyncio
import json
from typing import Any, Dict, List
from dotenv import load_dotenv
from openai import AzureOpenAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Load environment variables
load_dotenv("config.env")


class AzureGPTMCPClient:
    """Client that connects Azure GPT to an MCP server"""

    def __init__(self):
        # Initialize Azure OpenAI client
        self.azure_client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")

        # MCP session will be initialized when connecting
        self.mcp_session: ClientSession | None = None
        self.available_tools: List[Dict[str, Any]] = []

    async def connect_to_mcp_server(self, server_script_path: str):
        """Connect to the MCP server and retrieve available tools"""

        # Set up server parameters (stdio transport)
        server_params = StdioServerParameters(
            command="python",
            args=[server_script_path],
            env=None
        )

        # Connect to server
        stdio_transport = await stdio_client(server_params)
        self.stdio, self.write = stdio_transport
        self.mcp_session = ClientSession(self.stdio, self.write)

        # Initialize the session
        await self.mcp_session.initialize()

        # List available tools
        response = await self.mcp_session.list_tools()

        # Convert MCP tools to OpenAI function format
        self.available_tools = []
        for tool in response.tools:
            openai_tool = {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": tool.inputSchema
                }
            }
            self.available_tools.append(openai_tool)

        print(f"✓ Connected to MCP server")
        print(f"✓ Available tools: {[t['function']['name'] for t in self.available_tools]}\n")

    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Call an MCP tool and return the result"""

        if not self.mcp_session:
            return "Error: Not connected to MCP server"

        try:
            result = await self.mcp_session.call_tool(tool_name, arguments)
            # MCP returns a list of content items
            if result.content:
                return "\n".join([item.text for item in result.content if hasattr(item, 'text')])
            return "Tool executed but returned no content"
        except Exception as e:
            return f"Error calling tool: {str(e)}"

    async def chat(self, user_message: str) -> str:
        """Send a message to Azure GPT and handle tool calls if needed"""

        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant with access to system tools via the Model Context Protocol (MCP). Use the available tools when appropriate to answer user questions."
            },
            {
                "role": "user",
                "content": user_message
            }
        ]

        print(f"User: {user_message}\n")

        # Initial API call
        response = self.azure_client.chat.completions.create(
            model=self.deployment,
            messages=messages,
            tools=self.available_tools if self.available_tools else None,
            tool_choice="auto"
        )

        response_message = response.choices[0].message

        # Handle tool calls if any
        if response_message.tool_calls:
            print(f"🔧 GPT decided to use tools...\n")

            # Add assistant's response to messages
            messages.append(response_message)

            # Execute each tool call
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                print(f"  → Calling MCP tool: {function_name}")
                print(f"    Arguments: {function_args}")

                # Call the MCP tool
                tool_result = await self.call_mcp_tool(function_name, function_args)

                print(f"    Result: {tool_result}\n")

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": tool_result
                })

            # Get final response from GPT with tool results
            final_response = self.azure_client.chat.completions.create(
                model=self.deployment,
                messages=messages
            )

            final_message = final_response.choices[0].message.content
            print(f"Assistant: {final_message}\n")
            return final_message

        else:
            # No tool calls, just return the response
            content = response_message.content
            print(f"Assistant: {content}\n")
            return content

    async def close(self):
        """Close the MCP session"""
        if self.mcp_session:
            await self.mcp_session.__aexit__(None, None, None)
        if hasattr(self, 'stdio'):
            await self.stdio.__aexit__(None, None, None)


async def main():
    """Main test function"""

    print("=" * 60)
    print("Azure GPT + MCP Server Test")
    print("=" * 60 + "\n")

    # Check environment variables
    required_vars = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_DEPLOYMENT"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print(f"Please copy config.env.example to config.env and fill in your Azure credentials.\n")
        return

    # Initialize client
    client = AzureGPTMCPClient()

    try:
        # Connect to MCP server
        server_path = os.path.join(os.path.dirname(__file__), "server_copy.py")
        await client.connect_to_mcp_server(server_path)

        # Test queries
        print("🧪 Running test queries...\n")
        print("-" * 60 + "\n")

        # Test 1: System health check
        await client.chat("What's the health of my system?")

        print("-" * 60 + "\n")

        # Test 2: Calculator
        await client.chat("What is 42 times 17?")

        print("-" * 60 + "\n")

        # Test 3: Greeting
        await client.chat("Can you greet me? My name is Sanchay")

        print("-" * 60 + "\n")

        # Test 4: No tool needed
        await client.chat("What is the capital of France?")

        print("=" * 60)
        print("✓ All tests completed!")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
