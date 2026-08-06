const path = require('node:path');
const fs = require('node:fs/promises');
const { detectInstalledGame } = require('./platform/platform-detector');

class GameCoordinator {
  constructor({ catalogService, manifestService, patchService }) {
    this.catalogService = catalogService;
    this.manifestService = manifestService;
    this.patchService = patchService;
    this.catalog = null;
    this.catalogMeta = null;
    this.runtime = new Map();
  }

  async refresh({ force = false } = {}) {
    const result = await this.catalogService.load({ force });
    this.catalog = result.catalog;
    this.catalogMeta = { source: result.source, warning: result.warning || null, settings: result.settings };
    this.runtime.clear();

    const enabledGames = this.catalog.games.filter(game => game.enabled !== false);
    await Promise.all(enabledGames.map(async game => {
      const install = await detectInstalledGame(game);
      let manifest = null;
      let analysis = null;
      let error = null;
      if (install && game.release?.manifestUrl) {
        try {
          manifest = await this.manifestService.load(game);
          analysis = await this.patchService.analyze(game, install, manifest);
        } catch (caught) {
          error = caught.message;
        }
      }
      this.runtime.set(game.id, { install, manifest, analysis, error });
    }));

    return this.snapshot();
  }

  snapshot() {
    const catalog = this.catalog || {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      brand: { name: 'Odium Stüdyo', website: 'https://odiumtr.com' },
      games: [],
      news: []
    };
    return {
      catalog: {
        ...catalog,
        games: catalog.games.filter(game => game.enabled !== false).map(game => ({
          ...game,
          runtime: this.runtime.get(game.id) || { install: null, manifest: null, analysis: null, error: null }
        }))
      },
      meta: this.catalogMeta
    };
  }

  requireGame(gameId, { requireManifest = true } = {}) {
    const game = this.catalog?.games?.find(item => item.id === gameId && item.enabled !== false);
    if (!game) throw new Error('Oyun katalogda bulunamadı.');
    const runtime = this.runtime.get(gameId);
    if (!runtime?.install) throw new Error('Resmî Steam/Epic kurulumu bulunamadı.');
    if (requireManifest && !runtime.manifest) throw new Error(runtime?.error || 'Dublaj manifesti alınamadı.');
    return { game, runtime };
  }

  async install(gameId, onEvent) {
    const { game, runtime } = this.requireGame(gameId);
    const state = await this.patchService.install(
      game,
      runtime.install,
      runtime.manifest,
      runtime.analysis || await this.patchService.analyze(game, runtime.install, runtime.manifest),
      onEvent
    );
    runtime.analysis = await this.patchService.analyze(game, runtime.install, runtime.manifest);
    return { state, snapshot: this.snapshot() };
  }

  async uninstall(gameId, onEvent) {
    const { game, runtime } = this.requireGame(gameId);
    const result = await this.patchService.uninstall(game, runtime.install, onEvent);
    runtime.analysis = await this.patchService.analyze(game, runtime.install, runtime.manifest);
    return { result, snapshot: this.snapshot() };
  }

  async locateExecutable(gameId) {
    const { game, runtime } = this.requireGame(gameId, { requireManifest: false });
    const configured = runtime.install.platform === 'steam'
      ? game.platforms?.steam?.executable
      : game.platforms?.epic?.executable;
    if (configured) {
      const executable = path.resolve(runtime.install.installPath, configured);
      try {
        await fs.access(executable);
        return executable;
      } catch {
        // Continue with platform URI fallback.
      }
    }
    return null;
  }
}

module.exports = { GameCoordinator };
