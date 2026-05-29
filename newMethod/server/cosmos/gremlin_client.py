"""
Self-contained Gremlin/Cosmos DB client for newMethod server.

Key design: the ENTIRE Gremlin flow (create client + run query + close)
runs inside a ThreadPoolExecutor so it gets its own event loop, isolated
from uvicorn's running async loop. This prevents the classic
"Cannot run the event loop while another loop is running" error.
"""

from __future__ import annotations

import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load .env explicitly from newMethod/server/.env
_ENV_FILE = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_FILE, override=True)

# ── Credentials ───────────────────────────────────────────────────────────────

def _creds() -> dict:
    endpoint  = os.getenv("COSMOS_DB_ENDPOINT",       "").strip('"')
    password  = os.getenv("COSMOS_DB_PRIMARY_KEY",    "").strip('"')
    database  = os.getenv("COSMOS_DB_DATABASE_NAME",  "").strip('"')
    container = os.getenv("COSMOS_DB_CONTAINER_NAME", "").strip('"')
    username  = os.getenv("COSMOS_DB_GREMLIN_USERNAME",
                          f"/dbs/{database}/colls/{container}").strip('"')
    if not endpoint or not password or not database or not container:
        raise ValueError(
            f"Missing Cosmos DB credentials in {_ENV_FILE}. "
            "Need COSMOS_DB_ENDPOINT, COSMOS_DB_PRIMARY_KEY, "
            "COSMOS_DB_DATABASE_NAME, COSMOS_DB_CONTAINER_NAME."
        )
    return dict(endpoint=endpoint, username=username, password=password)


# ── Thread-isolated query ─────────────────────────────────────────────────────

def _run_in_thread(gremlin_query: str) -> list:
    """
    Run a single Gremlin query in a dedicated thread that owns its own
    asyncio event loop. This is the only safe way to use gremlin-python
    when uvicorn is already running an event loop on the main thread.
    """
    def _work():
        from gremlin_python.driver import client as glib, serializer

        # Fresh event loop for this thread only
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        creds = _creds()
        g = glib.Client(
            url=creds["endpoint"],
            traversal_source="g",
            username=creds["username"],
            password=creds["password"],
            message_serializer=serializer.GraphSONSerializersV2d0(),
        )
        try:
            return g.submit(gremlin_query).all().result()
        finally:
            g.close()
            loop.close()

    with ThreadPoolExecutor(max_workers=1) as pool:
        return pool.submit(_work).result(timeout=30)


# ── Data transformation ───────────────────────────────────────────────────────

def _parse_attr(raw: Any) -> dict:
    try:
        if isinstance(raw, list):
            raw = raw[0]
        return {item["key"]: item["value"] for item in json.loads(raw)}
    except Exception:
        return {}


def _build_node(v: dict) -> dict | None:
    if not isinstance(v, dict):
        return None
    nid = v.get("id", "")
    if isinstance(nid, list): nid = nid[0]
    label = v.get("label", "Unknown")
    if isinstance(label, list): label = label[0]
    name = v.get("name", nid)
    if isinstance(name, list): name = name[0] if name else nid
    attrs = _parse_attr(v.get("node_attributes", "[]"))
    parts = [attrs.get("what", ""), attrs.get("why", "") and f"Purpose: {attrs['why']}"]
    desc = " | ".join(p for p in parts if p)
    etype = v.get("EntityType", ["Entity"])
    if isinstance(etype, list): etype = etype[0] if etype else "Entity"
    return {
        "id":          str(nid),
        "label":       str(name).replace("_", " ").title(),
        "type":        label,
        "description": desc or "No description",
        "properties":  {"category": label, "entity_type": etype, **attrs},
    }


def _build_edge(e: dict, valid_ids: set) -> dict | None:
    if not isinstance(e, dict):
        return None
    src = str(e.get("outV", e.get("source", "")))
    tgt = str(e.get("inV",  e.get("target", "")))
    if src not in valid_ids or tgt not in valid_ids:
        return None
    rel_attrs = _parse_attr(e.get("relationship_attributes", "[]"))
    doc  = e.get("document_source", [""]); doc  = doc[0]  if isinstance(doc,  list) else doc
    page = e.get("source_page",     [""]); page = page[0] if isinstance(page, list) else page
    return {
        "source":       src,
        "target":       tgt,
        "relationship": e.get("label", "RELATED"),
        "properties":   {
            "link_strength":    rel_attrs.get("link_strength",    "medium"),
            "link_explanation": rel_attrs.get("link_explanation", ""),
            "document_source":  doc,
            "source_page":      page,
        },
    }


def _transform(vertices: list, edges_raw: list, topic: str) -> dict:
    nodes = [n for v in vertices if (n := _build_node(v))]
    valid = {n["id"] for n in nodes}
    edges = [e for r in edges_raw if (e := _build_edge(r, valid))]
    return {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "topic":      topic,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "source":     "Azure CosmosDB Gremlin API (live data)",
            "timestamp":  datetime.now(timezone.utc).isoformat() + "Z",
        },
    }


# ── Public API ────────────────────────────────────────────────────────────────

STANDARD_LABELS = {"BusinessRules", "Obligations", "Processes", "Controls"}


def query_graph(label: str, limit: int = 50) -> dict:
    """
    Query live Cosmos DB and return a structured graph dict.
    Raises no exceptions — errors are returned as a 'source' note in metadata.
    """
    try:
        if label in STANDARD_LABELS:
            vertices  = _run_in_thread(f"g.V().hasLabel('{label}').limit({limit}).valueMap(true)")
            edges_raw = _run_in_thread(f"g.V().hasLabel('{label}').limit({limit}).outE().valueMap(true)")
        else:
            # keyword search
            all_v = _run_in_thread(f"g.V().limit({limit * 3}).valueMap(true)")
            kw = label.lower()
            vertices = []
            for v in all_v:
                vid  = str(v.get("id",   "")).lower()
                name = v.get("name", [])
                name = (name[0] if name else "").lower()
                if kw in vid or kw in name:
                    vertices.append(v)
                    if len(vertices) >= limit:
                        break
            edge_list = []
            for v in vertices[:8]:
                vid2 = v.get("id")
                if vid2:
                    edge_list.extend(_run_in_thread(f"g.V('{vid2}').bothE().valueMap(true)"))
            edges_raw = edge_list

        result = _transform(vertices, edges_raw, label)
        print(f"[cosmos] Live: {result['metadata']['node_count']} nodes, {result['metadata']['edge_count']} edges")
        return result

    except Exception as exc:
        print(f"[cosmos] ERROR: {exc}")
        return _mock_graph(str(exc))


# ── Mock fallback ─────────────────────────────────────────────────────────────

def _mock_graph(error_note: str) -> dict:
    """
    Fallback when Cosmos DB is unreachable.
    Still shows a realistic graph so the UI is not empty.
    """
    return {
        "nodes": [
            {"id":"br1","label":"Anti-Bribery Policy",       "type":"BusinessRules","description":"Group-wide anti-bribery framework","properties":{"category":"BusinessRules","entity_type":"Policy"}},
            {"id":"ob1","label":"Reporting Obligation",       "type":"Obligations",  "description":"SAR mandatory reporting requirement",  "properties":{"category":"Obligations",  "entity_type":"Obligation"}},
            {"id":"ob2","label":"Due Diligence Requirement",  "type":"Obligations",  "description":"CDD for high-risk clients",             "properties":{"category":"Obligations",  "entity_type":"Obligation"}},
            {"id":"pr1","label":"KYC Onboarding",             "type":"Processes",    "description":"Know-Your-Customer verification",       "properties":{"category":"Processes",    "entity_type":"Process"}},
            {"id":"pr2","label":"Transaction Monitoring",     "type":"Processes",    "description":"Real-time transaction screening",       "properties":{"category":"Processes",    "entity_type":"Process"}},
            {"id":"ct1","label":"Access Controls",            "type":"Controls",     "description":"Role-based access management",          "properties":{"category":"Controls",     "entity_type":"Control"}},
            {"id":"ct2","label":"Audit Trail Logging",        "type":"Controls",     "description":"Immutable log of privileged actions",   "properties":{"category":"Controls",     "entity_type":"Control"}},
            {"id":"br2","label":"Economic Crime Policy",      "type":"BusinessRules","description":"Anti-money laundering policy",          "properties":{"category":"BusinessRules","entity_type":"Policy"}},
            {"id":"ob3","label":"PEP Screening Obligation",   "type":"Obligations",  "description":"Politically Exposed Person checks",     "properties":{"category":"Obligations",  "entity_type":"Obligation"}},
            {"id":"pr3","label":"Sanctions Screening",        "type":"Processes",    "description":"OFAC/HMT sanctions list matching",      "properties":{"category":"Processes",    "entity_type":"Process"}},
            {"id":"ct3","label":"Four-Eyes Approval",         "type":"Controls",     "description":"Dual-sign-off for high-risk actions",   "properties":{"category":"Controls",     "entity_type":"Control"}},
        ],
        "edges": [
            {"source":"br1","target":"ob1","relationship":"REQUIRES", "properties":{"link_strength":"strong"}},
            {"source":"br1","target":"ob2","relationship":"REQUIRES", "properties":{"link_strength":"strong"}},
            {"source":"ob1","target":"pr1","relationship":"TRIGGERS", "properties":{"link_strength":"medium"}},
            {"source":"ob2","target":"pr1","relationship":"TRIGGERS", "properties":{"link_strength":"medium"}},
            {"source":"pr1","target":"ct1","relationship":"USES",     "properties":{"link_strength":"medium"}},
            {"source":"pr2","target":"ct2","relationship":"GENERATES","properties":{"link_strength":"strong"}},
            {"source":"br1","target":"pr2","relationship":"MANDATES", "properties":{"link_strength":"strong"}},
            {"source":"br2","target":"ob3","relationship":"REQUIRES", "properties":{"link_strength":"strong"}},
            {"source":"ob3","target":"pr3","relationship":"TRIGGERS", "properties":{"link_strength":"medium"}},
            {"source":"pr3","target":"ct3","relationship":"USES",     "properties":{"link_strength":"medium"}},
            {"source":"br2","target":"ct3","relationship":"MANDATES", "properties":{"link_strength":"strong"}},
        ],
        "metadata": {
            "node_count": 11,
            "edge_count":  11,
            "source":      f"Offline demo data (Cosmos unreachable: {error_note[:80]})",
        },
    }



