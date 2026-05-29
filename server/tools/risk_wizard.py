"""
Risk Assessment Wizard — 5-step interactive UI demo.

Each function is an MCP tool that returns an interactive envelope.
Session state round-trips in every target_args so the server stays stateless.
"""

import json
from ._envelope import envelope, action

# ---------------------------------------------------------------------------
# Step 1 — Pick a client
# ---------------------------------------------------------------------------

CLIENTS = [
    {"id": "techcorp",   "label": "TechCorp",   "description": "Audit engagement — FY26 Q2"},
    {"id": "acme",       "label": "Acme Ltd",   "description": "Tax advisory — FY26 Q1"},
    {"id": "globalbank", "label": "GlobalBank", "description": "Advisory — Risk & Controls Review"},
]


def risk_wizard_step1_pick_client() -> str:
    """Start the Risk Assessment Wizard — step 1: pick a client."""
    session = {"wizard_id": "risk-assessment", "step": 1, "history": []}
    actions = [
        action(
            id=c["id"],
            label=c["label"],
            description=c["description"],
            target_tool="risk_wizard_step2_engagement_type",
            target_args={"client_id": c["id"], "session": {**session, "step": 2, "history": [{"step": 1, "client_id": c["id"], "client_label": c["label"]}]}},
        )
        for c in CLIENTS
    ]
    return envelope(
        ui_type="option_list",
        title="Select a client engagement",
        subtitle="Step 1 of 5 — Risk Assessment Wizard",
        payload={"options": CLIENTS},
        actions=actions,
        session=session,
        tool_name="risk_wizard_step1_pick_client",
    )


# ---------------------------------------------------------------------------
# Step 2 — Pick engagement type
# ---------------------------------------------------------------------------

ENGAGEMENT_TYPES = [
    {"id": "audit",    "label": "Audit",    "description": "Annual statutory audit and internal controls review"},
    {"id": "tax",      "label": "Tax",      "description": "Transfer pricing, VAT, and corporate tax advisory"},
    {"id": "advisory", "label": "Advisory", "description": "Risk management, strategy, and transaction services"},
]


def risk_wizard_step2_engagement_type(client_id: str, session: dict) -> str:
    """Step 2: pick the engagement type for the selected client."""
    client_label = next((c["label"] for c in CLIENTS if c["id"] == client_id), client_id)
    actions = [
        action(
            id=e["id"],
            label=e["label"],
            description=e["description"],
            target_tool="risk_wizard_step3_risk_factors",
            target_args={
                "client_id": client_id,
                "engagement": e["id"],
                "session": {
                    **session,
                    "step": 3,
                    "history": session.get("history", []) + [{"step": 2, "engagement": e["id"], "engagement_label": e["label"]}],
                },
            },
        )
        for e in ENGAGEMENT_TYPES
    ]
    return envelope(
        ui_type="option_list",
        title=f"Select engagement type — {client_label}",
        subtitle="Step 2 of 5 — Risk Assessment Wizard",
        payload={"options": ENGAGEMENT_TYPES, "client_id": client_id},
        actions=actions,
        session=session,
        tool_name="risk_wizard_step2_engagement_type",
    )


# ---------------------------------------------------------------------------
# Step 3 — Identify risk factors (multi-step form)
# ---------------------------------------------------------------------------

RISK_FACTORS = [
    {"id": "revenue_recognition",      "label": "Revenue recognition issues",       "weight": 3},
    {"id": "related_party",            "label": "Related-party transactions",        "weight": 3},
    {"id": "going_concern",            "label": "Going-concern indicators",          "weight": 4},
    {"id": "it_controls",              "label": "Weak IT / access controls",         "weight": 2},
    {"id": "regulatory_non_compliance","label": "Regulatory non-compliance history", "weight": 3},
    {"id": "high_complexity",          "label": "High transaction complexity",       "weight": 2},
]


def risk_wizard_step3_risk_factors(client_id: str, engagement: str, session: dict) -> str:
    """Step 3: select risk factors to assess."""
    client_label = next((c["label"] for c in CLIENTS if c["id"] == client_id), client_id)
    engagement_label = next((e["label"] for e in ENGAGEMENT_TYPES if e["id"] == engagement), engagement)

    # The form bundles all checked factors in the Continue action
    return envelope(
        ui_type="multi_step_form",
        title=f"Identify risk factors — {client_label} / {engagement_label}",
        subtitle="Step 3 of 5 — Check all factors that apply",
        payload={
            "fields": [
                {"type": "checkbox_group", "id": "risk_factors", "label": "Risk factors", "options": RISK_FACTORS}
            ],
            "client_id": client_id,
            "engagement": engagement,
        },
        actions=[
            action(
                id="continue",
                label="Continue to Assessment",
                target_tool="risk_wizard_step4_assessment",
                target_args={
                    "client_id": client_id,
                    "engagement": engagement,
                    "risk_factors": "__form_values__",
                    "session": {
                        **session,
                        "step": 4,
                        "history": session.get("history", []) + [{"step": 3, "note": "risk factors selected via form"}],
                    },
                },
                kind="primary",
            )
        ],
        session=session,
        tool_name="risk_wizard_step3_risk_factors",
    )


# ---------------------------------------------------------------------------
# Step 4 — Assessment result (summary card)
# ---------------------------------------------------------------------------

RISK_WEIGHTS: dict[str, int] = {rf["id"]: rf["weight"] for rf in RISK_FACTORS}

KG_TOPIC_MAP = {
    "audit":    "audit_methodology",
    "tax":      "tax_compliance",
    "advisory": "cloud_security",
}


def risk_wizard_step4_assessment(client_id: str, engagement: str, risk_factors: list[str], session: dict) -> str:
    """Step 4: compute risk rating and show summary with embedded knowledge graph."""
    client_label = next((c["label"] for c in CLIENTS if c["id"] == client_id), client_id)
    engagement_label = next((e["label"] for e in ENGAGEMENT_TYPES if e["id"] == engagement), engagement)

    score = sum(RISK_WEIGHTS.get(rf, 1) for rf in risk_factors)
    if score >= 10:
        rating, colour, rationale = "HIGH", "red", "Multiple high-weight risk indicators detected. Immediate partner review required."
    elif score >= 5:
        rating, colour, rationale = "MEDIUM", "amber", "Moderate risk profile. Increased audit procedures recommended."
    else:
        rating, colour, rationale = "LOW", "green", "Risk profile within acceptable tolerance. Standard procedures apply."

    factor_labels = [next((rf["label"] for rf in RISK_FACTORS if rf["id"] == fid), fid) for fid in risk_factors]
    kg_topic = KG_TOPIC_MAP.get(engagement, "audit_methodology")

    session_next = {**session, "step": 5, "history": session.get("history", []) + [{"step": 4, "rating": rating, "score": score, "risk_factors": risk_factors}]}

    return envelope(
        ui_type="summary_card",
        title=f"Risk Assessment — {client_label}",
        subtitle="Step 4 of 5 — Review and approve",
        payload={
            "client": client_label,
            "engagement": engagement_label,
            "risk_rating": rating,
            "risk_colour": colour,
            "risk_score": score,
            "rationale": rationale,
            "flagged_factors": factor_labels,
            "knowledge_graph_topic": kg_topic,
        },
        actions=[
            action(
                id="approve",
                label="Approve & Finalise",
                description="Accept this assessment and generate the report",
                target_tool="risk_wizard_finalize",
                target_args={"decision": "approved", "session": session_next},
                kind="primary",
            ),
            action(
                id="review",
                label="Send for Partner Review",
                description="Escalate to senior partner before finalising",
                target_tool="risk_wizard_finalize",
                target_args={"decision": "escalated", "session": session_next},
                kind="secondary",
            ),
        ],
        session=session,
        tool_name="risk_wizard_step4_assessment",
    )


# ---------------------------------------------------------------------------
# Step 5 — Confirmation (terminal)
# ---------------------------------------------------------------------------

def risk_wizard_finalize(decision: str, session: dict) -> str:
    """Step 5: finalise the assessment — terminal card."""
    history = session.get("history", [])
    step4 = next((h for h in history if h.get("step") == 4), {})
    rating = step4.get("rating", "UNKNOWN")
    client_label = next(
        (h.get("client_label", "") for h in history if h.get("step") == 1), "the client"
    )

    if decision == "approved":
        title = "Assessment Finalised"
        message = f"The {rating} risk assessment for {client_label} has been approved and logged. A PDF report will be generated within 24 hours."
        icon = "success"
    else:
        title = "Escalated for Partner Review"
        message = f"The {rating} risk assessment for {client_label} has been sent to the senior partner queue. Expect a response within 2 business days."
        icon = "info"

    return envelope(
        ui_type="confirmation_card",
        title=title,
        subtitle="Step 5 of 5 — Complete",
        payload={"message": message, "icon": icon, "decision": decision, "rating": rating, "client": client_label},
        actions=[],
        session={**session, "step": 5},
        tool_name="risk_wizard_finalize",
    )
