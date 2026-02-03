const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
    checkScreenPermission: () => ipcRenderer.invoke('check-screen-permission'),
});
