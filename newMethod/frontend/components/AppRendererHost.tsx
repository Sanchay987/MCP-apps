"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

const MCP_SERVER = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'http://localhost:3002';

// Tools that have server-side HTML widgets
const TOOL_RESOURCE_MAP: Record<string, string> = {
  calculator:        'ui://newmethod/calculator',
  cosmos_graph_live: 'ui://newmethod/cosmos-graph',
  start_risk_wizard: 'ui://newmethod/risk-wizard',
};

export function isMCPAppTool(toolName: string): boolean {
  return toolName in TOOL_RESOURCE_MAP;
}

interface Props {
  toolName:   string;
  toolInput?: Record<string, unknown>;
  toolResult: string;
  height?:    number;
  onMessage?: (payload: unknown) => void;
}

export function AppRendererHost({ toolName, toolInput = {}, toolResult, height = 520, onMessage }: Props) {
  const resourceUri = TOOL_RESOURCE_MAP[toolName];
  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const [html,    setHtml]    = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the HTML widget from the Python server
  useEffect(() => {
    if (!resourceUri) { setLoading(false); return; }
    fetch(`${MCP_SERVER}/resource?uri=${encodeURIComponent(resourceUri)}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(h => { setHtml(h); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [resourceUri]);

  // 2. Once iframe loads → send TOOL_INIT with toolInput + toolResult
  const handleLoad = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    let parsed: unknown = toolResult;
    try { parsed = JSON.parse(toolResult); } catch { /* keep string */ }
    const msg = {
      type: 'TOOL_INIT', toolName, toolInput,
      toolResult: { content: [{ type: 'text', text: toolResult }] },
    };
    win.postMessage(msg, '*');
    win.postMessage({ ...msg, type: 'mcpui:init', input: toolInput, result: parsed }, '*');
  }, [html, toolName, toolInput, toolResult]);

  // 3. Listen for messages back from the widget.
  //    IMPORTANT: check e.source matches THIS iframe so that when multiple
  //    AppRendererHost components are mounted (e.g. multiple graph queries in
  //    the same chat) only the originating iframe's messages are forwarded.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Ignore messages that didn't come from this specific iframe
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;

      const d = e.data;
      if (!d) return;
      if (d.type === 'TOOL_RESULT' || d.type === 'mcpui:message') {
        onMessage?.(d.payload ?? d);
      }
      if (d.type === 'NODE_SELECTED' || d.type === 'EDGE_SELECTED') {
        onMessage?.(d);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  if (!resourceUri) return null;

  return (
    <div
      style={{ height, background: '#0d1b2a', borderRadius: 12,
               border: '1px solid #2a4060', overflow: 'hidden',
               display: 'flex', flexDirection: 'column' }}
    >
      {/* thin top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
                    background:'#1a2e45', borderBottom:'1px solid #2a4060', flexShrink:0 }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#00b4d8',
                       boxShadow:'0 0 6px #00b4d8', display:'inline-block' }} />
        <span style={{ fontSize:11, color:'#7fb3d3', textTransform:'uppercase',
                       letterSpacing:1, flex:1 }}>{toolName}</span>
        <span style={{ fontSize:10, background:'#00b4d8', color:'#0d1b2a',
                       padding:'2px 8px', borderRadius:10, fontWeight:700 }}>MCP App</span>
      </div>

      {/* states */}
      {loading && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                      gap:10, flexDirection:'column' }}>
          <div style={{ width:28, height:28, border:'3px solid #2a4060',
                        borderTopColor:'#00b4d8', borderRadius:'50%',
                        animation:'spin 0.8s linear infinite' }} />
          <span style={{ color:'#7fb3d3', fontSize:13 }}>Loading widget…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      {error && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                      flexDirection:'column', gap:8 }}>
          <span style={{ color:'#e05252', fontSize:14 }}>⚠ {error}</span>
          <span style={{ color:'#7fb3d3', fontSize:12 }}>
            Is the newMethod server running?&nbsp;
            <code style={{ background:'#1a2e45', padding:'1px 6px', borderRadius:4 }}>
              cd newMethod/server && .venv/bin/python3 server.py
            </code>
          </span>
        </div>
      )}
      {html && (
        <iframe
          ref={iframeRef}
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{ flex:1, width:'100%', border:'none', display:'block' }}
          title={`MCP App: ${toolName}`}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}
