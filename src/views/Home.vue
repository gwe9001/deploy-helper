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
  const { projects, steps, stepCombinations } = config.value()
  return (
    projects.length > 0 &&
    steps.length > 0 &&
    stepCombinations.length > 0 &&
    stepCombinations.some((combination) => combination.steps.length > 0)
  )
})

const handleDeployClick = () => {
  if (hasProjectsAndSteps.value) {
    router.push('/deployment')
  } else {
    if (config.value().projects.length === 0) {
      ElMessage.warning('請先在系統設定中添加至少一個專案。')
    } else if (config.value().steps.length === 0) {
      ElMessage.warning('請先在系統設定中添加至少一個部署步驟。')
    } else if (config.value().stepCombinations.length === 0) {
      ElMessage.warning('請先在系統設定中創建至少一個步驟組合。')
    } else {
      ElMessage.warning('請確保至少一個步驟組合包含部署步驟。')
    }
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 40px;
}

.welcome-title {
  font-size: 3rem;
  color: var(--text-color);
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  animation: fadeInDown 0.8s ease-out;
}

.setup-alert {
  max-width: 600px;
  margin-bottom: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px var(--shadow-color);
  animation: fadeIn 0.8s ease-out 0.2s both;
}

.button-container {
  display: flex;
  gap: 1.5rem;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.el-button {
  padding: 18px 36px;
  font-size: 1.2rem;
  border-radius: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.el-button [class^='el-icon'] {
  font-size: 1.4rem;
  margin-right: 8px;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px;
  }

  .welcome-title {
    font-size: 2.2rem;
  }

  .button-container {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  .el-button {
    width: 100%;
    padding: 16px 24px;
    font-size: 1.1rem;
  }

  .setup-alert {
    max-width: 90%;
  }
}
</style>
