const fs = require('node:fs/promises');
const path = require('node:path');

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

function epicManifestDirectory() {
  if (process.platform !== 'win32') return null;
  const programData = process.env.ProgramData || 'C:\\ProgramData';
  return path.join(programData, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
}

function valueMatches(actual, expected) {
  return Boolean(actual && expected && String(actual).toLowerCase() === String(expected).toLowerCase());
}

function manifestMatches(manifest, config) {
  const checks = [
    valueMatches(manifest.CatalogItemId, config.catalogItemId),
    valueMatches(manifest.AppName, config.appName),
    valueMatches(manifest.MainGameAppName, config.appName),
    valueMatches(manifest.NamespaceId, config.namespace),
    valueMatches(manifest.CatalogNamespace, config.namespace)
  ];
  return checks.some(Boolean);
}

async function detectEpicGame(game) {
  const config = game?.platforms?.epic;
  if (!config) return null;
  const directory = epicManifestDirectory();
  if (!directory || !(await pathExists(directory))) return null;

  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.item')) continue;
    const manifestPath = path.join(directory, entry.name);
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      if (!manifestMatches(manifest, config)) continue;
      const installPath = manifest.InstallLocation;
      if (!installPath || !(await pathExists(installPath))) continue;
      return {
        platform: 'epic',
        appName: manifest.AppName || config.appName,
        catalogItemId: manifest.CatalogItemId || config.catalogItemId,
        namespace: manifest.NamespaceId || manifest.CatalogNamespace || config.namespace,
        displayName: manifest.DisplayName || game.title,
        installPath,
        manifestPath,
        officialInstall: true,
        ownership: {
          status: 'local-official-install',
          verified: false,
          reason: 'Epic Games Launcher manifesti ve kurulum klasörü bulundu.'
        }
      };
    } catch (error) {
      console.warn('Epic manifest okunamadı:', manifestPath, error.message);
    }
  }
  return null;
}

module.exports = { epicManifestDirectory, detectEpicGame, manifestMatches };
