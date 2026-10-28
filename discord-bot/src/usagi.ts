import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

async function callUsagiTool(name: string, args: Record<string, unknown>, field: string) {
  const client = new Client({ name: 'discord-usagi-bot', version: '0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(process.env.USAGI_MCP_URL ?? 'http://127.0.0.1:3000/mcp')));
    const result = await client.callTool({ name, arguments: args });
    const structured: unknown = result.structuredContent;
    const value = structured && typeof structured === 'object' && field in structured ? (structured as Record<string, unknown>)[field] : undefined;
    if (result.isError || typeof value !== 'string') throw new Error(`Usagi MCP returned no ${field}`);
    return value;
  } finally {
    await client.close();
  }
}

export const translateWithMcp = (text: string) => callUsagiTool('translate_to_usagi', { text }, 'translated');
export const replyWithMcp = (text: string) => callUsagiTool('generate_usagi_reply', { text }, 'expression');
