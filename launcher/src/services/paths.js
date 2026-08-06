const path = require('node:path');

function normalizeRelativePath(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Dosya yolu boş olamaz.');
  }

  const raw = input.trim().replaceAll('\\', '/');
  if (raw.startsWith('/') || raw.startsWith('//') || /^[a-zA-Z]:/.test(raw)) {
    throw new Error(`Mutlak dosya yolu kullanılamaz: ${input}`);
  }
  const value = raw;
  const normalized = path.posix.normalize(value);

  if (
    normalized === '.' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    path.posix.isAbsolute(normalized) ||
    /^[a-zA-Z]:/.test(normalized)
  ) {
    throw new Error(`Güvensiz göreli yol: ${input}`);
  }

  return normalized;
}

function resolveInside(root, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const rootPath = path.resolve(root);
  const target = path.resolve(rootPath, ...normalized.split('/'));
  const relative = path.relative(rootPath, target);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Hedef klasör dışına çıkıyor: ${relativePath}`);
  }

  return target;
}

function joinUrl(baseUrl, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const encoded = normalized.split('/').map(encodeURIComponent).join('/');
  return new URL(encoded, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

module.exports = { normalizeRelativePath, resolveInside, joinUrl };
