const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { CatalogService } = require('./src/services/catalog-service');
const { ManifestService } = require('./src/services/manifest-service');
const { StateStore } = require('./src/services/state-store');
const { PatchService } = require('./src/services/patch-service');
const { GameCoordinator } = require('./src/services/game-coordinator');

let mainWindow = null;
let coordinator = null;
let operationInProgress = false;

function createCoordinator() {
  const dataRoot = path.join(app.getPath('userData'), 'data');
  const catalogService = new CatalogService({
    settingsPath: path.join(dataRoot, 'settings.json'),
    cachePath: path.join(dataRoot, 'catalog-cache.json')
  });
  const stateStore = new StateStore(path.join(dataRoot, 'games'));
  return new GameCoordinator({
    catalogService,
    manifestService: new ManifestService(),
    patchService: new PatchService({ stateStore })
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#09090c',
    title: 'Odium Launcher',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function sendProgress(gameId, event) {
  mainWindow?.webContents.send('odium:operation-progress', { gameId, ...event });
}

function registerIpc() {
  ipcMain.handle('odium:bootstrap', async () => coordinator.refresh());
  ipcMain.handle('odium:refresh', async () => coordinator.refresh({ force: true }));
  ipcMain.handle('odium:get-settings', async () => coordinator.catalogService.getSettings());
  ipcMain.handle('odium:save-settings', async (_event, settings) => {
    await coordinator.catalogService.saveSettings(settings);
    return coordinator.refresh({ force: true });
  });

  ipcMain.handle('odium:install', async (_event, gameId) => {
    if (operationInProgress) throw new Error('Başka bir kurulum işlemi devam ediyor.');
    operationInProgress = true;
    try {
      return await coordinator.install(gameId, event => sendProgress(gameId, event));
    } finally {
      operationInProgress = false;
    }
  });

  ipcMain.handle('odium:uninstall', async (_event, gameId) => {
    if (operationInProgress) throw new Error('Başka bir işlem devam ediyor.');
    operationInProgress = true;
    try {
      return await coordinator.uninstall(gameId, event => sendProgress(gameId, event));
    } finally {
      operationInProgress = false;
    }
  });

  ipcMain.handle('odium:open-install-folder', async (_event, gameId) => {
    const { runtime } = coordinator.requireGame(gameId, { requireManifest: false });
    return shell.openPath(runtime.install.installPath);
  });

  ipcMain.handle('odium:launch-game', async (_event, gameId) => {
    const { game, runtime } = coordinator.requireGame(gameId, { requireManifest: false });
    const executable = await coordinator.locateExecutable(gameId);
    if (executable) {
      const error = await shell.openPath(executable);
      if (error) throw new Error(error);
      return true;
    }
    if (runtime.install.platform === 'steam' && game.platforms?.steam?.appId) {
      await shell.openExternal(`steam://run/${game.platforms.steam.appId}`);
      return true;
    }
    if (runtime.install.platform === 'epic' && runtime.install.appName) {
      await shell.openExternal(`com.epicgames.launcher://apps/${encodeURIComponent(runtime.install.appName)}?action=launch&silent=true`);
      return true;
    }
    throw new Error('Oyunun çalıştırılabilir dosyası tanımlı değil.');
  });

  ipcMain.handle('odium:open-external', async (_event, url) => {
    if (!/^https?:\/\//i.test(url)) throw new Error('Yalnızca web bağlantıları açılabilir.');
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('odium:select-catalog-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    return result.canceled ? null : result.filePaths[0];
  });
}

app.whenReady().then(async () => {
  coordinator = createCoordinator();
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
