import { createServer as createHttpServer } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createServer } from './server.js';

const port = Number(process.env.PORT ?? 3000);
const publicHost = process.env.PUBLIC_HOST;
const handler = toNodeHandler(createMcpHandler(createServer, { responseMode: 'json' }));

createHttpServer((req, res) => {
  const host = req.headers.host;
  const localHosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  const allowedHosts = publicHost ? [...localHosts, publicHost] : localHosts;
  const origin = req.headers.origin;
  if (req.url !== '/mcp' || !allowedHosts.includes(host ?? '') || (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`, `https://${publicHost}`].includes(origin))) {
    res.writeHead(403).end();
    return;
  }
  void handler(req, res);
}).listen(port, '127.0.0.1', () => {
  console.error(`Usagi MCP listening on http://127.0.0.1:${port}/mcp`);
});
