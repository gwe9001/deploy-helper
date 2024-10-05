<template>
  <el-main class="home-container">
    <h1 class="welcome-title">Deploy Helper</h1>
    <el-alert
      v-if="!hasProjectsAndSteps"
      title="請先設置專案和部署步驟"
      type="warning"
      description="在開始部署之前，請先在系統設定中添加至少一個專案並設置部署步驟。"
      show-icon
      :closable="false"
      class="setup-alert"
    />
    <div class="button-container">
      <el-button
        type="primary"
        size="large"
        @click="handleDeployClick"
        :icon="Upload"
        :disabled="!hasProjectsAndSteps"
      >
        開始部署
      </el-button>
      <el-button
        type="info"
        size="large"
        @click="router.push('/settings')"
        :icon="Setting"
      >
        系統設定
      </el-button>
    </div>
  </el-main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Setting, Upload } from '@element-plus/icons-vue'
import { computed } from 'vue'
import config from '../config'
import { ElMessage } from 'element-plus'

const router = useRouter()

const hasProjectsAndSteps = computed(() => {
  const projects = config.value().projects
  return (
    projects.length > 0 &&
    projects.some(
      (project) =>
        project.deploymentSteps && project.deploymentSteps.length > 0,
    )
  )
})

const handleDeployClick = () => {
  if (hasProjectsAndSteps.value) {
    router.push('/deployment')
  } else {
    ElMessage.warning('請先在系統設定中添加專案和設置部署步驟。')
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f0f2f5;
}

.welcome-title {
  font-size: 2.5rem;
  color: #303133;
  margin-bottom: 2rem;
  text-align: center;
}

.setup-alert {
  max-width: 600px;
  margin-bottom: 2rem;
}

.button-container {
  display: flex;
  gap: 1rem;
}

.el-button {
  padding: 15px 30px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .button-container {
    flex-direction: column;
  }

  .setup-alert {
    max-width: 90%;
  }
}
</style>
