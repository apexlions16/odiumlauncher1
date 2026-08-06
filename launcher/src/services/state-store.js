const path = require('node:path');
const fs = require('node:fs/promises');
const { readJson, writeJsonAtomic } = require('./json-file');
const { normalizeRelativePath, resolveInside } = require('./paths');

class StateStore {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  gameDirectory(gameId) {
    return path.join(this.rootDirectory, gameId);
  }

  statePath(gameId) {
    return path.join(this.gameDirectory(gameId), 'state.json');
  }

  backupRoot(gameId) {
    return path.join(this.gameDirectory(gameId), 'backups');
  }

  stagingRoot(gameId, version) {
    return path.join(this.gameDirectory(gameId), 'staging', version);
  }

  async get(gameId) {
    return readJson(this.statePath(gameId), null);
  }

  async save(gameId, state) {
    await writeJsonAtomic(this.statePath(gameId), state);
  }

  async clear(gameId, { keepBackups = true } = {}) {
    const directory = this.gameDirectory(gameId);
    if (!keepBackups) {
      await fs.rm(directory, { recursive: true, force: true });
      return;
    }
    await fs.rm(this.statePath(gameId), { force: true });
    await fs.rm(path.join(directory, 'staging'), { recursive: true, force: true });
  }

  backupPath(gameId, relativePath) {
    return resolveInside(this.backupRoot(gameId), normalizeRelativePath(relativePath));
  }
}

module.exports = { StateStore };
