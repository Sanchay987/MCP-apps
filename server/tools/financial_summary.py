"""
Financial Summary Tool - Second Enterprise Tool for MCP

This tool demonstrates the Generative UI pattern with a different
data structure and visualization (dashboard cards vs. graph network).

This proves the pattern is generalizable, not a one-off.
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timezone


class FinancialSummaryTool:
    """Enterprise financial summary and dashboard tool"""

    def __init__(self, data_file: str = None):
        """Initialize with mock data file"""
        if data_file is None:
            # Default to mock_data folder
            current_dir = Path(__file__).parent.parent
            data_file = current_dir / "mock_data" / "financial_data.json"

        self.data_file = Path(data_file)
        self._load_data()

    def _load_data(self):
        """Load mock financial data"""
        try:
            with open(self.data_file, 'r') as f:
                self.financial_data = json.load(f)
        except FileNotFoundError:
            # Fallback to empty data
            self.financial_data = {}
            print(f"Warning: Data file {self.data_file} not found")

    def query(self, report_type: str) -> Dict[str, Any]:
        """
        Query financial data for a specific report type.

        Args:
            report_type: The report to query (e.g., "kpmg_quarterly_summary",
                        "client_engagement_summary", "tax_compliance_dashboard")

        Returns:
            Dictionary with financial data and metadata
        """
        # Normalize report type (lowercase, replace spaces with underscores)
        report_key = report_type.lower().replace(" ", "_").replace("-", "_")

        # Check if exact match exists
        if report_key in self.financial_data:
            result = self.financial_data[report_key].copy()
            result["query"] = report_type
            result["timestamp"] = datetime.now(timezone.utc).isoformat()
            return result

        # Check for partial matches
        for key in self.financial_data.keys():
            if report_key in key or key in report_key:
                result = self.financial_data[key].copy()
                result["query"] = report_type
                result["timestamp"] = datetime.now(timezone.utc).isoformat()
                result["metadata"]["match_type"] = "partial"
                return result

        # No match found - return available reports
        return {
            "error": "Report not found",
            "query": report_type,
            "available_reports": list(self.financial_data.keys()),
            "suggestion": f"Try one of: {', '.join(self.financial_data.keys())}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_available_reports(self) -> List[str]:
        """Get list of all available reports"""
        return list(self.financial_data.keys())

    def get_report_summary(self, report_type: str) -> Dict[str, Any]:
        """Get summary statistics for a report"""
        result = self.query(report_type)

        if "error" in result:
            return result

        return {
            "report_type": result["metadata"]["report_type"],
            "period": result["period"],
            "client": result["client"],
            "total_revenue": result["summary"]["total_revenue"],
            "net_income": result["summary"]["net_income"],
            "profit_margin": result["summary"]["profit_margin"],
            "service_count": len(result["revenue_by_service"]),
            "metric_count": len(result["key_metrics"])
        }


# Singleton instance for use in MCP server
_financial_tool = None


def get_financial_summary_tool() -> FinancialSummaryTool:
    """Get or create singleton instance"""
    global _financial_tool
    if _financial_tool is None:
        _financial_tool = FinancialSummaryTool()
    return _financial_tool


def query_financial_summary(report_type: str) -> str:
    """
    MCP tool function: Query enterprise financial data.

    This function is designed to be registered as an MCP tool.
    It returns structured JSON that can be rendered as an interactive
    dashboard with cards, charts, and metrics (Generative UI).

    Args:
        report_type: Report to query. Available reports:
                    - "kpmg_quarterly_summary" - KPMG global quarterly results
                    - "client_engagement_summary" - Specific client engagement
                    - "tax_compliance_dashboard" - Tax compliance metrics

    Returns:
        JSON string with financial dashboard structure
    """
    tool = get_financial_summary_tool()
    result = tool.query(report_type)

    # Return as formatted JSON string
    return json.dumps(result, indent=2)


def list_financial_reports() -> str:
    """
    MCP tool function: List all available financial reports.

    Returns:
        JSON string with list of available reports
    """
    tool = get_financial_summary_tool()
    reports = tool.get_available_reports()

    return json.dumps({
        "available_reports": reports,
        "count": len(reports),
        "description": "Financial reports and dashboards available in the system"
    }, indent=2)


def get_financial_report_summary(report_type: str) -> str:
    """
    MCP tool function: Get summary of a financial report.

    Args:
        report_type: Report to summarize

    Returns:
        JSON string with summary statistics
    """
    tool = get_financial_summary_tool()
    summary = tool.get_report_summary(report_type)

    return json.dumps(summary, indent=2)


if __name__ == "__main__":
    # Test the tool
    print("=== Financial Summary Tool Test ===\n")

    tool = FinancialSummaryTool()

    # Test 1: Query existing report
    print("Test 1: Query 'kpmg_quarterly_summary'")
    result = tool.query("kpmg_quarterly_summary")
    print(f"Revenue: ${result['summary']['total_revenue']:,}")
    print(f"Net Income: ${result['summary']['net_income']:,}")
    print(f"Profit Margin: {result['summary']['profit_margin']}%\n")

    # Test 2: List reports
    print("Test 2: Available reports")
    print(tool.get_available_reports())
    print()

    # Test 3: Get summary
    print("Test 3: Report summary")
    summary = tool.get_report_summary("client_engagement_summary")
    print(json.dumps(summary, indent=2))
    print()

    # Test 4: Query non-existent report
    print("Test 4: Query non-existent report")
    result = tool.query("invalid_report")
    print(json.dumps(result, indent=2))
