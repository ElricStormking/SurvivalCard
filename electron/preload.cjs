const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mountainHermit', {
  appVersion: () => ipcRenderer.invoke('app-version')
});
