import { app, BrowserWindow, ipcMain, screen, systemPreferences } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Suppress D-Bus errors in WSL
process.env.DBUS_SESSION_BUS_ADDRESS = '/dev/null';

const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 620;
const MINIMIZED_WIDTH = 80;
const MINIMIZED_HEIGHT = 160;

function createWindow() {
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: WIDGET_WIDTH,
        height: WIDGET_HEIGHT,
        x: screenWidth - WIDGET_WIDTH - 20,
        y: 40,
        transparent: true,
        backgroundColor: '#00000000',
        frame: false,
        hasShadow: false,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        }
    });

    // macOS: use 'floating' level to stay above normal windows
    mainWindow.setAlwaysOnTop(true, 'floating');

    if (process.platform === 'darwin') {
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
    createWindow();

    // IPC: toggle mouse event passthrough
    ipcMain.on('set-ignore-mouse-events', (event, ignore, options = {}) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            win.setIgnoreMouseEvents(ignore, { forward: true, ...options });
        }
    });

    // IPC: resize widget window (for minimize / expand)
    ipcMain.on('resize-window', (event, width, height) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            win.setSize(width, height, true);
        }
    });

    // IPC: get desktop capture sources
    ipcMain.handle('get-desktop-sources', async () => {
        const { desktopCapturer } = await import('electron');
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        return sources;
    });

    // IPC: check macOS screen recording permission
    ipcMain.handle('check-screen-permission', async () => {
        if (process.platform === 'darwin') {
            const status = systemPreferences.getMediaAccessStatus('screen');
            return status;
        }
        return 'granted';
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
