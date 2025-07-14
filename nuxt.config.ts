// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Electron 需要 SPA 模式
  ssr: false,
  
  // 開發工具配置
  devtools: { enabled: false },
  
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