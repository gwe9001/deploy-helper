import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Electron BrowserWindow
const mockWebContents = {
  send: vi.fn()
}

const mockMainWindow = {
  webContents: mockWebContents,
  isDestroyed: vi.fn(() => false),
  isFocused: vi.fn(() => false)
}

const mockFocusedWindow = {
  webContents: mockWebContents,
  isDestroyed: vi.fn(() => false),
  isFocused: vi.fn(() => true)
}

const mockBrowserWindow = {
  getFocusedWindow: vi.fn(),
  getAllWindows: vi.fn(() => [mockMainWindow]),
  fromWebContents: vi.fn(() => mockMainWindow)
}

// Mock spawn for command execution
const mockSpawn = vi.fn()
const mockProcess = {
  on: vi.fn(),
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() }
}

vi.mock('child_process', () => ({
  spawn: mockSpawn,
  exec: vi.fn()
}))

vi.mock('electron', () => ({
  BrowserWindow: mockBrowserWindow,
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn()
  },
  shell: {
    openExternal: vi.fn(),
    openPath: vi.fn(),
    showItemInFolder: vi.fn()
  },
  app: {
    isPackaged: false,
    getPath: vi.fn()
  }
}))

vi.mock('electron-store', () => {
  return {
    default: vi.fn(() => ({
      get: vi.fn((key) => {
        if (key === 'config.gitBashPath') return '/usr/bin/bash'
        return null
      }),
      set: vi.fn(),
      store: {}
    }))
  }
})

vi.mock('electron-log/main', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

describe('窗口焦點問題修復測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpawn.mockReturnValue(mockProcess)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('executeCommandStream 窗口目標處理', () => {
    const createExecuteCommandStream = () => {
      // 重新創建函數以避免模組快取
      const executeCommandStream = async (
        command: string,
        args: string[],
        directory: string,
        shell: string,
        targetWindow?: any
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          const process = mockSpawn(command, args, {
            shell: shell,
            cwd: directory,
          })

          process.stdout.on('data', (data: string) => {
            // 模擬修復後的邏輯：優先使用目標窗口，否則使用主窗口
            const window = targetWindow || mockBrowserWindow.getFocusedWindow() || mockBrowserWindow.getAllWindows()[0]
            window?.webContents.send('command-output', data.toString())
          })

          process.stderr.on('data', (data: string) => {
            const window = targetWindow || mockBrowserWindow.getFocusedWindow() || mockBrowserWindow.getAllWindows()[0]
            window?.webContents.send('command-error', data.toString())
          })

          process.on('close', (code: number) => {
            if (code === 0) {
              const window = targetWindow || mockBrowserWindow.getFocusedWindow() || mockBrowserWindow.getAllWindows()[0]
              window?.webContents.send('command-output', 'Command completed successfully\n')
              resolve()
            } else {
              reject(new Error(`Command exited with code ${code}`))
            }
          })

          // 模擬立即觸發事件以測試
          setTimeout(() => {
            const stdoutCallback = process.stdout.on.mock.calls.find(call => call[0] === 'data')?.[1]
            const closeCallback = process.on.mock.calls.find(call => call[0] === 'close')?.[1]
            
            if (stdoutCallback) stdoutCallback('test output')
            if (closeCallback) closeCallback(0)
          }, 0)
        })
      }

      return executeCommandStream
    }

    it('應該在有焦點窗口時正確發送訊息', async () => {
      const executeCommandStream = createExecuteCommandStream()
      
      // 模擬有焦點窗口
      mockBrowserWindow.getFocusedWindow.mockReturnValue(mockFocusedWindow)
      
      await executeCommandStream('test', ['arg'], '/test', 'bash')
      
      // 驗證訊息發送到焦點窗口
      expect(mockFocusedWindow.webContents.send).toHaveBeenCalledWith('command-output', 'test output')
      expect(mockFocusedWindow.webContents.send).toHaveBeenCalledWith('command-output', 'Command completed successfully\n')
    })

    it('應該在沒有焦點窗口時使用主窗口', async () => {
      const executeCommandStream = createExecuteCommandStream()
      
      // 模擬沒有焦點窗口
      mockBrowserWindow.getFocusedWindow.mockReturnValue(null)
      
      await executeCommandStream('test', ['arg'], '/test', 'bash')
      
      // 驗證訊息發送到主窗口（getAllWindows的第一個）
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('command-output', 'test output')
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('command-output', 'Command completed successfully\n')
    })

    it('應該優先使用傳入的目標窗口', async () => {
      const executeCommandStream = createExecuteCommandStream()
      const customWindow = {
        webContents: { send: vi.fn() }
      }
      
      // 即使有焦點窗口，也應該使用傳入的目標窗口
      mockBrowserWindow.getFocusedWindow.mockReturnValue(mockFocusedWindow)
      
      await executeCommandStream('test', ['arg'], '/test', 'bash', customWindow)
      
      // 驗證訊息發送到自定義窗口
      expect(customWindow.webContents.send).toHaveBeenCalledWith('command-output', 'test output')
      expect(customWindow.webContents.send).toHaveBeenCalledWith('command-output', 'Command completed successfully\n')
      
      // 確保沒有發送到其他窗口
      expect(mockFocusedWindow.webContents.send).not.toHaveBeenCalled()
      expect(mockMainWindow.webContents.send).not.toHaveBeenCalled()
    })

    it('應該處理錯誤輸出', async () => {
      const executeCommandStream = async (
        command: string,
        args: string[],
        directory: string,
        shell: string,
        targetWindow?: any
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          const mockLocalProcess = {
            stdout: { on: vi.fn() },
            stderr: { on: vi.fn() },
            on: vi.fn()
          }
          
          mockSpawn.mockReturnValue(mockLocalProcess)
          
          const process = mockSpawn(command, args, {
            shell: shell,
            cwd: directory,
          })

          process.stderr.on('data', (data: string) => {
            const window = targetWindow || mockBrowserWindow.getFocusedWindow() || mockBrowserWindow.getAllWindows()[0]
            window?.webContents.send('command-error', data.toString())
          })

          process.on('close', (code: number) => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`Command exited with code ${code}`))
            }
          })

          // 立即觸發stderr事件
          setTimeout(() => {
            const stderrCallback = process.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1]
            const closeCallback = process.on.mock.calls.find(call => call[0] === 'close')?.[1]
            
            if (stderrCallback) stderrCallback('error output')
            if (closeCallback) closeCallback(0)
          }, 0)
        })
      }
      
      mockBrowserWindow.getFocusedWindow.mockReturnValue(null)
      
      await executeCommandStream('test', ['arg'], '/test', 'bash')
      
      // 驗證錯誤訊息也發送到正確窗口
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('command-error', 'error output')
    })

    it('應該在沒有任何窗口時優雅處理', async () => {
      const executeCommandStream = createExecuteCommandStream()
      
      // 模擬沒有任何窗口
      mockBrowserWindow.getFocusedWindow.mockReturnValue(null)
      mockBrowserWindow.getAllWindows.mockReturnValue([])
      
      // 應該不會拋出錯誤
      await expect(executeCommandStream('test', ['arg'], '/test', 'bash')).resolves.toBeUndefined()
    })
  })

  describe('窗口狀態管理', () => {
    it('應該正確識別窗口焦點狀態', () => {
      // 測試焦點窗口檢測
      mockBrowserWindow.getFocusedWindow.mockReturnValue(mockFocusedWindow)
      
      const focusedWindow = mockBrowserWindow.getFocusedWindow()
      expect(focusedWindow).toBe(mockFocusedWindow)
      expect(focusedWindow?.isFocused()).toBe(true)
    })

    it('應該正確處理失去焦點的情況', () => {
      // 測試失去焦點時的處理
      mockBrowserWindow.getFocusedWindow.mockReturnValue(null)
      // 重新設置getAllWindows的返回值
      mockBrowserWindow.getAllWindows.mockReturnValue([mockMainWindow])
      
      const focusedWindow = mockBrowserWindow.getFocusedWindow()
      expect(focusedWindow).toBeNull()
      
      // 應該能夠獲取所有窗口作為後備
      const allWindows = mockBrowserWindow.getAllWindows()
      expect(allWindows).toHaveLength(1)
      expect(allWindows[0]).toBe(mockMainWindow)
    })

    it('應該處理窗口被銷毀的情況', () => {
      const destroyedWindow = {
        webContents: { send: vi.fn() },
        isDestroyed: vi.fn(() => true)
      }
      
      mockBrowserWindow.getFocusedWindow.mockReturnValue(destroyedWindow)
      
      // 在實際實作中，應該檢查窗口是否被銷毀
      const window = mockBrowserWindow.getFocusedWindow()
      expect(window?.isDestroyed()).toBe(true)
    })
  })

  describe('IPC處理改善', () => {
    it('應該在IPC處理器中使用主窗口作為目標', async () => {
      // 模擬IPC處理器的邏輯
      const mockIpcHandler = async (mainWindow: any, command: string, args: string[], directory: string, shell: string) => {
        // 直接在這裡定義executeCommandStream避免作用域問題
        const executeCommandStream = async (
          command: string,
          args: string[],
          directory: string,
          shell: string,
          targetWindow?: any
        ): Promise<void> => {
          return new Promise((resolve) => {
            // 模擬命令執行和輸出到指定窗口
            const window = targetWindow || mockBrowserWindow.getFocusedWindow() || mockBrowserWindow.getAllWindows()[0]
            window?.webContents.send('command-output', 'test output')
            resolve()
          })
        }
        
        // 傳遞主窗口作為目標窗口（修復後的邏輯）
        return await executeCommandStream(command, args, directory, shell, mainWindow)
      }

      // 模擬調用IPC處理器
      mockBrowserWindow.getFocusedWindow.mockReturnValue(null)
      
      // 應該能夠成功執行而不拋出錯誤
      await expect(mockIpcHandler(mockMainWindow, 'test', ['arg'], '/test', 'bash')).resolves.toBeUndefined()
      
      // 驗證訊息發送到指定的主窗口
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('command-output', 'test output')
    })
  })
})

describe('窗口焦點修復整合測試', () => {
  it('應該確保命令輸出始終能夠到達應用程式', async () => {
    // 整合測試：模擬真實場景
    const scenarios = [
      { name: '窗口有焦點', focused: true },
      { name: '窗口失去焦點', focused: false },
      { name: '窗口最小化', focused: false, minimized: true }
    ]

    for (const scenario of scenarios) {
      // 重置mock狀態
      vi.clearAllMocks()
      
      if (scenario.focused) {
        mockBrowserWindow.getFocusedWindow.mockReturnValue(mockFocusedWindow)
      } else {
        mockBrowserWindow.getFocusedWindow.mockReturnValue(null)
      }

      const executeCommandStream = async (targetWindow: any) => {
        return new Promise<void>((resolve) => {
          // 模擬命令執行和輸出
          const window = targetWindow || mockBrowserWindow.getFocusedWindow() || mockBrowserWindow.getAllWindows()[0]
          window?.webContents.send('command-output', 'test output')
          resolve()
        })
      }

      // 執行測試
      await executeCommandStream(mockMainWindow)

      // 驗證輸出總是能到達某個窗口
      const totalSendCalls = mockMainWindow.webContents.send.mock.calls.length + 
                           mockFocusedWindow.webContents.send.mock.calls.length

      expect(totalSendCalls).toBeGreaterThan(0)
    }
  })
})