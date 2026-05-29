"""
Risk Wizard tool — ONE tool, all 5 steps run inside the iframe.

The server returns a JSON payload with all the static data the wizard needs
(clients, engagement types, risk factors with weights). The risk_wizard.html
widget drives the entire 5-step flow in JS and posts the final assessment
back via postMessage when the user submits.

This is the key architectural difference from the old implementation which
chained 5 separate MCP tool calls. Here the server is called once; the
iframe owns the session state.
"""

from __future__ import annotations

import json
from mcp_apps import MCPAppsServer, UIResource

CLIENTS = [
    {"id": "techcorp",   "label": "TechCorp",   "description": "Audit engagement — FY26 Q2"},
    {"id": "acme",       "label": "Acme Ltd",   "description": "Tax advisory — FY26 Q1"},
    {"id": "globalbank", "label": "GlobalBank", "description": "Advisory — Risk & Controls Review"},
]

ENGAGEMENT_TYPES = [
    {"id": "audit",    "label": "Audit",    "description": "Annual statutory audit and internal controls review"},
    {"id": "tax",      "label": "Tax",      "description": "Transfer pricing, VAT, and corporate tax advisory"},
    {"id": "advisory", "label": "Advisory", "description": "Risk management, strategy, and transaction services"},
]

RISK_FACTORS = [
    {"id": "revenue_recognition",       "label": "Revenue recognition issues",       "weight": 3},
    {"id": "related_party",             "label": "Related-party transactions",        "weight": 3},
    {"id": "going_concern",             "label": "Going-concern indicators",          "weight": 4},
    {"id": "it_controls",               "label": "Weak IT / access controls",         "weight": 2},
    {"id": "regulatory_non_compliance", "label": "Regulatory non-compliance history", "weight": 3},
    {"id": "high_complexity",           "label": "High transaction complexity",       "weight": 2},
]


def register_risk_wizard(mcp: MCPAppsServer, ui: UIResource) -> None:
    def handler() -> str:
        return json.dumps({
            "status": "wizard_launched",
            "clients": CLIENTS,
            "engagement_types": ENGAGEMENT_TYPES,
            "risk_factors": RISK_FACTORS,
        })

    mcp.register_app_tool(
        name="start_risk_wizard",
        description=(
            "Launch the interactive 5-step Risk Assessment Wizard. "
            "Step 1: pick client. Step 2: engagement type. "
            "Step 3: select risk factors. Step 4: review computed risk rating. "
            "Step 5: approve or escalate. No arguments required."
        ),
        input_schema={},
        resource_uri=ui.uri,
        handler=handler,
    )
