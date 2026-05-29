import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER = process.env.MCP_SERVER_URL ?? 'http://localhost:3002';

export async function POST(req: NextRequest) {
  const { name, args } = await req.json();

  const transport = new SSEClientTransport(new URL(`${MCP_SERVER}/sse`));
  const client = new Client(
    { name: 'newmethod-api', version: '1.0.0' },
    { capabilities: {} },
  );
  try {
    await client.connect(transport);
    const response = await client.callTool({ name, arguments: args });
    let result = '';
    if (response.content && Array.isArray(response.content)) {
      result = response.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text as string)
        .join('\n');
    } else {
      result = JSON.stringify(response);
    }
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Tool call failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    await client.close().catch(() => {});
  }
}
