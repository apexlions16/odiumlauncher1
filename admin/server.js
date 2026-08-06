const http = require('node:http');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const crypto = require('node:crypto');
const { Storage, sanitizeIdentifier } = require('./src/storage');
const { buildManifest } = require('./src/manifest-builder');

const host = process.env.ODIUM_ADMIN_HOST || '0.0.0.0';
const port = Number(process.env.ODIUM_ADMIN_PORT || 4178);
const adminToken = process.env.ODIUM_ADMIN_TOKEN || 'development-only-change-me';
const corsOrigin = process.env.ODIUM_CORS_ORIGIN || '*';
const dataDirectory = process.env.ODIUM_DATA_DIR || path.join(__dirname, 'data');
const publicBaseUrl = (process.env.ODIUM_PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
const publicDirectory = path.join(__dirname, 'public');
const storage = new Storage(dataDirectory);

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.zip': 'application/zip',
  '.pak': 'application/octet-stream', '.ucas': 'application/octet-stream', '.utoc': 'application/octet-stream'
};

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Path',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS', ...extra
  };
}
function sendJson(response, status, value) {
  response.writeHead(status, securityHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }));
  response.end(`${JSON.stringify(value)}\n`);
}
function sendError(response, status, error) { sendJson(response, status, { ok: false, error: error instanceof Error ? error.message : String(error) }); }
function isAdmin(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  const left = Buffer.from(token); const right = Buffer.from(adminToken);
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}
async function readJsonBody(request, maxBytes = 2 * 1024 * 1024) {
  const chunks = []; let bytes = 0;
  for await (const chunk of request) { bytes += chunk.length; if (bytes > maxBytes) throw new Error('İstek gövdesi çok büyük.'); chunks.push(chunk); }
  const text = Buffer.concat(chunks).toString('utf8'); return text ? JSON.parse(text) : {};
}
async function streamFile(response, filePath, cacheControl = 'public, max-age=300') {
  const stat = await fsPromises.stat(filePath);
  if (!stat.isFile()) throw Object.assign(new Error('Dosya bulunamadı.'), { status: 404 });
  response.writeHead(200, securityHeaders({ 'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': cacheControl }));
  await pipeline(fs.createReadStream(filePath), response);
}
function safePublicPath(root, requestPath) {
  const target = path.resolve(root, `.${requestPath}`); const relative = path.relative(path.resolve(root), target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Object.assign(new Error('Geçersiz yol.'), { status: 400 });
  return target;
}
async function saveRequestBody(request, destination) {
  await fsPromises.mkdir(path.dirname(destination), { recursive: true });
  const temp = `${destination}.${crypto.randomUUID()}.tmp`;
  try { await pipeline(request, fs.createWriteStream(temp, { flags: 'w' })); await fsPromises.rename(temp, destination); }
  catch (error) { await fsPromises.rm(temp, { force: true }).catch(() => {}); throw error; }
}

async function handlePublic(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/public/catalog.json') { sendJson(response, 200, await storage.getCatalog()); return true; }
  if (request.method === 'GET' && url.pathname === '/api/health') { sendJson(response, 200, { ok: true, service: 'odium-publisher', time: new Date().toISOString() }); return true; }
  if (request.method === 'GET' && url.pathname.startsWith('/assets/')) { await streamFile(response, safePublicPath(storage.assetsDirectory, url.pathname.slice('/assets'.length)), 'public, max-age=86400, immutable'); return true; }
  if (request.method === 'GET' && url.pathname.startsWith('/downloads/')) { await streamFile(response, safePublicPath(storage.releasesDirectory, url.pathname.slice('/downloads'.length)), 'public, max-age=3600'); return true; }
  return false;
}

async function handleAdmin(request, response, url) {
  if (!url.pathname.startsWith('/api/admin/')) return false;
  if (!isAdmin(request)) { sendError(response, 401, 'Admin anahtarı geçersiz.'); return true; }
  if (request.method === 'GET' && url.pathname === '/api/admin/catalog') { sendJson(response, 200, { ok: true, catalog: await storage.getCatalog(), publicBaseUrl }); return true; }
  if (request.method === 'PUT' && url.pathname === '/api/admin/catalog') { const body = await readJsonBody(request); sendJson(response, 200, { ok: true, catalog: await storage.saveCatalog(body.catalog || body) }); return true; }
  if (request.method === 'PUT' && url.pathname === '/api/admin/assets') {
    const destination = storage.assetPath(url.searchParams.get('name')); await saveRequestBody(request, destination);
    sendJson(response, 201, { ok: true, url: `${publicBaseUrl}/assets/${encodeURIComponent(path.basename(destination))}` }); return true;
  }
  const releaseFileMatch = url.pathname.match(/^\/api\/admin\/releases\/([^/]+)\/([^/]+)\/file$/);
  if (request.method === 'PUT' && releaseFileMatch) {
    const gameId = sanitizeIdentifier(decodeURIComponent(releaseFileMatch[1]), 'oyun kimliği');
    const version = decodeURIComponent(releaseFileMatch[2]);
    const relativePath = url.searchParams.get('path') || request.headers['x-file-path'];
    await saveRequestBody(request, storage.releaseFilePath(gameId, version, relativePath));
    sendJson(response, 201, { ok: true, path: relativePath }); return true;
  }
  const publishMatch = url.pathname.match(/^\/api\/admin\/releases\/([^/]+)\/([^/]+)\/publish$/);
  if (request.method === 'POST' && publishMatch) {
    const gameId = sanitizeIdentifier(decodeURIComponent(publishMatch[1]), 'oyun kimliği');
    const version = decodeURIComponent(publishMatch[2]); const body = await readJsonBody(request);
    const manifest = await buildManifest({ directory: storage.releaseDirectoryRaw(gameId, version), gameId, version });
    const catalog = await storage.getCatalog(); const gameIndex = catalog.games.findIndex(game => game.id === gameId);
    if (gameIndex < 0) throw Object.assign(new Error('Önce katalogda oyun kaydı oluşturun.'), { status: 404 });
    const totalSize = manifest.files.reduce((sum, file) => sum + file.size, 0);
    catalog.games[gameIndex] = { ...catalog.games[gameIndex], release: {
      version, publishedAt: body.publishedAt || new Date().toISOString(),
      manifestUrl: `${publicBaseUrl}/downloads/${encodeURIComponent(gameId)}/${encodeURIComponent(version)}/manifest.json`,
      primaryBaseUrl: body.primaryBaseUrl || `${publicBaseUrl}/downloads/${encodeURIComponent(gameId)}/${encodeURIComponent(version)}/`,
      fallbackBaseUrl: body.fallbackBaseUrl || null, changelog: body.changelog || '', size: totalSize
    }};
    const saved = await storage.saveCatalog(catalog);
    sendJson(response, 200, { ok: true, manifest, release: saved.games[gameIndex].release, catalog: saved }); return true;
  }
  const deleteReleaseMatch = url.pathname.match(/^\/api\/admin\/releases\/([^/]+)\/([^/]+)$/);
  if (request.method === 'DELETE' && deleteReleaseMatch) {
    const gameId = sanitizeIdentifier(decodeURIComponent(deleteReleaseMatch[1]), 'oyun kimliği');
    await fsPromises.rm(storage.releaseDirectoryRaw(gameId, decodeURIComponent(deleteReleaseMatch[2])), { recursive: true, force: true });
    sendJson(response, 200, { ok: true }); return true;
  }
  sendError(response, 404, 'Admin uç noktası bulunamadı.'); return true;
}

async function handleStatic(request, response, url) {
  if (request.method !== 'GET') return false;
  const filePath = safePublicPath(publicDirectory, url.pathname === '/' ? '/index.html' : url.pathname);
  try { await streamFile(response, filePath, 'no-cache'); }
  catch (error) { if (error.code === 'ENOENT' || error.status === 404) return false; throw error; }
  return true;
}
async function handler(request, response) {
  if (request.method === 'OPTIONS') { response.writeHead(204, securityHeaders()); response.end(); return; }
  const url = new URL(request.url, publicBaseUrl);
  try {
    if (await handlePublic(request, response, url)) return;
    if (await handleAdmin(request, response, url)) return;
    if (await handleStatic(request, response, url)) return;
    sendError(response, 404, 'Sayfa bulunamadı.');
  } catch (error) {
    console.error(error); if (!response.headersSent) sendError(response, error.status || 500, error); else response.destroy(error);
  }
}

storage.initialize().then(() => {
  http.createServer(handler).listen(port, host, () => {
    console.log(`Odium admin/yayın sunucusu: ${publicBaseUrl}`);
    if (adminToken === 'development-only-change-me') console.warn('UYARI: ODIUM_ADMIN_TOKEN varsayılan geliştirme değerinde. Üretimde mutlaka değiştirin.');
  });
}).catch(error => { console.error('Sunucu başlatılamadı:', error); process.exitCode = 1; });
