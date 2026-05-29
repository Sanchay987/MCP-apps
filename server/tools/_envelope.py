"""Helper for building interactive UI envelopes returned by MCP tools."""

import json
from datetime import datetime, timezone
from typing import Any


def action(
    id: str,
    label: str,
    target_tool: str,
    target_args: dict[str, Any],
    description: str = "",
    kind: str = "primary",
) -> dict[str, Any]:
    return {
        "id": id,
        "label": label,
        "description": description,
        "kind": kind,
        "target_tool": target_tool,
        "target_args": target_args,
    }


def envelope(
    ui_type: str,
    title: str,
    payload: dict[str, Any],
    actions: list[dict[str, Any]],
    session: dict[str, Any],
    subtitle: str = "",
    tool_name: str = "",
) -> str:
    return json.dumps({
        "ui_type": ui_type,
        "title": title,
        "subtitle": subtitle,
        "payload": payload,
        "actions": actions,
        "state": session,
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "tool": tool_name,
        },
    })
