/**
 * Servidor web de FinBot: sirve la interfaz de chat y expone POST /api/chat.
 * El mismo núcleo conversacional que Telegram, ahora en el navegador.
 *   npm run web
 */
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createStore } from './store.js';
import { FinBot } from './finbot.js';

// Carga .env sin dependencias (las variables ya definidas tienen prioridad).
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {
  // Sin .env: se usan las variables del entorno.
}

const PUBLIC_DIR = join(process.cwd(), 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const MAX_BODY = 4 * 1024; // los mensajes de chat son cortos

const finbot = new FinBot(createStore());

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('payload demasiado grande'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    try {
      const { userId, text } = JSON.parse(await readBody(req));
      if (typeof text !== 'string' || typeof userId !== 'string' || !userId.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'userId y text son obligatorios' }));
      }
      const reply = await finbot.handleMessage(userId.slice(0, 64), text.slice(0, 500));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ reply }));
    } catch (err) {
      console.error('Error en /api/chat:', err.message);
      res.writeHead(err.message.includes('grande') ? 413 : 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'No pude procesar tu mensaje, inténtalo de nuevo.' }));
    }
  }

  if (req.method === 'GET') {
    // Estáticos con protección contra path traversal.
    const safePath = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);
    if (filePath.startsWith(PUBLIC_DIR) && existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
      return res.end(readFileSync(filePath));
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'no encontrado' }));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => console.log(`💰 FinBot web en http://localhost:${PORT}`));
