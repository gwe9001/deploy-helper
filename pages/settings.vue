<template>
  <el-main>
    <el-tabs>
      <el-tab-pane label="一般設定">
        <ConfigEditor />
      </el-tab-pane>
      <el-tab-pane label="專案設定">
        <ProjectSettings />
      </el-tab-pane>
      <el-tab-pane label="部署配置">
        <DeploymentConfiguration />
      </el-tab-pane>
    </el-tabs>
  </el-main>
</template>

<script setup lang="ts">
import ConfigEditor from '~/src/components/ConfigEditor.vue'
import ProjectSettings from '~/src/components/ProjectSettings.vue'
import DeploymentConfiguration from '~/src/components/DeploymentConfiguration.vue'
</script>