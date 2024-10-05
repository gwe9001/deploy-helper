<template>
  <el-main>
    <el-tabs>
      <el-tab-pane label="一般設定">
        <ConfigEditor />
      </el-tab-pane>
      <el-tab-pane label="專案設定">
        <ProjectSettings />
      </el-tab-pane>
      <el-tab-pane label="部署步驟">
        <DeploymentSteps />
      </el-tab-pane>
    </el-tabs>
  </el-main>
</template>

<script setup lang="ts">
import ConfigEditor from '../components/ConfigEditor.vue'
import ProjectSettings from '../components/ProjectSettings.vue'
import DeploymentSteps from '../components/DeploymentSteps.vue'
</script>
