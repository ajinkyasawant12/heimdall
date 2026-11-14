import fs from 'node:fs';
import path from 'node:path';

const srcPath = 'C:/Users/Ajinkya/Desktop/heimdall/packages/dashboard/src/server.ts';
const distPath = 'C:/Users/Ajinkya/Desktop/heimdall/packages/dashboard/dist/server.js';

let code = fs.readFileSync(srcPath, 'utf-8');
if (code.charCodeAt(0) === 0xFEFF) {
  code = code.slice(1);
}

// Strip TypeScript annotations
code = code.replace('import { createServer, IncomingMessage, ServerResponse } from "node:http";', 'import { createServer } from "node:http";');
code = code.replace('const sseClients: ServerResponse[] = [];', 'const sseClients = [];');
code = code.replace('function broadcastSSE(eventType: string, data: unknown) {', 'function broadcastSSE(eventType, data) {');
code = code.replace('function sleep(ms: number) {', 'function sleep(ms) {');
code = code.replace('const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {', 'const server = createServer(async (req, res) => {');
code = code.replace('server.on("error", (err: any) => {', 'server.on("error", (err) => {');

// Add asset serving before 404
const assetHandler = `
    if (url.pathname.startsWith("/assets/")) {
      const rel = url.pathname.replace("/assets/", "");
      const p1 = path.resolve(__dirname, "../../../assets", rel);
      const p2 = path.resolve(__dirname, "../../assets", rel);
      const target = fs.existsSync(p1) ? p1 : (fs.existsSync(p2) ? p2 : null);
      if (target) {
        const ext = path.extname(target).toLowerCase();
        const mime = ext === ".svg" ? "image/svg+xml" : (ext === ".jpg" || ext === ".jpeg") ? "image/jpeg" : "application/octet-stream";
        res.writeHead(200, { "Content-Type": mime });
        res.end(fs.readFileSync(target));
        return;
      }
    }
`;

code = code.replace('    if (url.pathname === "/theater") {', assetHandler + '\n    if (url.pathname === "/theater") {');

fs.writeFileSync(distPath, code, 'utf-8');
console.log('[+] Built clean packages/dashboard/dist/server.js');
