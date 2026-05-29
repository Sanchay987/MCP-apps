import { NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER = process.env.MCP_SERVER_URL ?? 'http://localhost:3002';

export async function GET() {
  const transport = new SSEClientTransport(new URL(`${MCP_SERVER}/sse`));
  const client = new Client(
    { name: 'newmethod-api', version: '1.0.0' },
    { capabilities: {} },
  );
  try {
    await client.connect(transport);
    const response = await client.listTools();
    const tools = response.tools.map((t: any) => ({
      name:        t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema ?? {},
      resourceUri: t.inputSchema?.['x-ui-resource-uri'] as string | undefined,
    }));
    return NextResponse.json({ tools });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    await client.close().catch(() => {});
  }
}
