const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 200,
    transparent: true,
    frame: false, // 프레임 완전 제거
    resizable: true,
    alwaysOnTop: true, // 모든 창 위에 떠있도록
    skipTaskbar: false,
    hasShadow: false, // 그림자 제거로 더 위젯처럼 보이게
    backgroundColor: '#00000000', // 완전 투명 배경
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      backgroundThrottling: false, // 백그라운드에서도 부드럽게
      preload: path.join(__dirname, 'preload.js'),
      // webview 배경도 투명하게
      offscreen: false,
    },
    // macOS specific options
    vibrancy: 'under-window', // macOS vibrancy effect - 뒤의 화면이 비치도록
    visualEffectState: 'active', // macOS visual effect state
    // titleBarStyle을 제거하여 완전히 프레임 없는 윈도우 생성
  });

  // macOS specific: Enable window transparency and vibrancy
  if (process.platform === 'darwin') {
    // under-window vibrancy로 뒤의 모든 창이 비치도록
    mainWindow.setVibrancy('under-window');
    // macOS에서 완전 투명하게 (RGBA 형식)
    mainWindow.setBackgroundColor('#00000000');
    // 모든 워크스페이스에서 보이도록
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    // macOS window level을 높여서 모든 것 위에 표시
    mainWindow.setAlwaysOnTop(true, 'floating', 1);
  }
  
  // frame: false로 프레임과 모든 창 버튼이 완전히 제거됨
  // 추가 설정 불필요

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  // DOM이 준비되면 즉시 투명도 강제
  mainWindow.webContents.on('dom-ready', () => {
    // CSS 변수도 투명하게 변경
    mainWindow.webContents.insertCSS(`
      :root {
        --background: 0 0% 0% / 0 !important;
      }
      * {
        background: transparent !important;
        background-color: transparent !important;
      }
      html, body, #__next, [data-nextjs-scroll-focus-boundary], main, div[role="main"] {
        background: transparent !important;
        background-color: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body > *:not(script):not(style):not(svg) {
        background: transparent !important;
        background-color: transparent !important;
      }
    `);
    
    // JavaScript로 모든 요소 강제 투명화
    mainWindow.webContents.executeJavaScript(`
      (function() {
        // CSS 변수 변경
        document.documentElement.style.setProperty('--background', '0 0% 0% / 0');
        
        // 모든 요소 투명화
        const makeTransparent = (el) => {
          if (!el || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
          el.style.background = 'transparent';
          el.style.backgroundColor = 'transparent';
          Array.from(el.children).forEach(makeTransparent);
        };
        
        makeTransparent(document.documentElement);
        makeTransparent(document.body);
        
        // Next.js 루트 요소
        const nextRoot = document.getElementById('__next');
        if (nextRoot) {
          makeTransparent(nextRoot);
        }
        
        // 주기적으로 확인 (Next.js가 스타일을 다시 적용할 수 있음)
        setInterval(() => {
          document.body.style.background = 'transparent';
          document.body.style.backgroundColor = 'transparent';
          document.documentElement.style.background = 'transparent';
          document.documentElement.style.backgroundColor = 'transparent';
        }, 100);
      })();
    `);
  });
  
  // 페이지 로드 후에도 다시 한번 확인
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      document.body.style.background = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.background = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
    `);
  });

  // DevTools는 수동으로 열도록 (Cmd+Option+I)
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // macOS에서 위젯처럼 동작하도록 설정
  if (process.platform === 'darwin') {
    // 윈도우를 드래그 가능하게 (전체 영역)
    mainWindow.setIgnoreMouseEvents(false, { forward: true });
    
    // 모든 창 위에 떠있도록 (이미 alwaysOnTop: true로 설정했지만 확실히)
    mainWindow.setAlwaysOnTop(true, 'floating', 1);
    
    // 투명도 확인을 위한 로그 (개발용)
    if (isDev) {
      console.log('Window transparency enabled');
      console.log('Vibrancy:', mainWindow.getVibrancy());
      console.log('Always on top:', mainWindow.isAlwaysOnTop());
      console.log('Visible on all workspaces:', mainWindow.isVisibleOnAllWorkspaces());
    }
  }
}

app.whenReady().then(() => {
  createWindow();

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
