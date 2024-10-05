import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import log from 'electron-log/renderer'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

log.info('Log from the renderer')
console.log = log.log
Object.assign(console, log.functions)

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus)
app.use(router)
app.mount('#app')
