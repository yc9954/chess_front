import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Suppress D-Bus errors in WSL
process.env.DBUS_SESSION_BUS_ADDRESS = '/dev/null';

function createWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true, // Start in fullscreen
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Initially DO NOT ignore mouse events - buttons should be clickable
    // Components will handle their own transparency via IPC
    mainWindow.setIgnoreMouseEvents(false);

    // In dev, load vite server
    // In prod, load index.html
    // For now, assuming dev mode mostly as user is tweaking
    // But we need to handle the URL.
    // We'll check if a dev server is running or fallback to file.

    // NOTE: Ideally we check env vars, but hardcoding localhost:5173 for dev speed for now
    // or checking command line args.
    mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
    createWindow();

    // IPC handler for mouse event control
    ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            console.log('Setting ignore mouse events:', ignore);
            win.setIgnoreMouseEvents(ignore, { forward: true });
        }
    });

    // IPC handler for capturing desktop sources
    ipcMain.handle('get-desktop-sources', async () => {
        const { desktopCapturer } = await import('electron');
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        return sources;
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
