const { fetchJson } = require('./network');
const { readJson, writeJsonAtomic } = require('./json-file');

const DEFAULT_CATALOG_URL = 'http://localhost:4178/api/public/catalog.json';

class CatalogService {
  constructor({ settingsPath, cachePath }) {
    this.settingsPath = settingsPath;
    this.cachePath = cachePath;
  }

  async getSettings() {
    return readJson(this.settingsPath, {
      catalogUrl: DEFAULT_CATALOG_URL,
      updateChannel: 'stable'
    });
  }

  async saveSettings(settings) {
    const normalized = {
      catalogUrl: String(settings.catalogUrl || DEFAULT_CATALOG_URL).trim(),
      updateChannel: settings.updateChannel === 'preview' ? 'preview' : 'stable'
    };
    new URL(normalized.catalogUrl);
    await writeJsonAtomic(this.settingsPath, normalized);
    return normalized;
  }

  validateCatalog(catalog) {
    if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.games) || !Array.isArray(catalog.news)) {
      throw new Error('Katalog biçimi desteklenmiyor.');
    }
    return catalog;
  }

  async load({ force = false } = {}) {
    const settings = await this.getSettings();
    try {
      const catalog = this.validateCatalog(await fetchJson(settings.catalogUrl, {
        timeoutMs: force ? 30000 : 15000,
        headers: { 'Cache-Control': force ? 'no-cache' : 'max-age=60' }
      }));
      await writeJsonAtomic(this.cachePath, catalog);
      return { catalog, source: 'remote', settings };
    } catch (error) {
      const cached = await readJson(this.cachePath, null);
      if (cached) return { catalog: this.validateCatalog(cached), source: 'cache', warning: error.message, settings };
      return {
        catalog: {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          brand: { name: 'Odium Stüdyo', website: 'https://odiumtr.com', accent: '#d93b4a' },
          games: [],
          news: []
        },
        source: 'empty',
        warning: error.message,
        settings
      };
    }
  }
}

module.exports = { CatalogService, DEFAULT_CATALOG_URL };
