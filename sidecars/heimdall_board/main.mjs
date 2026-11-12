import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4040;

const boardHtmlPath = path.resolve(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/swarm') {
    if (fs.existsSync(boardHtmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(boardHtmlPath, 'utf-8'));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Dashboard board HTML not found.');
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    const assetPath = path.resolve(__dirname, '..', '..', url.pathname.slice(1));
    const localAssetPath = path.resolve(__dirname, url.pathname.slice(1));
    const targetAsset = fs.existsSync(assetPath) ? assetPath : (fs.existsSync(localAssetPath) ? localAssetPath : null);
    if (targetAsset) {
      const ext = path.extname(targetAsset).toLowerCase();
      const mime = ext === '.svg' ? 'image/svg+xml' : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(fs.readFileSync(targetAsset));
      return;
    }
  }

  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ONLINE', plugin: 'heimdall', version: '2.0.0' }));
    return;
  }

  if (url.pathname === '/api/run-trajectory') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'SUCCESS', strategy: 'TRAJECTORY_CACHE_FASTPATH', durationMs: 0.8 }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[+] Heimdall Swarm Sidecar listening on http://127.0.0.1:${PORT}`);
});
