const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { inspectFile } = require('./hash-service');
const { downloadFile } = require('./network');
const { resolveInside, joinUrl } = require('./paths');

class PatchService {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
  }

  async analyze(game, install, manifest) {
    const state = await this.stateStore.get(game.id);
    const files = [];
    let matching = 0;

    for (const entry of manifest.files) {
      const targetPath = resolveInside(install.installPath, entry.path);
      const inspection = await inspectFile(targetPath, entry);
      if (inspection.matches) matching += 1;
      files.push({ ...entry, targetPath, inspection });
    }

    const installedVersion = state?.version || null;
    let status = 'available';
    if (matching === manifest.files.length && manifest.files.length > 0) {
      status = installedVersion === manifest.version ? 'installed' : 'adopted';
    } else if (state && matching === 0) {
      status = 'removed-externally';
      await this.stateStore.clear(game.id, { keepBackups: true });
    } else if (state && installedVersion !== manifest.version) {
      status = 'update-available';
    } else if (state) {
      status = 'repair-required';
    }

    const pending = files.filter(file => !file.inspection.matches);
    return {
      status,
      installedVersion,
      availableVersion: manifest.version,
      totalFiles: files.length,
      matchingFiles: matching,
      pendingFiles: pending.length,
      pendingBytes: pending.reduce((sum, file) => sum + file.size, 0),
      files,
      state
    };
  }

  async ensureBackup(gameId, installRoot, entry, previousState) {
    const targetPath = resolveInside(installRoot, entry.path);
    const existingBackup = previousState?.files?.find(file => file.path === entry.path)?.backup;
    if (existingBackup) return existingBackup;

    try {
      const stat = await fs.stat(targetPath);
      if (!stat.isFile()) return { existed: false, path: null };
    } catch (error) {
      if (error.code === 'ENOENT') return { existed: false, path: null };
      throw error;
    }

    const backupPath = this.stateStore.backupPath(gameId, entry.path);
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    try {
      await fs.access(backupPath);
    } catch {
      await fs.copyFile(targetPath, backupPath);
    }
    return { existed: true, path: backupPath };
  }

  async downloadEntry(game, manifest, entry, stagingPath, onProgress) {
    const sources = [game.release.primaryBaseUrl, game.release.fallbackBaseUrl].filter(Boolean);
    if (!sources.length) throw new Error('İndirme kaynağı tanımlanmamış.');
    const failures = [];

    for (const baseUrl of sources) {
      const url = joinUrl(baseUrl, entry.contentPath);
      try {
        await downloadFile(url, stagingPath, { onProgress, timeoutMs: 120000 });
        const inspection = await inspectFile(stagingPath, entry);
        if (!inspection.matches) {
          throw new Error(`Hash doğrulaması başarısız (${inspection.reason}).`);
        }
        return { source: baseUrl, url };
      } catch (error) {
        failures.push(`${baseUrl}: ${error.message}`);
        await fs.rm(stagingPath, { force: true }).catch(() => {});
      }
    }

    throw new Error(`Dosya hiçbir kaynaktan indirilemedi: ${entry.path}\n${failures.join('\n')}`);
  }

  async install(game, install, manifest, analysis, onEvent = () => {}) {
    const previousState = await this.stateStore.get(game.id);
    const stagingRoot = this.stateStore.stagingRoot(game.id, manifest.version);
    await fs.rm(stagingRoot, { recursive: true, force: true });
    await fs.mkdir(stagingRoot, { recursive: true });

    const pending = analysis.files.filter(file => !file.inspection.matches);
    let completedBytes = 0;
    const totalBytes = pending.reduce((sum, file) => sum + file.size, 0);
    const prepared = [];

    for (let index = 0; index < pending.length; index += 1) {
      const entry = pending[index];
      const stagingPath = resolveInside(stagingRoot, entry.path);
      onEvent({ type: 'file-start', file: entry.path, index, count: pending.length, completedBytes, totalBytes });
      const source = await this.downloadEntry(game, manifest, entry, stagingPath, progress => {
        onEvent({
          type: 'download-progress',
          file: entry.path,
          received: progress.received,
          fileTotal: progress.total || entry.size,
          completedBytes,
          totalBytes
        });
      });
      completedBytes += entry.size;
      prepared.push({ entry, stagingPath, source });
      onEvent({ type: 'file-downloaded', file: entry.path, completedBytes, totalBytes });
    }

    const stateFiles = [];
    const pendingPaths = new Set(pending.map(file => file.path));
    for (const { entry, stagingPath, source } of prepared) {
      const targetPath = resolveInside(install.installPath, entry.path);
      const backup = await this.ensureBackup(game.id, install.installPath, entry, previousState);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const tempTarget = `${targetPath}.${crypto.randomUUID()}.odium-tmp`;
      await fs.copyFile(stagingPath, tempTarget);
      try {
        await fs.rm(targetPath, { force: true });
        await fs.rename(tempTarget, targetPath);
      } catch (error) {
        await fs.rm(tempTarget, { force: true }).catch(() => {});
        if (backup.existed && backup.path) {
          await fs.copyFile(backup.path, targetPath).catch(() => {});
        }
        throw error;
      }
      stateFiles.push({ path: entry.path, sha256: entry.sha256, size: entry.size, backup, source: source.source });
      onEvent({ type: 'file-installed', file: entry.path });
    }

    for (const entry of manifest.files.filter(file => !pendingPaths.has(file.path))) {
      const prior = previousState?.files?.find(file => file.path === entry.path);
      stateFiles.push({
        path: entry.path,
        sha256: entry.sha256,
        size: entry.size,
        backup: prior?.backup || { existed: false, path: null },
        source: prior?.source || 'already-present'
      });
    }

    const state = {
      schemaVersion: 1,
      gameId: game.id,
      title: game.title,
      version: manifest.version,
      installedAt: new Date().toISOString(),
      platform: install.platform,
      installPath: install.installPath,
      files: stateFiles
    };
    await this.stateStore.save(game.id, state);
    await fs.rm(stagingRoot, { recursive: true, force: true });
    onEvent({ type: 'complete', state });
    return state;
  }

  async uninstall(game, install, onEvent = () => {}) {
    const state = await this.stateStore.get(game.id);
    if (!state) return { restored: 0, deleted: 0 };
    let restored = 0;
    let deleted = 0;

    for (const file of state.files || []) {
      const targetPath = resolveInside(install.installPath, file.path);
      if (file.backup?.existed && file.backup.path) {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.copyFile(file.backup.path, targetPath);
        restored += 1;
      } else {
        await fs.rm(targetPath, { force: true });
        deleted += 1;
      }
      onEvent({ type: 'file-restored', file: file.path, restored, deleted });
    }

    await this.stateStore.clear(game.id, { keepBackups: false });
    return { restored, deleted };
  }
}

module.exports = { PatchService };
