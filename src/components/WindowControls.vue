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
