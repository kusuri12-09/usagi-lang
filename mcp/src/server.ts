import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { randomUsagi, reaction, replyToUsagi, translate } from './core.js';

function result(value: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], structuredContent: value };
}

export function createServer() {
  const server = new McpServer({ name: 'usagi-mcp', version: '0.1.0' });

  server.registerTool('translate_to_usagi', {
    description: 'Express a Korean sentence with a known Usagi expression or a generated fallback. matched=false identifies the fallback.',
    inputSchema: z.object({ text: z.string().refine(value => value.trim().length > 0, 'Text cannot be blank') }),
  }, async ({ text }) => result(translate(text)));

  server.registerTool('generate_usagi_reaction', {
    description: 'Pick a known Usagi expression for a situation tag or emotion, or generate a fallback. matched=false identifies the fallback.',
    inputSchema: z.object({
      situation: z.string().trim().min(1).optional(),
      emotion: z.enum(['happy', 'excited', 'surprised', 'confident', 'sad', 'angry', 'neutral']).optional(),
    }).refine(({ situation, emotion }) => Boolean(situation) !== Boolean(emotion), 'Provide either situation or emotion'),
  }, async ({ situation, emotion }) => result(reaction(situation ?? emotion!)));

  server.registerTool('generate_random_usagi', {
    description: 'Generate a playful new Usagi-like exclamation with no dictionary meaning.',
    inputSchema: z.object({}),
  }, async () => result(randomUsagi()));

  server.registerTool('generate_usagi_reply', {
    description: 'Reply with the same known sound for selected Usagi expressions, otherwise generate a random reply.',
    inputSchema: z.object({ text: z.string() }),
  }, async ({ text }) => result({ expression: replyToUsagi(text) }));

  return server;
}
