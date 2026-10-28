import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './src/server.js';
import discordBot, { DiscordGateway } from '../discord-bot/worker.mjs';

export { DiscordGateway };

const handler = createMcpHandler(createServer, { responseMode: 'json' });

export default {
  fetch(request: Request, env: unknown) {
    if (new URL(request.url).pathname === '/mcp') return handler.fetch(request);
    return discordBot.fetch(request, env);
  },
  scheduled: discordBot.scheduled,
};
