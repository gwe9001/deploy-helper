<template>
  <div class="custom-frame">
    <div class="title-bar">
      <div class="left-section">
        <div class="app-icon-wrapper" @click="showMenu">
          <img src="/assets/icons/icon.png" alt="App Icon" class="app-icon" />
        </div>
        <span class="app-name">Deploy Helper - v{{ version }}</span>
      </div>
      <WindowControls />
    </div>
    <div class="content-wrapper">
      <div class="content-area">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WindowControls from './WindowControls.vue'
import { version } from '../../package.json'

const showMenu = async () => {
  await window.electron.ipcRenderer.send('show-menu')
}
</script>

<style scoped>
.custom-frame {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f5f7fa;
}

.title-bar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  color: #2c3e50;
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid #e0e0e0;
}

.left-section {
  display: flex;
  align-items: center;
}

.app-icon-wrapper {
  width: 24px;
  height: 24px;
  margin-left: 5px;
  border-radius: 20%;
  overflow: hidden;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: transform 0.3s ease;
}

.app-icon-wrapper:hover {
  transform: scale(1.1);
}

.app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-name {
  margin-left: 10px;
  font-weight: bold;
}

.content-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
