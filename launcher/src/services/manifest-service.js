const { fetchJson } = require('./network');
const { normalizeRelativePath } = require('./paths');

class ManifestService {
  validate(manifest, gameId = null) {
    if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) {
      throw new Error('Sürüm manifesti desteklenmiyor.');
    }
    if (gameId && manifest.gameId !== gameId) {
      throw new Error(`Manifest oyun kimliği uyuşmuyor: ${manifest.gameId}`);
    }

    const seen = new Set();
    manifest.files = manifest.files.map(file => {
      const normalizedPath = normalizeRelativePath(file.path);
      if (seen.has(normalizedPath.toLowerCase())) throw new Error(`Manifestte yinelenen dosya: ${normalizedPath}`);
      seen.add(normalizedPath.toLowerCase());
      if (!Number.isInteger(file.size) || file.size < 0) throw new Error(`Geçersiz dosya boyutu: ${normalizedPath}`);
      if (!/^[a-f0-9]{64}$/i.test(file.sha256 || '')) throw new Error(`Geçersiz SHA-256: ${normalizedPath}`);
      return {
        ...file,
        path: normalizedPath,
        contentPath: normalizeRelativePath(file.contentPath || file.path),
        sha256: file.sha256.toLowerCase(),
        mode: file.mode === 'add' ? 'add' : 'replace'
      };
    });
    manifest.deletions = (manifest.deletions || []).map(normalizeRelativePath);
    return manifest;
  }

  async load(game) {
    if (!game.release?.manifestUrl) throw new Error('Bu oyun için yayınlanmış dublaj sürümü yok.');
    return this.validate(await fetchJson(game.release.manifestUrl, { timeoutMs: 30000 }), game.id);
  }
}

module.exports = { ManifestService };
