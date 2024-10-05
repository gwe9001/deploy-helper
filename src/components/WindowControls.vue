<template>
  <div class="window-controls">
    <button @click="minimize" class="control-button">
      <el-icon><Minus /></el-icon>
    </button>
    <button @click="maximize" class="control-button">
      <el-icon><FullScreen /></el-icon>
    </button>
    <button @click="close" class="control-button close">
      <el-icon><Close /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Minus, FullScreen, Close } from '@element-plus/icons-vue'

const minimize = async () => {
  await window.electron.ipcRenderer.send('minimize-window')
}

const maximize = async () => {
  await window.electron.ipcRenderer.send('maximize-window')
}

const close = async () => {
  await window.electron.ipcRenderer.send('close-window')
}
</script>

<style scoped>
.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.control-button {
  background: none;
  border: none;
  color: #909399;
  padding: 0 10px;
  height: 32px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover {
  background-color: #f5f7fa;
}

.control-button.close:hover {
  background-color: #f56c6c;
  color: white;
}

.el-icon {
  font-size: 16px;
}
</style>
