"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMCPClient } from '@/lib/mcp-client';
import type { MCPTool } from '@/lib/mcp-client';
import { AppRendererHost, isMCPAppTool } from '@/components/AppRendererHost';

// ─── types ────────────────────────────────────────────────────────────────────

interface ToolCall { name: string; args: Record<string, unknown>; result: string; }

interface CosmosNode {
  id:          string;
  label:       string;
  type:        string;
  description: string;
  properties:  Record<string, string>;
}

interface Message {
  id:          string;
  role:        'user' | 'assistant' | 'system';
  content:     string;
  toolCall?:   ToolCall;
  nodeDetail?: CosmosNode;   // populated when user clicks a graph node
  ts:          Date;
}

// ─── node detail card colours ─────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  BusinessRules: '#3b9ede',
  Obligations:   '#f59e42',
  Processes:     '#3ecf8e',
  Controls:      '#b06de8',
};
function typeColor(t: string) { return TYPE_COLORS[t] ?? '#8899aa'; }

// ─── pretty label map ─────────────────────────────────────────────────────────
const PROP_LABELS: Record<string, string> = {
  what:'What', why:'Why', who:'Who', where:'Where', when:'When', how:'How',
  category:'Category', entity_type:'Entity Type', domain:'Domain',
  jurisdiction:'Jurisdiction', risk_level:'Risk Level',
  document_source:'Document', source_page:'Page',
};
function prettyKey(k: string) {
  return PROP_LABELS[k] ?? k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── NodeDetailCard ───────────────────────────────────────────────────────────
function NodeDetailCard({ node }: { node: CosmosNode }) {
  const col = typeColor(node.type);
  // Priority order: show descriptive fields first
  const PRIORITY = ['what','why','who','where','when','how'];
  const props = node.properties ?? {};
  const priorityProps = PRIORITY.filter(k => props[k]);
  const otherProps    = Object.entries(props)
    .filter(([k, v]) => v && !PRIORITY.includes(k) && k !== 'category');

  return (
    <div style={{
      background:'#1a2e45', border:'1px solid #2a4060',
      borderRadius:12, overflow:'hidden', width:'100%',
    }}>
      {/* header */}
      <div style={{
        padding:'12px 16px', background:'#162438',
        borderBottom:'1px solid #2a4060', display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{
          width:10, height:10, borderRadius:'50%',
          background: col, boxShadow:`0 0 8px ${col}`, flexShrink:0,
          display:'inline-block',
        }}/>
        <div style={{flex:1}}>
          <div style={{fontSize:15, fontWeight:700, color:'#e8f4fd'}}>{node.label}</div>
          <div style={{fontSize:11, color: col, marginTop:2, textTransform:'uppercase', letterSpacing:'0.8px'}}>
            {node.type}
          </div>
        </div>
        <span style={{
          fontSize:10, padding:'2px 10px', borderRadius:10,
          background:`${col}22`, color:col, border:`1px solid ${col}44`,
          fontWeight:700,
        }}>Cosmos DB</span>
      </div>

      <div style={{padding:'14px 16px', display:'flex', flexDirection:'column', gap:14}}>
        {/* description */}
        {node.description && node.description !== 'No description' && (
          <div>
            <div style={{fontSize:10, color:'#00b4d8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4}}>
              Description
            </div>
            <div style={{fontSize:13, color:'#c0d8ee', lineHeight:1.7}}>{node.description}</div>
          </div>
        )}

        {/* priority: what / why / who / where / when / how */}
        {priorityProps.length > 0 && (
          <div>
            <div style={{fontSize:10, color:'#00b4d8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8}}>
              Details
            </div>
            <div style={{display:'grid', gap:8}}>
              {priorityProps.map(k => (
                <div key={k} style={{
                  background:'rgba(0,0,0,.25)', borderRadius:8,
                  padding:'8px 12px', borderLeft:`3px solid ${col}`,
                }}>
                  <div style={{fontSize:10, color:col, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3}}>
                    {prettyKey(k)}
                  </div>
                  <div style={{fontSize:13, color:'#e8f4fd', lineHeight:1.6}}>{props[k]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* other properties */}
        {otherProps.length > 0 && (
          <div>
            <div style={{fontSize:10, color:'#00b4d8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6}}>
              Properties
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'auto 1fr',
              gap:'4px 12px', fontSize:12,
            }}>
              {otherProps.map(([k, v]) => (
                <>
                  <div key={`k-${k}`} style={{color:'#7fb3d3', whiteSpace:'nowrap', paddingTop:2}}>
                    {prettyKey(k)}
                  </div>
                  <div key={`v-${k}`} style={{color:'#e8f4fd', wordBreak:'break-word'}}>{v}</div>
                </>
              ))}
            </div>
          </div>
        )}

        {/* node ID */}
        <div style={{
          fontSize:10, color:'#3a5070', fontFamily:'monospace',
          padding:'4px 8px', background:'rgba(0,0,0,.2)', borderRadius:4,
        }}>
          ID: {node.id}
        </div>
      </div>
    </div>
  );
}

// ─── quick-action buttons ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '🧮 Calculator',       text: 'open the calculator',           color: '#1e4080' },
  { label: '🕸 Regulatory Graph', text: 'show regulatory graph',         color: '#1a3a20' },
  { label: '🏦 Obligations',      text: 'show obligations graph',        color: '#1a3a20' },
  { label: '🔍 Search: Bribery',  text: 'search policy bribery',         color: '#2a2010' },
  { label: '🧭 Risk Wizard',      text: 'start risk assessment wizard',  color: '#1a1a40' },
  { label: '🏛 BusinessRules',    text: 'show businessrules graph',      color: '#1a3a20' },
  { label: '⚙ Controls',         text: 'show controls graph',           color: '#1a3a20' },
  { label: '🔧 Processes',        text: 'show processes graph',          color: '#1a3a20' },
];

// ─── keyword router ───────────────────────────────────────────────────────────

function route(input: string): ToolCall | null {
  const s = input.toLowerCase();

  // Calculator
  if (s.includes('calculat') || s.includes('calculator') || s.includes('calc')) {
    const expr = input.match(/[\d\s\+\-\*\/\.\(\)]+/)?.[0]?.trim() ?? '';
    return { name: 'calculator', args: { initial: expr }, result: '' };
  }

  // Risk wizard
  if (s.includes('risk') || s.includes('wizard') || s.includes('assessment')) {
    return { name: 'start_risk_wizard', args: {}, result: '' };
  }

  // Cosmos graph — label routing
  if (s.includes('obligation'))   return { name: 'cosmos_graph_live', args: { label: 'Obligations',   limit: 30 }, result: '' };
  if (s.includes('process'))      return { name: 'cosmos_graph_live', args: { label: 'Processes',     limit: 30 }, result: '' };
  if (s.includes('control'))      return { name: 'cosmos_graph_live', args: { label: 'Controls',      limit: 30 }, result: '' };
  if (s.includes('bribery'))      return { name: 'cosmos_graph_live', args: { label: 'Bribery',       limit: 20 }, result: '' };
  if (s.includes('crime'))        return { name: 'cosmos_graph_live', args: { label: 'Crime',         limit: 20 }, result: '' };
  if (s.includes('gdpr'))         return { name: 'cosmos_graph_live', args: { label: 'GDPR',          limit: 20 }, result: '' };
  if (s.includes('search') && s.includes('polic')) {
    const keyword = input.split(' ').pop() ?? 'compliance';
    return { name: 'cosmos_graph_live', args: { label: keyword, limit: 20 }, result: '' };
  }
  if (s.includes('graph') || s.includes('regulatory') || s.includes('policy') ||
      s.includes('polic') || s.includes('cosmos') || s.includes('businessrule') ||
      s.includes('business rule') || s.includes('compliance')) {
    return { name: 'cosmos_graph_live', args: { label: 'BusinessRules', limit: 30 }, result: '' };
  }

  return null;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [connected,   setConnected]   = useState(false);
  const [tools,       setTools]       = useState<MCPTool[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const client    = getMCPClient();

  // Connect to the newMethod server on mount
  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'http://localhost:3002';
    client.connect(`${serverUrl}/sse`)
      .then(t => {
        setTools(t);
        setConnected(true);
        setMessages([{
          id: 'welcome', role: 'system', ts: new Date(),
          content: `Connected to newMethod MCP Apps server · ${t.length} tools: ${t.map(x => x.name).join(', ')}`,
        }]);
      })
      .catch(() => {
        setMessages([{
          id: 'err', role: 'system', ts: new Date(),
          content: 'Cannot connect to the MCP server. Run:\n  cd newMethod/server && .venv/bin/python3 server.py',
        }]);
      });
    return () => { client.disconnect(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading || !connected) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', ts: new Date(), content: text };
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    const call = route(text);

    if (!call) {
      setMessages(p => [...p, {
        id: `a-${Date.now()}`, role: 'assistant', ts: new Date(),
        content: [
          'I can open these interactive MCP App widgets:\n',
          '  🧮 "open the calculator"',
          '  🕸 "show regulatory graph" / "show obligations graph"',
          '  🔍 "search policy bribery"',
          '  🧭 "start risk assessment wizard"',
          '\nOr click one of the quick-action buttons below.',
        ].join('\n'),
      }]);
      setLoading(false);
      return;
    }

    // Show loading bubble
    const loadId = `a-${Date.now()}`;
    setMessages(p => [...p, { id: loadId, role: 'assistant', ts: new Date(), content: '…' }]);

    try {
      const result = await client.callTool(call.name, call.args);
      call.result = result;
      setMessages(p => p.map(m => m.id === loadId
        ? { ...m, content: result, toolCall: call }
        : m
      ));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tool call failed';
      setMessages(p => p.map(m => m.id === loadId ? { ...m, content: `Error: ${msg}` } : m));
    } finally {
      setLoading(false);
    }
  }, [loading, connected, client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
    setInput('');
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh',
                  background:'#0d1b2a', color:'#e8f4fd' }}>

      {/* ── Header ── */}
      <div style={{ padding:'14px 24px', background:'#1a2e45',
                    borderBottom:'1px solid #2a4060', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#00b4d8',
                        boxShadow:'0 0 8px #00b4d8' }} />
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#e8f4fd' }}>
              newMethod — MCP Apps
            </div>
            <div style={{ fontSize:11, color:'#7fb3d3', marginTop:2 }}>
              {connected
                ? `● Connected · ${tools.length} tools · server-driven UI (SEP-1865)`
                : '○ Connecting to port 3002…'}
            </div>
          </div>
        </div>
        <div style={{ fontSize:11, color:'#2a4060', background:'#0d1b2a',
                      padding:'4px 12px', borderRadius:12, border:'1px solid #2a4060' }}>
          port 3002
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
          {messages.map(msg => (
            <div key={msg.id}
              style={{ display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

              {msg.role === 'user' && (
                <div style={{ maxWidth:'70%', background:'#0096c7', color:'#fff',
                              borderRadius:'16px 16px 4px 16px', padding:'10px 16px',
                              fontSize:14, lineHeight:1.5 }}>
                  {msg.content}
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:4 }}>
                    {msg.ts.toLocaleTimeString()}
                  </div>
                </div>
              )}

              {msg.role === 'system' && (
                <div style={{ width:'100%', background:'#1a2e45', border:'1px solid #2a4060',
                              borderRadius:10, padding:'10px 16px', fontSize:12,
                              color:'#7fb3d3', whiteSpace:'pre-wrap' }}>
                  {msg.content}
                </div>
              )}

              {msg.role === 'assistant' && (
                <div style={{ maxWidth: msg.toolCall && isMCPAppTool(msg.toolCall.name) ? '100%' : '80%',
                              width:   msg.toolCall && isMCPAppTool(msg.toolCall.name) ? '100%' : undefined }}>
                  {/* loading dots */}
                  {msg.content === '…' && (
                    <div style={{ display:'flex', gap:5, padding:'12px 16px',
                                  background:'#1a2e45', borderRadius:'16px 16px 16px 4px',
                                  border:'1px solid #2a4060' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width:7, height:7, borderRadius:'50%',
                                              background:'#7fb3d3',
                                              animation:`bounce 1s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  )}

                  {/* node detail card — posted from graph widget on node click */}
                  {msg.nodeDetail && (
                    <div>
                      <div style={{ fontSize:11, color:'#7fb3d3', marginBottom:6,
                                    display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%',
                                       background: typeColor(msg.nodeDetail.type), display:'inline-block' }} />
                        Node selected from graph
                        <span style={{ marginLeft:'auto', fontSize:10 }}>{msg.ts.toLocaleTimeString()}</span>
                      </div>
                      <NodeDetailCard node={msg.nodeDetail} />
                    </div>
                  )}

                  {/* MCP App widget */}
                  {msg.content !== '…' && msg.toolCall && isMCPAppTool(msg.toolCall.name) && (
                    <div>
                      <div style={{ fontSize:11, color:'#7fb3d3', marginBottom:6,
                                    display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%',
                                       background:'#00b4d8', display:'inline-block' }} />
                        Tool called: <strong style={{ color:'#00b4d8' }}>{msg.toolCall.name}</strong>
                        <span style={{ marginLeft:'auto', fontSize:10 }}>{msg.ts.toLocaleTimeString()}</span>
                      </div>
                      <AppRendererHost
                        toolName={msg.toolCall.name}
                        toolInput={msg.toolCall.args}
                        toolResult={msg.toolCall.result}
                        height={msg.toolCall.name === 'start_risk_wizard' ? 580 : 500}
                        onMessage={(payload: unknown) => {
                          const p = payload as Record<string, unknown>;
                          if (p?.type === 'NODE_SELECTED') {
                            const node = (p.payload as Record<string, unknown>)?.node as CosmosNode;
                            if (node) {
                              setMessages(prev => [...prev, {
                                id: `node-${Date.now()}`,
                                role: 'assistant' as const,
                                content: '',
                                nodeDetail: node,
                                ts: new Date(),
                              }]);
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Plain text assistant message */}
                  {msg.content !== '…' && (!msg.toolCall || !isMCPAppTool(msg.toolCall.name)) && (
                    <div style={{ background:'#1a2e45', border:'1px solid #2a4060',
                                  borderRadius:'16px 16px 16px 4px', padding:'12px 16px',
                                  fontSize:14, lineHeight:1.7, color:'#e8f4fd',
                                  whiteSpace:'pre-wrap' }}>
                      {msg.content}
                      <div style={{ fontSize:10, color:'#7fb3d3', marginTop:6 }}>
                        {msg.ts.toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ padding:'8px 16px', borderTop:'1px solid #1a2e45',
                    display:'flex', gap:8, flexWrap:'wrap', flexShrink:0 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.label}
            disabled={!connected || loading}
            onClick={() => { setInput(a.text); send(a.text); }}
            style={{ padding:'5px 14px', borderRadius:20, border:'1px solid #2a4060',
                     background: a.color, color:'#e8f4fd', fontSize:12, cursor:'pointer',
                     opacity: (!connected || loading) ? 0.4 : 1,
                     transition:'all 0.15s' }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div style={{ padding:'12px 16px', background:'#1a2e45',
                    borderTop:'1px solid #2a4060', flexShrink:0 }}>
        <form onSubmit={handleSubmit}
          style={{ maxWidth:860, margin:'0 auto', display:'flex', gap:10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={connected
              ? 'Try "open the calculator", "show regulatory graph", "start risk wizard"…'
              : 'Connecting to MCP server on port 3002…'}
            disabled={!connected || loading}
            style={{ flex:1, padding:'11px 16px', borderRadius:10,
                     border:'1px solid #2a4060', background:'#0d1b2a',
                     color:'#e8f4fd', fontSize:14, outline:'none' }}
          />
          <button type="submit"
            disabled={!connected || loading || !input.trim()}
            style={{ padding:'11px 24px', borderRadius:10, border:'none',
                     background: connected && !loading && input.trim() ? '#0096c7' : '#1a2e45',
                     color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
                     transition:'background 0.15s' }}>
            Send
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0) }
          40%          { transform:translateY(-6px) }
        }
      `}</style>
    </div>
  );
}
