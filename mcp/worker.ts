import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './src/server.js';

const handler = createMcpHandler(createServer, { responseMode: 'json' });

export default {
  fetch(request: Request) {
    if (new URL(request.url).pathname !== '/mcp') return new Response('Not found', { status: 404 });
    return handler.fetch(request);
  },
};
