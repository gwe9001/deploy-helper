import { app, BrowserWindow, screen, Menu, ipcMain } from 'electron'
import electronSquirrelStartup from 'electron-squirrel-startup'
import path from 'path'
import Store from 'electron-store'
import { enable, initialize } from '@electron/remote/main'
import log from 'electron-log/main'
import { updateElectronApp } from 'update-electron-app'
import { setupIpcHandlers } from './ipcHandlers'
import fs from 'fs'

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

// 讀取 Nuxt 實際端口的函數
function getNuxtPort(): number {
  try {
    const portFile = path.join(process.cwd(), '.nuxt-port')
    if (fs.existsSync(portFile)) {
      const content = fs.readFileSync(portFile, 'utf8')
      const match = content.match(/NUXT_PORT=(\d+)/)
      if (match) {
        const port = parseInt(match[1])
        log.info(`從檔案讀取到 Nuxt 端口: ${port}`)
        return port
      }
    }
  } catch (error) {
    log.warn('無法讀取 Nuxt 端口檔案:', error)
  }
  
  // 回退到預設端口
  log.info('使用預設 Nuxt 端口: 3000')
  return 3000
}

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
    // 開發時動態獲取 Nuxt dev server 端口
    const nuxtPort = getNuxtPort()
    const nuxtUrl = `http://localhost:${nuxtPort}`
    log.info(`載入 Nuxt 應用程式: ${nuxtUrl}`)
    mainWindow.loadURL(nuxtUrl)
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
