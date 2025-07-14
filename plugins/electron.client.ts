export default defineNuxtPlugin(() => {
  // 確保在客戶端環境下載入 Electron API
  if (process.client && typeof window !== 'undefined') {
    // 初始化 Element Plus 圖示
    if (window.electron && window.electron.ipcRenderer) {
      console.log('Electron API 可用')
    }
  }
})