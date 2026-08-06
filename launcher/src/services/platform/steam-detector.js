const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { parseVdf } = require('./vdf');

const execFileAsync = promisify(execFile);

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

function cleanRegistryValue(output) {
  const lines = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const valueLine = lines.find(line => /SteamPath\s+REG_SZ/i.test(line));
  if (!valueLine) return null;
  return valueLine.replace(/^.*?REG_SZ\s+/i, '').trim().replaceAll('/', path.sep);
}

async function findSteamRoot() {
  const candidates = [];
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execFileAsync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { windowsHide: true });
      const registryPath = cleanRegistryValue(stdout);
      if (registryPath) candidates.push(registryPath);
    } catch {
      // Registry is optional; fallback paths follow.
    }
    if (process.env['ProgramFiles(x86)']) candidates.push(path.join(process.env['ProgramFiles(x86)'], 'Steam'));
    if (process.env.ProgramFiles) candidates.push(path.join(process.env.ProgramFiles, 'Steam'));
  } else {
    const home = process.env.HOME || '';
    candidates.push(path.join(home, '.steam', 'steam'), path.join(home, '.local', 'share', 'Steam'));
  }

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    if (await pathExists(path.join(candidate, 'steamapps'))) return candidate;
  }
  return null;
}

async function readLibraryRoots(steamRoot) {
  const roots = [steamRoot];
  const libraryFile = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf');
  try {
    const parsed = parseVdf(await fs.readFile(libraryFile, 'utf8'));
    const libraries = parsed.libraryfolders || parsed.LibraryFolders || {};
    for (const value of Object.values(libraries)) {
      const libraryPath = typeof value === 'string' ? value : value?.path;
      if (libraryPath) roots.push(libraryPath.replaceAll('\\\\', '\\'));
    }
  } catch {
    // A missing/corrupt secondary library list must not hide the main library.
  }
  return [...new Set(roots.map(root => path.resolve(root)))];
}

function findCaseInsensitive(object, key) {
  const actual = Object.keys(object || {}).find(candidate => candidate.toLowerCase() === key.toLowerCase());
  return actual ? object[actual] : undefined;
}

async function detectSteamGame(game) {
  const appId = game?.platforms?.steam?.appId;
  if (!appId) return null;
  const steamRoot = await findSteamRoot();
  if (!steamRoot) return null;

  const roots = await readLibraryRoots(steamRoot);
  for (const libraryRoot of roots) {
    const manifestPath = path.join(libraryRoot, 'steamapps', `appmanifest_${appId}.acf`);
    try {
      const parsed = parseVdf(await fs.readFile(manifestPath, 'utf8'));
      const appState = findCaseInsensitive(parsed, 'AppState') || parsed;
      const installDirName = findCaseInsensitive(appState, 'installdir');
      if (!installDirName) continue;
      const installPath = path.join(libraryRoot, 'steamapps', 'common', installDirName);
      if (!(await pathExists(installPath))) continue;
      return {
        platform: 'steam',
        appId: String(appId),
        displayName: findCaseInsensitive(appState, 'name') || game.title,
        installPath,
        manifestPath,
        stateFlags: Number(findCaseInsensitive(appState, 'StateFlags') || 0),
        officialInstall: true,
        ownership: {
          status: 'local-official-install',
          verified: false,
          reason: 'Steam istemci manifesti ve kurulum klasörü bulundu.'
        }
      };
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn('Steam manifest okunamadı:', manifestPath, error.message);
    }
  }
  return null;
}

module.exports = { findSteamRoot, readLibraryRoots, detectSteamGame, cleanRegistryValue };
