import { ipcMain, shell, BrowserWindow, app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import Store from 'electron-store'
import log from 'electron-log/main'
import { exec, spawn } from 'child_process'

const store = new Store()
const isDev = !app.isPackaged

const CONFIG_GIT_BASH_PATH = 'config.gitBashPath'
const COMMAND_OUTPUT = 'command-output'
const COMMAND_ERROR = 'command-error'

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

const gitBashPath = store.get(CONFIG_GIT_BASH_PATH) || defaultGitBashPath
store.set(CONFIG_GIT_BASH_PATH, gitBashPath)

async function executeCommand(
  command: string,
  directory: string,
  shell: string,
): Promise<string> {
  let shellPath: string
  if (shell === 'powershell') {
    shellPath = 'powershell.exe'
  } else {
    shellPath = store.get(CONFIG_GIT_BASH_PATH) || defaultGitBashPath
  }
  log.info(shellPath)

  return new Promise((resolve, reject) => {
    exec(command, { shell: shellPath, cwd: directory }, (error, stdout) => {
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
  shell: string,
): Promise<void> {
  let shellPath: string
  if (shell === 'powershell') {
    shellPath = 'powershell.exe'
  } else {
    shellPath = store.get(CONFIG_GIT_BASH_PATH) || defaultGitBashPath
  }
  log.info(shellPath)

  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      shell: shellPath,
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
        BrowserWindow.getFocusedWindow()?.webContents.send(
          COMMAND_OUTPUT,
          'Command completed successfully\n',
        )
        resolve()
      } else {
        reject(new Error(`Command exited with code ${code}`))
      }
    })
  })
}

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
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

  ipcMain.handle(
    'execute-command',
    async (event, command, directory, shell) => {
      return await executeCommand(command, directory, shell)
    },
  )

  ipcMain.handle(
    'execute-command-stream',
    async (event, command, args, directory, shell) => {
      try {
        await executeCommandStream(command, args, directory, shell)
        return 'Command completed successfully'
      } catch (error) {
        log.error('Error:', error)
        return `Error: ${error.message}`
      }
    },
  )

  ipcMain.handle('export-config', async (event, filePath) => {
    try {
      const config = store.store
      await fs.writeFile(filePath, JSON.stringify(config, null, 2), {
        encoding: 'utf-8',
      })
      return true
    } catch (error) {
      console.error('Error exporting config:', error)
      throw error
    }
  })

  ipcMain.handle('import-config', async (event, filePath) => {
    try {
      const configData = await fs.readFile(filePath, 'utf-8')
      const importedConfig = JSON.parse(configData)

      store.set(importedConfig)
      // 重啟
      app.relaunch()
      app.quit()
    } catch (error) {
      console.error('Error importing config:', error)
      throw error
    }
  })

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

  // 新增：獲取視窗狀態
  ipcMain.handle('get-window-state', () => {
    return {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      isFullScreen: mainWindow.isFullScreen()
    }
  })

  // 新增：監聽視窗最大化/還原事件並通知渲染程序
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized')
  })
}
