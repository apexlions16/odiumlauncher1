const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_CATALOG = {
  schemaVersion: 1,
  generatedAt: new Date(0).toISOString(),
  brand: { name: 'Odium Stüdyo', website: 'https://odiumtr.com', supportUrl: 'https://odiumtr.com', accent: '#d93b4a' },
  games: [],
  news: []
};

async function ensureDirectory(directory) { await fs.mkdir(directory, { recursive: true }); }
async function readJson(filePath, fallback) {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
async function writeJsonAtomic(filePath, value) {
  await ensureDirectory(path.dirname(filePath));
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(tempPath, filePath);
}
function sanitizeIdentifier(value, label = 'kimlik') {
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/i.test(value || '')) throw new Error(`Geçersiz ${label}: ${value}`);
  return value.toLowerCase();
}
function safePath(root, relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('\0')) throw new Error('Dosya yolu boş veya geçersiz.');
  const target = path.resolve(root, ...normalized.split('/'));
  const relative = path.relative(path.resolve(root), target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Dosya yolu hedef klasörün dışına çıkıyor.');
  return target;
}

class Storage {
  constructor(dataDirectory) {
    this.dataDirectory = path.resolve(dataDirectory);
    this.catalogPath = path.join(this.dataDirectory, 'catalog.json');
    this.assetsDirectory = path.join(this.dataDirectory, 'assets');
    this.releasesDirectory = path.join(this.dataDirectory, 'uploads', 'releases');
  }
  async initialize() {
    await Promise.all([ensureDirectory(this.assetsDirectory), ensureDirectory(this.releasesDirectory)]);
    if (!(await readJson(this.catalogPath, null))) await this.saveCatalog(DEFAULT_CATALOG);
  }
  async getCatalog() { return readJson(this.catalogPath, DEFAULT_CATALOG); }
  async saveCatalog(catalog) {
    const value = { ...catalog, schemaVersion: 1, generatedAt: new Date().toISOString(), brand: { ...DEFAULT_CATALOG.brand, ...(catalog.brand || {}) }, games: Array.isArray(catalog.games) ? catalog.games : [], news: Array.isArray(catalog.news) ? catalog.news : [] };
    await writeJsonAtomic(this.catalogPath, value); return value;
  }
  releaseDirectoryRaw(gameId, version) {
    sanitizeIdentifier(gameId, 'oyun kimliği');
    if (!/^[0-9A-Za-z._-]{1,64}$/.test(version || '')) throw new Error('Geçersiz sürüm.');
    return path.join(this.releasesDirectory, gameId, version);
  }
  assetPath(name) {
    const safeName = String(name || '').replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!safeName || safeName.startsWith('.')) throw new Error('Geçersiz varlık adı.');
    return path.join(this.assetsDirectory, safeName);
  }
  releaseFilePath(gameId, version, relativePath) { return safePath(this.releaseDirectoryRaw(gameId, version), relativePath); }
}

module.exports = { Storage, DEFAULT_CATALOG, safePath, sanitizeIdentifier, writeJsonAtomic };
