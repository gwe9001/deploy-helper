<template>
  <div class="deployment-configuration">
    <el-tabs>
      <el-tab-pane label="步驟管理">
        <StepManagement />
      </el-tab-pane>
      <el-tab-pane label="部署流程設定">
        <DeploymentWorkflow />
      </el-tab-pane>
      <el-tab-pane label="組合管理">
        <CombinationManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import StepManagement from './StepManagement.vue'
import DeploymentWorkflow from './DeploymentWorkflow.vue'
import CombinationManagement from './CombinationManagement.vue'
</script>
