<template>
  <div class="window-controls">
    <button @click="minimize" class="control-button">
      <el-icon><Minus /></el-icon>
    </button>
    <button @click="maximize" class="control-button">
      <el-icon>
        <FullScreen v-if="!isMaximized" />
        <CopyDocument v-else />
      </el-icon>
    </button>
    <button @click="close" class="control-button close">
      <el-icon><Close /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Minus, FullScreen, Close, CopyDocument } from '@element-plus/icons-vue'

const isMaximized = ref(false)

const minimize = async () => {
  await window.electron.ipcRenderer.send('minimize-window')
}

const maximize = async () => {
  await window.electron.ipcRenderer.send('maximize-window')
}

const close = async () => {
  await window.electron.ipcRenderer.send('close-window')
}

// 監聽視窗狀態變化
const handleWindowMaximized = () => {
  isMaximized.value = true
}

const handleWindowUnmaximized = () => {
  isMaximized.value = false
}

onMounted(() => {
  // 監聽來自主程序的視窗狀態變化事件
  window.electron.ipcRenderer.on('window-maximized', handleWindowMaximized)
  window.electron.ipcRenderer.on('window-unmaximized', handleWindowUnmaximized)
  
  // 初始化時獲取視窗狀態
  window.electron.ipcRenderer.invoke('get-window-state').then((state) => {
    isMaximized.value = state.isMaximized
  })
})

onUnmounted(() => {
  // 清理事件監聽器
  window.electron.ipcRenderer.removeListener('window-maximized', handleWindowMaximized)
  window.electron.ipcRenderer.removeListener('window-unmaximized', handleWindowUnmaximized)
})
</script>

<style scoped>
.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
  gap: 1px;
}

.control-button {
  background: none;
  border: none;
  color: var(--text-color);
  padding: 0 16px;
  height: 32px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.control-button:hover {
  background-color: var(--background-color);
  opacity: 1;
}

.control-button.close:hover {
  background-color: var(--danger-color);
  color: white;
}

.el-icon {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.control-button:hover .el-icon {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .control-button {
    padding: 0 20px;
    height: 40px;
  }

  .el-icon {
    font-size: 16px;
  }
}
</style>
