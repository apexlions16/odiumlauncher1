const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeJsonAtomic } = require('./storage');

async function sha256File(filePath) {
  const handle = await fs.open(filePath, 'r');
  const hash = crypto.createHash('sha256');
  try { for await (const chunk of handle.createReadStream()) hash.update(chunk); }
  finally { await handle.close().catch(() => {}); }
  return hash.digest('hex');
}
async function walk(directory, root = directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'manifest.json' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath, root));
    if (entry.isFile()) files.push({ fullPath, relativePath: path.relative(root, fullPath).replaceAll('\\', '/') });
  }
  return files;
}
async function buildManifest({ directory, gameId, version }) {
  const sourceFiles = await walk(directory); const files = [];
  for (const source of sourceFiles) {
    const stat = await fs.stat(source.fullPath);
    files.push({ path: source.relativePath, contentPath: source.relativePath, size: stat.size, sha256: await sha256File(source.fullPath), mode: 'replace' });
  }
  files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const manifest = { schemaVersion: 1, gameId, version, generatedAt: new Date().toISOString(), files, deletions: [] };
  await writeJsonAtomic(path.join(directory, 'manifest.json'), manifest);
  return manifest;
}
module.exports = { sha256File, walk, buildManifest };
