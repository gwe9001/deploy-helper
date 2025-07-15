import { app, BrowserWindow, screen, Menu, ipcMain } from 'electron'
import electronSquirrelStartup from 'electron-squirrel-startup'
import path from 'path'
import Store from 'electron-store'
import { enable, initialize } from '@electron/remote/main'
import log from 'electron-log/main'
import { updateElectronApp } from 'update-electron-app'
import { setupIpcHandlers } from './ipcHandlers'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

const isDev = !app.isPackaged

// handle auto updates
if (!isDev) {
  updateElectronApp()
}

if (electronSquirrelStartup) {
  app.quit()
}

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
    width: Math.min(1280, width * 0.8),
    height: Math.min(800, height * 0.8),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  })

  enable(mainWindow.webContents)

  // 開發模式使用 Nuxt dev server
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // 開發時指向 Nuxt dev server (port 3000)
    mainWindow.loadURL('http://localhost:3000')
  } else {
    // 生產模式載入建置後的檔案
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

  // 處理窗口焦點事件，確保內容更新不受焦點影響
  mainWindow.on('focus', () => {
    log.info('Window focused')
  })

  mainWindow.on('blur', () => {
    log.info('Window blurred')
  })

  // 確保窗口狀態變化時保持通訊暢通
  mainWindow.webContents.on('dom-ready', () => {
    log.info('DOM ready, window is ready to receive messages')
  })
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
