const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('odium', {
  bootstrap: () => ipcRenderer.invoke('odium:bootstrap'),
  refresh: () => ipcRenderer.invoke('odium:refresh'),
  getSettings: () => ipcRenderer.invoke('odium:get-settings'),
  saveSettings: settings => ipcRenderer.invoke('odium:save-settings', settings),
  install: gameId => ipcRenderer.invoke('odium:install', gameId),
  uninstall: gameId => ipcRenderer.invoke('odium:uninstall', gameId),
  openInstallFolder: gameId => ipcRenderer.invoke('odium:open-install-folder', gameId),
  launchGame: gameId => ipcRenderer.invoke('odium:launch-game', gameId),
  openExternal: url => ipcRenderer.invoke('odium:open-external', url),
  onProgress: callback => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('odium:operation-progress', listener);
    return () => ipcRenderer.removeListener('odium:operation-progress', listener);
  }
});
