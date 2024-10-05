<template>
  <div class="header-wrapper">
    <el-row type="flex" justify="space-between" align="middle">
      <el-col :span="20">
        <div style="display: flex; align-items: center; gap: 15px">
          <el-select
            v-model="selectedProject"
            @change="changeProject"
            placeholder="選擇專案"
            style="flex: 1"
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
              <span style="color: #409eff">+ 新增專案</span>
            </el-option>
          </el-select>
          <el-select
            v-model="selectedEnvironment"
            @change="changeEnvironment"
            placeholder="選擇環境"
            style="flex: 1"
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
              <span style="color: #409eff">管理環境</span>
            </el-option>
          </el-select>
          <el-button @click="openRegistrySite" type="primary" size="small">
            開啟 Registry 網站
          </el-button>
        </div>
      </el-col>
      <el-col :span="4" style="text-align: right">
        <el-button
          @click="handleCommand('home')"
          class="focus:outline-none"
          plain
          type="info"
          :icon="House"
        >
          首頁
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import config from '../config'
import { House } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
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
    router.push('/settings')
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
  router.push('/settings')
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
    router.push('/')
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
</script>
<style scoped>
.header-wrapper {
  padding: 10px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-select {
  width: 100%;
}

.el-button {
  transition: all 0.3s;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
