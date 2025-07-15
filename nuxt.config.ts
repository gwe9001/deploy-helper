// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Electron 需要 SPA 模式
  ssr: false,
  
  // 開發工具配置
  devtools: { enabled: false },
  
  // 開發伺服器配置 - 使用隨機端口
  devServer: {
    port: 0 // 0 表示使用隨機可用端口
  },
  
  // 鉤子函數 - 伺服器啟動後將實際端口寫入檔案
  hooks: {
    'listen': async (server: any, { host, port }: { host: string, port: number }) => {
      const fs = require('fs')
      // 延遲確保伺服器完全啟動
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 嘗試獲取實際端口
      let actualPort = port
      if (server && server.address) {
        const address = server.address()
        if (address && typeof address === 'object') {
          actualPort = address.port
        }
      }
      
      const portInfo = `NUXT_PORT=${actualPort}\n`
      fs.writeFileSync('.nuxt-port', portInfo)
      console.log(`Nuxt server listening on ${host}:${actualPort}`)
    }
  },
  
  // CSS 框架和模組
  modules: [
    '@element-plus/nuxt'
  ],
  
  // Element Plus 配置
  elementPlus: {
    /** 元件配置 */
  },
  
  // CSS 配置
  css: [
    'element-plus/dist/index.css',
    '~/assets/css/main.css'
  ],
  
  // 應用程式配置
  app: {
    // Electron 使用 hash 路由模式
    buildAssetsDir: '_nuxt/',
    head: {
      title: 'Deploy Helper',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  
  // 生成配置 - 適配 Electron
  nitro: {
    preset: 'static'
  },
  
  // Vite 配置
  vite: {
    optimizeDeps: {
      exclude: ['@electron/remote', 'electron']
    },
    build: {
      target: 'esnext'
    }
  },
  
  // 建置配置
  build: {
    transpile: ['element-plus']
  },
  
  // 相容性
  compatibilityDate: '2024-07-14'
})