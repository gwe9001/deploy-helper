import { defineNuxtConfig } from 'nuxt'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import log from 'electron-log/renderer'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'

log.info('Log from the renderer')
console.log = log.log
Object.assign(console, log.functions)

export default defineNuxtConfig({
  buildModules: [
    '@nuxt/typescript-build',
    '@nuxtjs/tailwindcss',
    '@nuxt/ui',
  ],
  css: [
    'element-plus/dist/index.css',
    '@/assets/css/main.css',
  ],
  plugins: [
    '@/plugins/element-plus',
    '@/plugins/vue-draggable-plus',
  ],
  build: {
    transpile: [/^element-plus/],
  },
  components: true,
  ssr: false,
  target: 'static',
  router: {
    base: './',
  },
  vue: {
    config: {
      productionTip: false,
      devtools: true,
    },
  },
  hooks: {
    'vue-renderer:ssr:prepareContext'(context) {
      context.nuxtState = {
        ...context.nuxtState,
        log: log.functions,
      }
    },
  },
})
