import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_DIR = path.join(ROOT, 'database');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

// ---- JSON "database" ----
const dbFile = (name) => {
  if (!/^[a-z0-9_-]+$/i.test(name)) return null;
  return path.join(DB_DIR, `${name}.json`);
};

async function readCollection(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

const writeCollection = (file, data) =>
  fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8'); // decode once so multi-byte characters can't be split across chunks
  return raw ? JSON.parse(raw) : {};
}

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': MIME['.json'] });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

// ---- API: /api/:collection[/:id] ----
async function handleApi(req, res, segments) {
  const [name, id] = segments;
  const file = name && dbFile(name);
  if (!file) return send(res, 404, { error: 'Unknown collection' });

  const items = await readCollection(file);
  if (!items) return send(res, 404, { error: 'Unknown collection' });

  const index = id ? items.findIndex((i) => String(i.id) === id) : -1;

  switch (req.method) {
    case 'GET':
      if (!id) return send(res, 200, items);
      return index < 0 ? send(res, 404, { error: 'Not found' }) : send(res, 200, items[index]);

    case 'POST': {
      const item = { ...(await readBody(req)), id: randomUUID() };
      items.push(item);
      await writeCollection(file, items);
      return send(res, 201, item);
    }

    case 'PUT':
    case 'PATCH': {
      if (index < 0) return send(res, 404, { error: 'Not found' });
      const body = await readBody(req);
      items[index] = req.method === 'PUT' ? { ...body, id: items[index].id } : { ...items[index], ...body, id: items[index].id };
      await writeCollection(file, items);
      return send(res, 200, items[index]);
    }

    case 'DELETE':
      if (index < 0) return send(res, 404, { error: 'Not found' });
      items.splice(index, 1);
      await writeCollection(file, items);
      return send(res, 204);

    default:
      return send(res, 405, { error: 'Method not allowed' });
  }
}

// ---- Static files ----
async function handleStatic(req, res, pathname) {
  const rel = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

http
  .createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname.startsWith('/api/')) {
        return await handleApi(req, res, pathname.slice(5).split('/').filter(Boolean));
      }
      await handleStatic(req, res, decodeURIComponent(pathname));
    } catch (e) {
      console.error(e);
      send(res, e instanceof SyntaxError ? 400 : 500, { error: e instanceof SyntaxError ? 'Invalid JSON' : 'Server error' });
    }
  })
  .listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
