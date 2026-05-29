"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ComponentDispatcher } from '@/components/generative-ui/ComponentDispatcher';
import { getMCPClient } from '@/lib/mcp-client';
import type { MCPTool } from '@/lib/mcp-client';
import type { EnvelopeAction } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
  cardDisabled?: boolean;
  loadingAction?: string;
}

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mcpClient = getMCPClient();

  useEffect(() => {
    const connect = async () => {
      try {
        const tools = await mcpClient.connect('http://localhost:3001/sse');
        setAvailableTools(tools);
        setIsConnected(true);
        setMessages([{
          id: 'welcome',
          role: 'system',
          content: `Connected to MCP server. ${tools.length} tools available: ${tools.map(t => t.name).join(', ')}`,
          timestamp: new Date(),
        }]);
      } catch {
        setMessages([{
          id: 'error',
          role: 'system',
          content: 'Failed to connect to MCP server. Make sure the server is running on http://localhost:3001',
          timestamp: new Date(),
        }]);
      }
    };
    connect();
    return () => { mcpClient.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -------------------------------------------------------------------------
  // Core tool-call executor — used by both text routing and interactive actions
  // -------------------------------------------------------------------------
  const runTool = useCallback(async (toolName: string, args: Record<string, any>): Promise<string> => {
    return await mcpClient.callTool(toolName, args);
  }, [mcpClient]);

  // -------------------------------------------------------------------------
  // Interactive action handler — fired when user clicks a card button
  // -------------------------------------------------------------------------
  const handleInteractiveAction = useCallback(async (action: EnvelopeAction, fromMessageId: string) => {
    // Lock the source card immediately
    setMessages(prev => prev.map(m =>
      m.id === fromMessageId ? { ...m, cardDisabled: true, loadingAction: action.id } : m
    ));

    // Synthetic user bubble
    const userBubble: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: `Selected: ${action.label}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userBubble]);

    // Loading assistant bubble
    const loadingId = `${Date.now()}-loading`;
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '…',
      timestamp: new Date(),
    }]);

    try {
      const result = await runTool(action.target_tool, action.target_args);

      // Replace loading bubble with result AND clear loadingAction from source card
      setMessages(prev => prev.map(m => {
        if (m.id === loadingId) {
          return {
            ...m,
            content: result,
            toolCalls: [{ name: action.target_tool, arguments: action.target_args, result }],
          };
        }
        if (m.id === fromMessageId) {
          return { ...m, loadingAction: undefined }; // keep cardDisabled, just clear the "Processing…" label
        }
        return m;
      }));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: `Error: ${err?.message ?? 'Tool call failed'}` }
          : m
      ));
      // Unlock source card on error so user can retry
      setMessages(prev => prev.map(m =>
        m.id === fromMessageId ? { ...m, cardDisabled: false, loadingAction: undefined } : m
      ));
    }
  }, [runTool]);

  // -------------------------------------------------------------------------
  // Start-over handler — appends a fresh wizard start to the chat
  // -------------------------------------------------------------------------
  const handleStartOver = useCallback(async () => {
    if (isLoading || !isConnected) return;
    setIsLoading(true);
    try {
      const result = await runTool('start_risk_assessment', {});
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: result,
        toolCalls: [{ name: 'start_risk_assessment', arguments: {} }],
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [runTool, isLoading, isConnected]);

  // -------------------------------------------------------------------------
  // Text message handler — keyword routing to MCP tools
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      let toolCall: ToolCall | null = null;

      // Risk Assessment Wizard
      if (lowerInput.includes('risk') || lowerInput.includes('wizard') || lowerInput.includes('assessment')) {
        toolCall = { name: 'start_risk_assessment', arguments: {} };
      }
      // Financial Dashboard
      else if (lowerInput.includes('financial') || lowerInput.includes('revenue') ||
               lowerInput.includes('dashboard') || lowerInput.includes('quarterly') ||
               lowerInput.includes('engagement summary') || lowerInput.includes('kpmg summary')) {
        let report = 'kpmg_quarterly_summary';
        if (lowerInput.includes('client') || lowerInput.includes('engagement') || lowerInput.includes('techcorp')) {
          report = 'client_engagement_summary';
        }
        if (lowerInput.includes('tax compliance') || lowerInput.includes('tax dashboard')) {
          report = 'tax_compliance_dashboard';
        }
        toolCall = { name: 'query_financial_dashboard', arguments: { report_type: report } };
      }
      // List financial reports
      else if (lowerInput.includes('list') && (lowerInput.includes('report') || lowerInput.includes('financial'))) {
        toolCall = { name: 'list_available_financial_reports', arguments: {} };
      }
      // Knowledge Graph
      else if (lowerInput.includes('knowledge graph') || lowerInput.includes('cloud security') || lowerInput.includes('audit methodology')) {
        let topic = 'cloud_security';
        if (lowerInput.includes('audit')) topic = 'audit_methodology';
        toolCall = { name: 'query_enterprise_knowledge_graph', arguments: { topic } };
      }
      // List topics
      else if (lowerInput.includes('list') && lowerInput.includes('topic')) {
        toolCall = { name: 'list_available_knowledge_topics', arguments: {} };
      }
      // Regulatory / CosmosDB
      else if (lowerInput.includes('regulatory') || lowerInput.includes('policy') ||
               lowerInput.includes('policies') || lowerInput.includes('businessrules') ||
               lowerInput.includes('business rules') || lowerInput.includes('obligations') ||
               lowerInput.includes('processes') || lowerInput.includes('controls') ||
               lowerInput.includes('compliance') || lowerInput.includes('bribery') ||
               lowerInput.includes('crime') || lowerInput.includes('cosmos')) {
        let label = 'BusinessRules';
        if (lowerInput.includes('obligations')) label = 'Obligations';
        else if (lowerInput.includes('processes')) label = 'Processes';
        else if (lowerInput.includes('controls')) label = 'Controls';
        else if (lowerInput.includes('bribery')) label = 'Bribery';
        else if (lowerInput.includes('crime')) label = 'Crime';
        toolCall = { name: 'cosmosdb_query_regulatory_policies', arguments: { label } };
      }
      // List policy categories
      else if (lowerInput.includes('list') && (lowerInput.includes('policy') || lowerInput.includes('categories'))) {
        toolCall = { name: 'cosmosdb_list_policy_categories', arguments: {} };
      }
      // Search policies
      else if (lowerInput.includes('search') && (lowerInput.includes('policy') || lowerInput.includes('policies'))) {
        const searchTerm = lowerInput.split(' ').pop() || 'compliance';
        toolCall = { name: 'cosmosdb_search_policies', arguments: { search_term: searchTerm } };
      }
      // System health
      else if (lowerInput.includes('health') || lowerInput.includes('system')) {
        toolCall = { name: 'check_system_health', arguments: {} };
      }
      // Calculator
      else if (lowerInput.includes('calculate') || /\d+\s*[\+\-\*\/×÷]\s*\d+/.test(lowerInput)) {
        const match = input.match(/(\d+\.?\d*)\s*([\+\-\*\/×÷]|times|plus|minus|divided by)\s*(\d+\.?\d*)/i);
        if (match) {
          const a = parseFloat(match[1]);
          const b = parseFloat(match[3]);
          let op = match[2].toLowerCase();
          if (op === '+' || op === 'plus') op = 'add';
          else if (op === '-' || op === 'minus') op = 'subtract';
          else if (op === '*' || op === '×' || op === 'times') op = 'multiply';
          else if (op === '/' || op === '÷' || op === 'divided by') op = 'divide';
          toolCall = { name: 'calculate', arguments: { a, b, operation: op } };
        }
      }
      // Greeting
      else if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput.includes('greet')) {
        const nameMatch = input.match(/(?:my name is|i'm|i am|call me)\s+(\w+)/i);
        const name = nameMatch ? nameMatch[1] : 'there';
        toolCall = { name: 'greet_user', arguments: { name } };
      }

      if (toolCall) {
        const result = await runTool(toolCall.name, toolCall.arguments);
        toolCall.result = result;
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result,
          toolCalls: [toolCall as ToolCall],
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I can help you with:

🧭 Interactive Wizards:
• "Start risk assessment" — 5-step interactive UI wizard

📊 Financial Dashboards:
• "Show me KPMG quarterly summary"
• "Show me client engagement summary"

🔗 Knowledge Graphs (DEMO):
• "Show me cloud security"
• "Show me audit methodology"

🏛️ Regulatory Policies (LIVE from Cosmos DB):
• "Show me regulatory BusinessRules"
• "Show me policies about Bribery"

⚙️ Other Tools:
• "What's the system health?"
• "Calculate 42 × 17"
• "Hello, my name is Sanchay"`,
          timestamp: new Date(),
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MCP Apps Chat</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {isConnected ? (
                  <><span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2" />Connected • {availableTools.length} tools available</>
                ) : (
                  <><span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />Disconnected</>
                )}
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Demo</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3'
                    : message.role === 'system'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-amber-900 dark:text-amber-100 text-sm'
                    : 'bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md w-full'
                }`}
              >
                {message.role === 'assistant' && message.content === '…' ? (
                  <div className="flex items-center space-x-2 py-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                ) : message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0 ? (
                  <>
                    <div className="mb-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      🔧 Called tool: {message.toolCalls[0].name}
                      {message.loadingAction && (
                        <span className="ml-2 text-blue-500 animate-pulse">Processing…</span>
                      )}
                    </div>
                    <ComponentDispatcher
                      content={message.content}
                      onAction={(a) => handleInteractiveAction(a, message.id)}
                      cardDisabled={message.cardDisabled}
                      onStartOver={handleStartOver}
                    />
                  </>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                )}

                <div className={`mt-2 text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.content !== '…' && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white dark:bg-slate-800 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConnected ? "Ask me anything… or click a suggestion below" : "Connecting to MCP server…"}
              disabled={!isConnected || isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {/* Wizard — highlighted */}
            <button
              onClick={() => setInput('Start risk assessment')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:opacity-50 font-semibold"
            >
              🧭 Risk Assessment
            </button>
            {/* Financial */}
            <button
              onClick={() => setInput('Show me KPMG quarterly summary')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/40 transition disabled:opacity-50 font-medium"
            >
              📊 KPMG Financial
            </button>
            <button
              onClick={() => setInput('Show me client engagement summary')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/40 transition disabled:opacity-50 font-medium"
            >
              📊 Client Engagement
            </button>
            <button
              onClick={() => setInput('Show me the cloud security knowledge graph')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 transition disabled:opacity-50"
            >
              🔗 Cloud Security
            </button>
            <button
              onClick={() => setInput('Show me audit methodology')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 transition disabled:opacity-50"
            >
              🔗 Audit
            </button>
            <button
              onClick={() => setInput('Calculate 42 × 17')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              Calculator
            </button>
            <button
              onClick={() => setInput("What's the system health?")}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              System Health
            </button>
            <button
              onClick={() => setInput('Show me regulatory BusinessRules')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition disabled:opacity-50 font-medium"
            >
              🏛️ Business Rules (Live)
            </button>
            <button
              onClick={() => setInput('Show me regulatory Obligations')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition disabled:opacity-50 font-medium"
            >
              📋 Obligations (Live)
            </button>
            <button
              onClick={() => setInput('Show me policies about Bribery')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/40 transition disabled:opacity-50 font-medium"
            >
              🔍 Search: Bribery (Live)
            </button>
            <button
              onClick={() => setInput('List policy categories')}
              disabled={!isConnected || isLoading}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              📚 List Categories (Live)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
