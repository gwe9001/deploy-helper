<template>
  <div class="config-editor">
    <h2>一般設定</h2>
    <el-form label-width="120px">
      <el-form-item label="環境">
        <div class="environment-list">
          <el-tag
            v-for="env in environments"
            :key="env"
            closable
            @close="removeEnvironment(env)"
          >
            {{ env.toUpperCase() }}
          </el-tag>
        </div>
        <el-input
          v-model="newEnvironment"
          placeholder="輸入新環境名稱"
          @keyup.enter="addEnvironment"
        >
          <template #append>
            <el-button @click="addEnvironment">新增</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="Git Bash 路徑">
        <el-input
          v-model="gitBashPath"
          @change="updateGitBashPath"
          placeholder="請輸入 Git Bash 執行檔的路徑"
        >
          <template #append>
            <el-button @click="openFileDialog">瀏覽</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="Registry 網站">
        <el-input
          v-model="registrySiteUrl"
          @change="updateRegistrySiteUrl"
          placeholder="請輸入 Registry 網站 的 URL"
        ></el-input>
      </el-form-item>
      <el-form-item label="臨時路徑">
        <el-input
          v-model="tempPath"
          @change="updateTempPath"
          placeholder="請輸入臨時檔案的存放路徑"
        >
          <template #append>
            <el-button @click="openFolderDialog('tempPath')">瀏覽</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="openAppPath('userData')" type="info">
          打開設定資料夾
        </el-button>
        <el-button @click="openAppPath('app')" type="info">
          打開程式資料夾
        </el-button>
        <el-button @click="exportConfig" type="primary">匯出設定</el-button>
        <el-button @click="importConfig" type="success">匯入設定</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import config from '../config'
import { ElMessage } from 'element-plus'

const environments = ref<string[]>([])
const newEnvironment = ref('')
const registrySiteUrl = ref('')
const gitBashPath = ref('')
const tempPath = ref('')

onMounted(() => {
  environments.value = config.value().environments
  gitBashPath.value = config.value().gitBashPath || ''
  registrySiteUrl.value = config.value().registrySiteUrl || ''
  tempPath.value = config.value().tempPath || ''
})

const addEnvironment = () => {
  const env = newEnvironment.value.trim().toLowerCase()
  if (env && !environments.value.includes(env)) {
    environments.value.push(env)
    updateEnvironments()
    newEnvironment.value = ''
    ElMessage.success(`環境 "${env.toUpperCase()}" 已新增`)
  } else if (environments.value.includes(env)) {
    ElMessage.warning(`環境 "${env.toUpperCase()}" 已存在`)
  }
}

const removeEnvironment = (env: string) => {
  const index = environments.value.indexOf(env)
  if (index > -1) {
    environments.value.splice(index, 1)
    updateEnvironments()
    ElMessage.success(`環境 "${env.toUpperCase()}" 已移除`)
  }
}

const updateEnvironments = () => {
  config.set('environments', environments.value)
  config.save()
}
const updateRegistrySiteUrl = () => {
  config.set('registrySiteUrl', registrySiteUrl.value.trim())
  config.save()
}

const updateGitBashPath = () => {
  config.set('gitBashPath', gitBashPath.value.trim())
  config.save()
}

const updateTempPath = () => {
  config.set('tempPath', tempPath.value.trim())
  config.save()
}

const openFileDialog = async () => {
  const result = await window.electron.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '執行檔', extensions: ['exe'] },
      { name: '所有檔案', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    gitBashPath.value = result.filePaths[0]
    updateGitBashPath()
  }
}

const openFolderDialog = async (type: 'tempPath') => {
  const result = await window.electron.showOpenDialog({
    properties: ['openDirectory'],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    if (type === 'tempPath') {
      tempPath.value = selectedPath
      updateTempPath()
    }
  }
}

const openAppPath = async (name: string) => {
  window.electron.ipcRenderer.invoke('open-app-path', name)
}

const exportConfig = async () => {
  try {
    const result = await window.electron.showSaveDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'config.json',
    })

    if (result.canceled) return

    await window.electron.ipcRenderer.invoke('export-config', result.filePath)
    ElMessage.success('設定已成功匯出')
  } catch (error) {
    ElMessage.error('匯出設定時發生錯誤')
    console.error('Error exporting config:', error)
  }
}

const importConfig = async () => {
  try {
    const result = await window.electron.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })

    if (result.canceled || result.filePaths.length === 0) return

    await window.electron.ipcRenderer.invoke(
      'import-config',
      result.filePaths[0],
    )
    ElMessage.success('設定已成功匯入')
  } catch (error) {
    ElMessage.error('匯入設定時發生錯誤')
    console.error('Error importing config:', error)
  }
}
</script>

<style scoped>
.config-editor {
  padding: 24px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  min-height: calc(100vh - 48px);
}

.config-editor h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 32px;
  color: var(--el-text-color-primary);
}

.environment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.environment-list .el-tag {
  padding: 6px 12px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.environment-list .el-tag:hover {
  transform: translateY(-1px);
}

:deep(.el-form-item) {
  margin-bottom: 24px;
  max-width: 800px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

:deep(.el-input__wrapper:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

:deep(.el-button) {
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.el-button:not(:last-child)) {
  margin-right: 12px;
}

:deep(.el-form-item:last-child) {
  margin-top: 32px;
}

@media (max-width: 768px) {
  .config-editor {
    padding: 16px;
    min-height: calc(100vh - 32px);
  }

  .config-editor h2 {
    font-size: 1.5rem;
    margin-bottom: 24px;
  }

  :deep(.el-form-item:last-child) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :deep(.el-form-item:last-child .el-form-item__content) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  :deep(.el-button) {
    width: 100%;
    margin-right: 0 !important;
  }
}
</style>
