import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const appDir = dirname(fileURLToPath(import.meta.url));
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/images/usagi.png', ['images/usagi.png', 'image/png']],
  ['/images/rabbit-ears.svg', ['images/rabbit-ears.svg', 'image/svg+xml']],
  ['/images/favicon.svg', ['images/favicon.svg', 'image/svg+xml']],
  ['/fonts/PretendardVariable.woff2', ['fonts/PretendardVariable.woff2', 'font/woff2']],
]);

createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const asset = path === '/dictionary.json' || path === '/repeated-sounds.json'
    ? [join(appDir, '..', path.slice(1)), 'application/json; charset=utf-8']
    : files.get(path);
  if (!asset || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(path === '/dictionary.json' || path === '/repeated-sounds.json' ? asset[0] : join(appDir, asset[0]));
    res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(4173, '127.0.0.1', () => console.log('Usagi app: http://127.0.0.1:4173/'));
