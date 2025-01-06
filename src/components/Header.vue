<template>
  <div class="header-wrapper">
    <el-row type="flex" justify="space-between" align="middle">
      <el-col :span="14">
        <div class="selector-group">
          <el-select
            v-model="selectedProject"
            @change="changeProject"
            placeholder="選擇專案"
            class="project-select"
          >
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
            <el-divider v-if="projects.length > 0" />
            <el-option
              key="add-new-project"
              label="+ 新增專案"
              :value="'add-new-project'"
            >
              <span style="color: var(--primary-color)">+ 新增專案</span>
            </el-option>
          </el-select>
          <el-select
            v-model="selectedEnvironment"
            @change="changeEnvironment"
            placeholder="選擇環境"
            class="env-select"
          >
            <el-option
              v-for="env in environments"
              :key="env"
              :label="env.toUpperCase()"
              :value="env"
            />
            <el-divider v-if="environments.length > 0" />
            <el-option
              key="manage-environments"
              label="管理環境"
              :value="'manage-environments'"
            >
              <span style="color: var(--primary-color)">管理環境</span>
            </el-option>
          </el-select>
        </div>
      </el-col>
      <el-col :span="6" style="text-align: right">
        <div class="button-group">
          <el-button
            @click="openRegistrySite"
            type="primary"
            class="registry-button"
            :icon="Link"
          >
            開啟 Registry
          </el-button>
          <el-button
            @click="handleDeploy"
            type="success"
            class="deploy-button"
            :icon="Upload"
          >
            部署
          </el-button>
          <el-button
            @click="handleCommand('home')"
            class="home-button"
            :icon="House"
          >
            首頁
          </el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from '#imports'
import { navigateTo } from '#imports'
import config from '../config'
import { House, Link, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const projects = computed(() => config.value().projects)
const environments = computed(() => config.value().environments)
const selectedProject = ref(config.value().selectedProject || '')
const selectedEnvironment = ref(config.value().selectedEnvironment || '')

const changeProject = () => {
  if (selectedProject.value === 'add-new-project') {
    addNewProject()
  } else {
    config.set('selectedProject', selectedProject.value)
    config.save()
  }
}

const changeEnvironment = () => {
  if (selectedEnvironment.value === 'manage-environments') {
    selectedEnvironment.value = config.value().selectedEnvironment
    navigateTo('/settings')
  } else {
    config.set('selectedEnvironment', selectedEnvironment.value)
    config.save()
  }
}

const addNewProject = () => {
  const newProject = {
    id: Date.now().toString(),
    name: '新專案',
    path: '',
    repos: [],
    dockerLogin: { registry: '', username: '', password: '' },
    deploymentSteps: [],
  }
  projects.value.push(newProject)
  selectedProject.value = newProject.id
  config.set('projects', projects.value)
  config.set('selectedProject', newProject.id)
  config.save()
  ElMessage.success('新專案已創建，請在專案設定中進行配置。')
  navigateTo('/settings')
}

onMounted(() => {
  selectedProject.value = config.value().selectedProject
  selectedEnvironment.value = config.value().selectedEnvironment
})

watch(projects, () => {
  if (selectedProject.value === 'add-new-project') {
    selectedProject.value = config.value().selectedProject || ''
  } else if (projects.value.length === 0) {
    selectedProject.value = ''
    config.set('selectedProject', '')
    config.save()
  }
})

watch(environments, (newEnvironments) => {
  if (newEnvironments.length === 0) {
    selectedEnvironment.value = ''
    config.set('selectedEnvironment', '')
    config.save()
  }
})

const handleCommand = (type: string) => {
  if (type === 'home') {
    navigateTo('/')
  }
}

const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

const openRegistrySite = () => {
  const registrySiteUrl = config.value().registrySiteUrl

  if (!registrySiteUrl) {
    ElMessage.warning('Registry 網址尚未設置。請在系統設定中設置有效的網址。')
    return
  }

  if (!isValidUrl(registrySiteUrl)) {
    ElMessage.error('Registry 網址無效。請在系統設定中設置有效的網址。')
    return
  }

  window.electron.ipcRenderer.invoke('open-external', registrySiteUrl)
}

const handleDeploy = () => {
  if (!selectedProject.value) {
    ElMessage.warning('請先選擇專案')
    return
  }
  if (!selectedEnvironment.value) {
    ElMessage.warning('請先選擇環境')
    return
  }
  navigateTo('/deployment')
}
</script>
<style scoped>
.header-wrapper {
  padding: 16px 24px;
  background-color: #fff;
  box-shadow: 0 2px 12px var(--shadow-color);
  position: relative;
  z-index: 100;
}

.el-row {
  display: flex;
  align-items: center;
}

.selector-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.el-select {
  width: 100%;
  max-width: 300px;
}

.el-select :deep(.el-input__wrapper) {
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: all 0.3s ease;
}

.el-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px var(--shadow-color);
}

.el-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-color);
}

.registry-button {
  margin-left: 16px;
  min-width: 140px;
}

.home-button {
  background-color: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.home-button:hover {
  background-color: var(--primary-color);
  color: white;
}

.home-button .el-icon {
  margin-right: 8px;
  font-size: 1.2em;
  vertical-align: middle;
}

.deploy-button {
  min-width: 100px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.deploy-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .header-wrapper {
    padding: 12px 16px;
  }

  .selector-group {
    flex-direction: column;
    gap: 12px;
  }

  .el-select {
    max-width: 100%;
  }

  .registry-button {
    margin-left: 0;
    margin-top: 12px;
    width: 100%;
  }

  .button-group {
    flex-direction: column;
    width: 100%;
  }

  .deploy-button,
  .home-button {
    margin-top: 12px;
    width: 100%;
  }
}
</style>
