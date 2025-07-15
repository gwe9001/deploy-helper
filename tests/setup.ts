import { vi } from 'vitest'

// Mock Electron APIs
const mockElectron = {
  ipcRenderer: {
    getStoreValue: vi.fn(),
    setStoreValue: vi.fn(),
  },
  showOpenDialog: vi.fn(),
}

Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
})

// Mock Element Plus message
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock electron-log
vi.mock('electron-log/renderer', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))