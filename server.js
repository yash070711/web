import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const STATIC = { '/theme/': path.join(ROOT, 'theme'), '/': path.join(ROOT, 'src') };
const DB_DIR = path.join(ROOT, 'database');

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const readBody = async (req) => {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
};

const dbFile = (name) => path.join(DB_DIR, `${name}.json`);
const load = async (name) => JSON.parse(await fs.readFile(dbFile(name), 'utf8'));
const save = (name, rows) => fs.writeFile(dbFile(name), JSON.stringify(rows, null, 2) + '\n');

async function handleApi(req, res, parts) {
  const [collection, id] = parts;
  if (!/^[a-z0-9_-]+$/i.test(collection || '')) return send(res, 400, { error: 'Invalid collection' });
  let rows;
  try {
    rows = await load(collection);
  } catch {
    return send(res, 404, { error: 'Unknown collection' });
  }
  const idx = id ? rows.findIndex((r) => r.id === id) : -1;

  if (req.method === 'GET') {
    if (!id) return send(res, 200, rows);
    return idx < 0 ? send(res, 404, { error: 'Not found' }) : send(res, 200, rows[idx]);
  }
  if (req.method === 'POST' && !id) {
    const row = { ...(await readBody(req)), id: randomUUID() };
    rows.push(row);
    await save(collection, rows);
    return send(res, 201, row);
  }
  if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
    if (idx < 0) return send(res, 404, { error: 'Not found' });
    rows[idx] = { ...rows[idx], ...(await readBody(req)), id };
    await save(collection, rows);
    return send(res, 200, rows[idx]);
  }
  if (req.method === 'DELETE' && id) {
    if (idx < 0) return send(res, 404, { error: 'Not found' });
    const [removed] = rows.splice(idx, 1);
    await save(collection, rows);
    return send(res, 200, removed);
  }
  send(res, 405, { error: 'Method not allowed' });
}

async function handleStatic(res, pathname) {
  const [prefix, dir] = Object.entries(STATIC).find(([p]) => pathname.startsWith(p));
  let file = path.join(dir, pathname.slice(prefix.length));
  if (!file.startsWith(dir)) return send(res, 403, 'Forbidden', 'text/plain');
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, pathname.slice(5).split('/').filter(Boolean).map(decodeURIComponent));
    }
    await handleStatic(res, decodeURIComponent(pathname));
  } catch (err) {
    send(res, 500, { error: err.message });
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
