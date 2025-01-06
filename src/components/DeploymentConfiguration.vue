<template>
  <div class="deployment-configuration">
    <el-tabs class="custom-tabs">
      <el-tab-pane label="步驟管理" name="steps">
        <div class="tab-content">
          <StepManagement />
        </div>
      </el-tab-pane>
      <el-tab-pane label="部署流程設定" name="workflow">
        <div class="tab-content">
          <DeploymentWorkflow />
        </div>
      </el-tab-pane>
      <el-tab-pane label="組合管理" name="combinations">
        <div class="tab-content">
          <CombinationManagement />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '#imports'
import StepManagement from './StepManagement.vue'
import DeploymentWorkflow from './DeploymentWorkflow.vue'
import CombinationManagement from './CombinationManagement.vue'
</script>

<style scoped>
.deployment-configuration {
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 8px;
  height: 100%;
}

.custom-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 var(--shadow-color);
}

.custom-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.custom-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--border-color);
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 1rem;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  transition: all 0.3s ease;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
  transform: translateY(-2px);
}

.custom-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-content {
  min-height: 400px;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .deployment-configuration {
    padding: 10px;
  }

  .custom-tabs {
    padding: 15px;
  }

  .custom-tabs :deep(.el-tabs__item) {
    padding: 0 15px;
    font-size: 0.9rem;
  }

  .tab-content {
    padding: 15px 0;
  }
}
</style>
