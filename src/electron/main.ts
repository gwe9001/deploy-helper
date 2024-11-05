import { app, BrowserWindow, screen, Menu, ipcMain } from 'electron'
import electronSquirrelStartup from 'electron-squirrel-startup'
import path from 'path'
import Store from 'electron-store'
import { enable, initialize } from '@electron/remote/main'
import log from 'electron-log/main'
import { updateElectronApp } from 'update-electron-app'
import { setupIpcHandlers } from './ipcHandlers'

const isDev = !app.isPackaged

// handle auto updates
if (!isDev) {
  updateElectronApp()
}

if (electronSquirrelStartup) {
  app.quit()
}

const store = new Store()
initialize()

log.initialize()
log.eventLogger.startLogging()
log.info('Log from the main process')

let mainWindow: BrowserWindow

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  mainWindow = new BrowserWindow({
    icon: 'assets/icons/icon.png',
    width: Math.min(1024, width * 0.8),
    height: Math.min(768, height * 0.8),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  })

  enable(mainWindow.webContents)

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        '..',
        'renderer',
        MAIN_WINDOW_VITE_NAME,
        'index.html',
      ),
    )
  }

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()

  setupIpcHandlers(mainWindow)

  ipcMain.on('show-menu', (event) => {
    const menu = Menu.getApplicationMenu()
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
