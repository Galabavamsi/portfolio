// Static file server for local testing (no dependencies).
//   node experiments/02-wave-field/tools/serve.mjs [port] [root]
// Serves the repository root by default so ../../ links (resume, blog) resolve,
// with correct MIME types for ES modules (python -m http.server on Windows can
// serve .js as text/plain, which browsers refuse to run as a module).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 8765);
const root = path.resolve(process.argv[3] || path.join(here, '..', '..', '..'));
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream',
  '.exr': 'application/octet-stream', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = fs.readFileSync(file);
    res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}/`));
