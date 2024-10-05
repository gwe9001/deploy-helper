<template>
  <CustomFrame>
    <Header />
    <div class="main-content">
      <router-view></router-view>
    </div>
  </CustomFrame>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import CustomFrame from './components/CustomFrame.vue'
import { onMounted, ref } from 'vue'

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
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.el-button {
  transition: all 0.3s;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
