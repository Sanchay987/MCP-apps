import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:3001/sse';

export async function POST(req: NextRequest) {
  try {
    const { tool, args } = await req.json();
    if (!tool) return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });

    const transport = new SSEClientTransport(new URL(MCP_SERVER_URL));
    const client = new Client({ name: 'mcp-api-route', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    const response = await client.callTool({ name: tool, arguments: args ?? {} });
    await client.close();

    const text = Array.isArray(response.content)
      ? response.content.filter((i: any) => i.type === 'text').map((i: any) => i.text).join('\n')
      : JSON.stringify(response);

    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Tool call failed' }, { status: 500 });
  }
}
