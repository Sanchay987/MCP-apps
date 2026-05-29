"""
Enterprise MCP Server with SSE Transport (Working Version)

Uses FastMCP's sse_app for web client connections.
"""

from mcp.server.fastmcp import FastMCP
import platform
import psutil
import sys
from pathlib import Path

# Add tools directory to path
server_dir = Path(__file__).parent
sys.path.insert(0, str(server_dir))

from tools.knowledge_graph import query_knowledge_graph, list_knowledge_topics, get_knowledge_summary
from tools.financial_summary import query_financial_summary, list_financial_reports, get_financial_report_summary
from tools.gremlin_cosmos import query_regulatory_policy_graph, list_policy_categories, search_policies_by_term
from tools.risk_wizard import (
    risk_wizard_step1_pick_client as _wiz_step1,
    risk_wizard_step2_engagement_type as _wiz_step2,
    risk_wizard_step3_risk_factors as _wiz_step3,
    risk_wizard_step4_assessment as _wiz_step4,
    risk_wizard_finalize as _wiz_finalize,
)

# Initialize the MCP Server
mcp = FastMCP("EnterpriseKPMGServer")

# ============================================================================
# TOOLS - Basic functionality
# ============================================================================

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


@mcp.tool()
def greet_user(name: str) -> str:
    """Generates a friendly greeting for the given name.

    Args:
        name: The name of the person to greet
    """
    return f"Hello, {name}! Welcome to the MCP Apps demonstration. I'm powered by the Model Context Protocol!"


# ============================================================================
# TOOLS - Enterprise Knowledge Graph (for Generative UI)
# ============================================================================

@mcp.tool()
def query_enterprise_knowledge_graph(topic: str) -> str:
    """Query MOCK enterprise knowledge graph (DEMO DATA ONLY - not live).

    USE THIS TOOL FOR: Cloud security, audit methodology, tax compliance
    DEMO examples. This is MOCK/SAMPLE data for demonstration purposes.

    DO NOT USE FOR: Regulatory policies, compliance documents, business rules,
    obligations (use query_live_regulatory_graph for those - that's LIVE data).

    This returns MOCK structured graph data for demonstration purposes only.

    Args:
        topic: Topic to query. Available MOCK topics:
               - "cloud security" - Cloud infrastructure security engagement (MOCK)
               - "audit methodology" - Audit process and standards (MOCK)
               - "tax compliance" - Transfer pricing and tax advisory (MOCK)

    Returns:
        JSON string with MOCK graph structure for demonstration
    """
    return query_knowledge_graph(topic)


@mcp.tool()
def list_available_knowledge_topics() -> str:
    """List all available topics in the enterprise knowledge graph.

    Use this to discover what topics can be queried via query_enterprise_knowledge_graph.

    Returns:
        JSON string with list of available topics
    """
    return list_knowledge_topics()


@mcp.tool()
def summarize_knowledge_topic(topic: str) -> str:
    """Get a summary of a knowledge graph topic (metadata only, not full graph).

    Useful for quick overview without loading the full graph visualization.

    Args:
        topic: Topic to summarize

    Returns:
        JSON string with summary statistics (node count, edge count, types)
    """
    return get_knowledge_summary(topic)


# ============================================================================
# TOOLS - FINANCIAL DASHBOARD (Second Generative UI Example)
# ============================================================================

@mcp.tool()
def query_financial_dashboard(report_type: str) -> str:
    """Query financial data and return a dashboard-ready summary.

    This tool returns structured financial data (revenue, metrics, alerts) that
    can be rendered as an interactive dashboard in the frontend.

    IMPORTANT: The response is structured JSON, NOT plain text. The frontend
    should detect this structure and render it as a visual dashboard component
    with cards, charts, and metrics.

    This is the SECOND Generative UI tool, demonstrating the pattern works
    for different data types (not just graphs).

    Args:
        report_type: Report to query. Available reports:
                    - "kpmg_quarterly_summary" - KPMG global quarterly results
                    - "client_engagement_summary" - TechCorp engagement metrics
                    - "tax_compliance_dashboard" - Tax compliance dashboard

    Returns:
        JSON string with structure:
        {
          "period": str,
          "client": str,
          "summary": {"total_revenue": int, "net_income": int, ...},
          "revenue_by_service": [{service, revenue, percentage, trend}],
          "key_metrics": [{metric, value, unit, change, status}],
          "regional_performance": [{region, revenue, percentage, growth}],
          "alerts": [{type, message, priority}],
          "metadata": {...}
        }
    """
    return query_financial_summary(report_type)


@mcp.tool()
def list_available_financial_reports() -> str:
    """List all available financial reports in the system.

    Use this to discover what reports can be queried via query_financial_dashboard.

    Returns:
        JSON string with list of available reports
    """
    return list_financial_reports()


@mcp.tool()
def summarize_financial_report(report_type: str) -> str:
    """Get a summary of a financial report (metadata only, not full dashboard).

    Useful for quick overview without loading the full dashboard visualization.

    Args:
        report_type: Report to summarize

    Returns:
        JSON string with summary statistics (revenue, income, margins)
    """
    return get_financial_report_summary(report_type)


# ============================================================================
# TOOLS - REGULATORY/POLICY GRAPH (Third Generative UI - Live Gremlin)
# ============================================================================

@mcp.tool()
def cosmosdb_query_regulatory_policies(label: str) -> str:
    """Query LIVE regulatory policies from Azure CosmosDB Gremlin database.

    USE THIS TOOL FOR: Live regulatory policy data, compliance documents,
    business rules, obligations, processes, controls from CosmosDB Gremlin API.

    DO NOT USE FOR: Cloud security, audit methodology, tax compliance (use
    query_enterprise_knowledge_graph for those - they are mock data examples).

    This fetches REAL-TIME regulatory policy data from Azure Cosmos DB using
    Gremlin graph queries. Returns regulatory policy documents covering
    anti-bribery, economic crime prevention, and related controls.

    Data source: Live Azure CosmosDB Gremlin API
    Data type: Regulatory policies, compliance documents, business rules

    Args:
        label: Query by vertex label or keyword:
               - "BusinessRules" - Top-level policy documents
               - "Obligations" - Compliance requirements
               - "Processes" - Operational procedures
               - "Controls" - Risk mitigation measures
               - Or search term (e.g., "Bribery", "Crime", "Compliance")

    Returns:
        JSON string with live graph data including document sources and metadata
    """
    return query_regulatory_policy_graph(label)


@mcp.tool()
def cosmosdb_list_policy_categories() -> str:
    """List LIVE regulatory policy categories from Azure CosmosDB Gremlin database.

    USE THIS TOOL WHEN: User asks about regulatory policy categories, policy types,
    what categories are in the regulatory database, or available policy classifications.

    Keywords: regulatory, policy, categories, compliance, BusinessRules, Obligations,
    Processes, Controls, CosmosDB, Gremlin, live database

    Returns LIVE vertex labels from Azure Cosmos DB Gremlin API:
    - BusinessRules
    - Obligations
    - Processes
    - Controls

    Data source: Live Azure CosmosDB Gremlin API

    Returns:
        JSON string with live category list from CosmosDB
    """
    return list_policy_categories()


@mcp.tool()
def cosmosdb_search_policies(search_term: str) -> str:
    """Search LIVE regulatory policies in Azure CosmosDB Gremlin database.

     USE THIS TOOL WHEN: User wants to search for specific regulatory policies,
    compliance documents, or policy keywords like "bribery", "crime", "GDPR", etc.

    Searches LIVE data across policy names, IDs, and attributes in CosmosDB Gremlin.

    Examples: "Search for bribery policies", "Find policies about economic crime",
    "Policies related to compliance"

    Data source: Live Azure CosmosDB Gremlin API

    Args:
        search_term: Keyword to search (e.g., "Bribery", "Crime", "GDPR", "Compliance")

    Returns:
        JSON string with matching live policy graph data
    """
    return search_policies_by_term(search_term)


# ============================================================================
# TOOLS - INTERACTIVE RISK ASSESSMENT WIZARD (Multi-step Generative UI)
# ============================================================================

@mcp.tool()
def start_risk_assessment() -> str:
    """Start the interactive Risk Assessment Wizard.

    Launches a 5-step interactive UI wizard in the chat:
    1. Pick a client
    2. Pick engagement type (Audit / Tax / Advisory)
    3. Select risk factors (multi-select form)
    4. Review computed risk rating + embedded knowledge graph
    5. Approve or escalate — terminal confirmation

    Returns an interactive envelope rendered as clickable UI cards.
    No arguments required.
    """
    return _wiz_step1()


@mcp.tool()
def risk_wizard_step2_engagement_type(client_id: str, session: dict) -> str:
    """Step 2 of the Risk Assessment Wizard — select engagement type.

    Args:
        client_id: Client identifier from step 1
        session: Wizard session state (passed through from previous step)
    """
    return _wiz_step2(client_id=client_id, session=session)


@mcp.tool()
def risk_wizard_step3_risk_factors(client_id: str, engagement: str, session: dict) -> str:
    """Step 3 of the Risk Assessment Wizard — identify risk factors.

    Args:
        client_id: Client identifier
        engagement: Engagement type from step 2
        session: Wizard session state
    """
    return _wiz_step3(client_id=client_id, engagement=engagement, session=session)


@mcp.tool()
def risk_wizard_step4_assessment(client_id: str, engagement: str, risk_factors: list, session: dict) -> str:
    """Step 4 of the Risk Assessment Wizard — compute risk rating.

    Args:
        client_id: Client identifier
        engagement: Engagement type
        risk_factors: List of selected risk factor IDs from step 3
        session: Wizard session state
    """
    return _wiz_step4(client_id=client_id, engagement=engagement, risk_factors=risk_factors, session=session)


@mcp.tool()
def risk_wizard_finalize(decision: str, session: dict) -> str:
    """Step 5 of the Risk Assessment Wizard — finalise and confirm.

    Args:
        decision: 'approved' or 'escalated'
        session: Wizard session state with full history
    """
    return _wiz_finalize(decision=decision, session=session)


if __name__ == "__main__":
    from starlette.middleware.cors import CORSMiddleware
    import uvicorn

    print("=" * 70)
    print("Enterprise KPMG MCP Server Starting (SSE Transport)")
    print("=" * 70)
    print("\nAvailable Tools:")
    print("  Basic:")
    print("    - check_system_health")
    print("    - calculate")
    print("    - greet_user")
    print("\n Enterprise Knowledge Graph - Generative UI #1:")
    print("    - query_enterprise_knowledge_graph")
    print("    - list_available_knowledge_topics")
    print("    - summarize_knowledge_topic")
    print("\n  Financial Dashboard - Generative UI #2:")
    print("    - query_financial_dashboard")
    print("    - list_available_financial_reports")
    print("    - summarize_financial_report")
    print("\n  CosmosDB Regulatory Policies - Generative UI #3 - LIVE GREMLIN:")
    print("    - cosmosdb_query_regulatory_policies")
    print("    - cosmosdb_list_policy_categories")
    print("    - cosmosdb_search_policies")
    print("\n  Interactive Wizard - Generative UI #4 - Multi-step:")
    print("    - start_risk_assessment")
    print("    - risk_wizard_step2_engagement_type")
    print("    - risk_wizard_step3_risk_factors")
    print("    - risk_wizard_step4_assessment")
    print("    - risk_wizard_finalize")
    print("\n" + "=" * 70)
    print("Server running on: http://localhost:3001")
    print("CORS enabled for: http://localhost:3000")
    print("Total Tools: 17 (3 basic + 6 enterprise + 3 live Gremlin + 5 wizard)")
    print("=" * 70 + "\n")

    # Get the SSE app from FastMCP
    app = mcp.sse_app()

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Run with uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
