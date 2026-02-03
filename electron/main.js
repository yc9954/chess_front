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
        backgroundColor: '#00FFFFFF', // Fully transparent background (ARGB format)
        frame: false,
        alwaysOnTop: true,
        hasShadow: false, // Remove shadow for better transparency
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        }
    });

    // Ensure transparency is maintained
    mainWindow.setBackgroundColor('#00FFFFFF');

    // Initially ignore mouse events to allow click-through (widget mode)
    // UI components will enable mouse events when hovered
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // In dev, load vite server
    // In prod, load index.html
    // For now, assuming dev mode mostly as user is tweaking
    // But we need to handle the URL.
    // We'll check if a dev server is running or fallback to file.

    // NOTE: Ideally we check env vars, but hardcoding localhost:5173 for dev speed for now
    // or checking command line args.
    mainWindow.loadURL('http://localhost:5173');
    
    // Ensure transparency after load
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.setBackgroundColor('#00FFFFFF');
    });
}

app.whenReady().then(() => {
    createWindow();

    // IPC handler for mouse event control
    ipcMain.on('set-ignore-mouse-events', (event, ignore, options = {}) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            console.log('Setting ignore mouse events:', ignore, options);
            win.setIgnoreMouseEvents(ignore, { forward: true, ...options });
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
