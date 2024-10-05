import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import electronSquirrelStartup from 'electron-squirrel-startup'
import { exec, spawn } from 'child_process'
import path from 'path'
import Store from 'electron-store'
import { enable, initialize } from '@electron/remote/main'
import log from 'electron-log/main'

const CONFIG_GIT_BASH_PATH = 'config.gitBashPath'
const COMMAND_OUTPUT = 'command-output'
const COMMAND_ERROR = 'command-error'
const isDev = !app.isPackaged

if (electronSquirrelStartup) {
  app.quit()
}

const store = new Store()
initialize()

log.initialize()
log.eventLogger.startLogging()
log.info('Log from the main process')

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    icon: 'assets/icons/icon.png',
    width: 800,
    height: 600,
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

const defaultGitBashPath = (() => {
  switch (process.platform) {
    case 'win32':
      return 'C:\\Program Files\\Git\\bin\\bash.exe'
    case 'darwin':
      return '/usr/local/bin/bash'
    default:
      return '/bin/bash'
  }
})()

let gitBashPath = store.get(CONFIG_GIT_BASH_PATH) || defaultGitBashPath
store.set(CONFIG_GIT_BASH_PATH, gitBashPath)

async function executeCommand(
  command: string,
  directory: string,
): Promise<string> {
  gitBashPath = store.get(CONFIG_GIT_BASH_PATH) || defaultGitBashPath
  log.info(gitBashPath)

  return new Promise((resolve, reject) => {
    exec(command, { shell: gitBashPath, cwd: directory }, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

async function executeCommandStream(
  command: string,
  args: string[],
  directory: string,
): Promise<void> {
  gitBashPath = store.get(CONFIG_GIT_BASH_PATH) || defaultGitBashPath
  log.info(gitBashPath)

  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      shell: gitBashPath,
      cwd: directory,
    })

    process.on('error', (err) => {
      console.log(err)
      reject(err)
    })

    process.stdout.on('data', (data) => {
      BrowserWindow.getFocusedWindow()?.webContents.send(
        COMMAND_OUTPUT,
        data.toString(),
      )
    })

    process.stderr.on('data', (data) => {
      BrowserWindow.getFocusedWindow()?.webContents.send(
        COMMAND_ERROR,
        data.toString(),
      )
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command exited with code ${code}`))
      }
    })
  })
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('open-path', async (event, path) => {
    await shell.openPath(path)
  })

  ipcMain.handle(
    'open-app-path',
    async (
      event,
      name:
        | 'app'
        | 'home'
        | 'appData'
        | 'userData'
        | 'sessionData'
        | 'temp'
        | 'exe'
        | 'module'
        | 'desktop'
        | 'documents'
        | 'downloads'
        | 'music'
        | 'pictures'
        | 'videos'
        | 'recent'
        | 'logs'
        | 'crashDumps',
    ) => {
      const fullPath =
        name === 'app'
          ? isDev
            ? path.resolve(__dirname, '..', '..')
            : path.resolve(app.getAppPath(), '..', '..')
          : app.getPath(name)
      await shell.openPath(fullPath)
    },
  )

  ipcMain.handle('show-item-in-folder', async (event, path) => {
    await shell.showItemInFolder(path)
  })

  ipcMain.handle('execute-command', async (event, command, directory) => {
    return await executeCommand(command, directory)
  })

  ipcMain.handle(
    'execute-command-stream',
    async (event, command, args, directory) => {
      try {
        await executeCommandStream(command, args, directory)
        return 'Command completed successfully'
      } catch (error) {
        log.error('Error:', error)
        return `Error: ${error.message}`
      }
    },
  )

  ipcMain.on('setStore', (_, key, value) => {
    store.set(key, value)
  })

  ipcMain.on('getStore', (event, key) => {
    event.returnValue = store.get(key) || ''
  })

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize()
  })

  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('close-window', () => {
    mainWindow.close()
  })

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
