import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config
export default defineConfig({
  plugins: [vue()],
  // Nuxt 3 將處理 Vue 相關配置
  // 這個檔案現在主要用於 Electron 特定設定
  optimizeDeps: {
    exclude: ['@electron/remote', 'electron'],
  },
  build: {
    target: 'esnext',
  },
  // 開發伺服器配置，避免與 Nuxt dev server 衝突
  server: {
    port: 0, // 避免與 Nuxt 的預設 port 3000 衝突
  },
})
