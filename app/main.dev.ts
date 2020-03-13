/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, Menu, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

const DEEP_LINK_PROTOCOL = 'd1';
const DEEP_LINK_PREFIX = `${DEEP_LINK_PROTOCOL}://`;

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload))).catch(console.log);
};

const getDeeplink = (argv: Array<string>) =>
  argv.find((entry: string) => entry.search(DEEP_LINK_PREFIX) >= 0)?.substr(DEEP_LINK_PREFIX.length - 1);

// Force Single Instance Application
const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
  app.on('second-instance', (e, argv) => {
    // Someone tried to run a second instance, we should focus our window.

    // Protocol handler for win32

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // argv: An array of the second instance’s (command line / deep linked) arguments
    if (process.platform === 'win32') {
      // Keep only command line / deep linked arguments
      const deeplinkingUrl = getDeeplink(argv);
      if (deeplinkingUrl) {
        mainWindow.webContents.send('browseTo', deeplinkingUrl);
      }
    }
  });
} else {
  app.quit();
}

const createWindow = async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    width: 1024,
    height: 728,
    backgroundColor: '#FFF',
    webPreferences:
      process.env.NODE_ENV === 'development' || process.env.E2E_BUILD === 'true'
        ? {
            nodeIntegration: true
          }
        : {
            preload: path.join(__dirname, 'dist/renderer.prod.js')
          }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  let deeplinkingUrl;
  // Protocol handler for win32
  if (process.platform === 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = getDeeplink(process.argv);
  }

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }

    // Keep only command line / deep linked arguments
    if (deeplinkingUrl) {
      mainWindow.webContents.send('browseTo', deeplinkingUrl);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

const activateApplication = () => {
  if (mainWindow === null) {
    createWindow();
  }
};

const createTray = async () => {
  tray = new Tray('resources/icon.png');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: activateApplication
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('d1playtester');
  tray.setContextMenu(contextMenu);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  createTray();
  createWindow();
});

app.on('activate', () => {
  activateApplication();
});

if (!app.isDefaultProtocolClient(DEEP_LINK_PROTOCOL)) {
  app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
}
