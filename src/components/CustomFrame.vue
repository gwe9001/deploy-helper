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
  background-color: var(--background-color);
}

.title-bar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  color: var(--text-color);
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
  padding: 0 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon-wrapper {
  width: 20px;
  height: 20px;
  margin-left: 4px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-icon-wrapper:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px var(--shadow-color);
}

.app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  opacity: 0.9;
  letter-spacing: 0.5px;
}

.content-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background-color: var(--background-color);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  position: relative;
}

@media (max-width: 768px) {
  .title-bar {
    height: 40px;
  }

  .app-icon-wrapper {
    width: 24px;
    height: 24px;
  }

  .app-name {
    font-size: 1rem;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
