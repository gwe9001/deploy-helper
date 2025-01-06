<template>
  <CustomFrame>
    <Header />
    <div class="main-content">
      <h1>Welcome to Deploy Helper</h1>
      <p>This is the main page of the application.</p>
    </div>
  </CustomFrame>
</template>

<script setup lang="ts">
import Header from '../components/Header.vue'
import CustomFrame from '../components/CustomFrame.vue'
</script>

<style scoped>
.main-content {
  padding: 24px;
  background-color: var(--background-color);
  border-radius: 12px;
  min-height: calc(100vh - 48px);
}

h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-color);
}

p {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
}
</style>
