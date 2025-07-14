<template>
  <CustomFrame>
    <Header />
    <div class="main-content">
      <NuxtPage />
    </div>
  </CustomFrame>
</template>

<script setup lang="ts">
import Header from '~/src/components/Header.vue'
import CustomFrame from '~/src/components/CustomFrame.vue'
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

<style scoped>
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: all 0.3s ease;
}
</style>