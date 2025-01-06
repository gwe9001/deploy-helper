<template>
  <CustomFrame>
    <Header />
    <div class="main-content">
      <NuxtPage />
    </div>
  </CustomFrame>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import CustomFrame from './components/CustomFrame.vue'
import { onMounted, ref } from '#imports'

const headerHeight = ref(0)

onMounted(() => {
  const header = document.querySelector('.el-header')
  if (header) {
    headerHeight.value = header.offsetHeight
    const mainContent = document.querySelector('.main-content')
    if (mainContent) {
      ;(mainContent as HTMLElement).style.paddingTop = `${headerHeight.value}px`
    }
  }
})
</script>

<style>
:root {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  --background-color: #f5f7fa;
  --text-color: #2c3e50;
  --border-color: #dcdfe6;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang TC', 'Microsoft JhengHei',
    'Microsoft YaHei', Arial, sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  height: 100vh;
  overflow: hidden;
  background-color: var(--background-color);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.el-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.el-card {
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 12px 0 var(--shadow-color);
}

.el-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 var(--shadow-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.el-form-item {
  margin-bottom: 24px;
}

.el-input__inner {
  transition: all 0.3s ease;
}

.el-input__inner:focus {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.el-select-dropdown__item {
  transition: all 0.3s ease;
}

.el-select-dropdown__item.selected {
  font-weight: bold;
  color: var(--primary-color);
}

.el-message {
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.el-dialog {
  border-radius: 12px;
}

.el-dialog__header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.el-dialog__body {
  padding: 24px;
}

.el-dialog__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}
</style>
