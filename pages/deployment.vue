<template>
  <div class="deployment-view">
    <div class="header-container">
      <h2>部署 {{ selectedProject?.name }}</h2>
      <div class="header-controls">
        <el-form class="header-form">
          <el-form-item label="步驟組合">
            <el-select
              v-model="selectedCombinationId"
              placeholder="選擇步驟組合"
              @change="handleCombinationChange"
            >
              <el-option
                v-for="combination in availableStepCombinations"
                :key="combination.id"
                :label="combination.name"
                :value="combination.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Repo">
            <el-select
              v-model="selectedRepos"
              multiple
              filterable
              placeholder="選擇Repo"
              style="width: 100%"
              collapse-tags
              collapse-tags-tooltip
            >
              <el-option
                v-for="repo in selectedProject?.repos"
                :key="repo.name"
                :label="repo.name"
                :value="repo.name"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button @click="loginToRegistry" type="primary"
          >登入 Registry</el-button
        >
      </div>
    </div>

    <div class="progress-steps">
      <!-- 進度條區塊 -->
      <el-steps
        :active="currentStep"
        finish-status="success"
        class="progress-steps"
      >
        <el-step
          v-for="step in currentSteps"
          :key="step.id"
          :title="step.name"
        />
      </el-steps>
      <div v-if="selectedRepos.length > 0" class="selected-repos">
        <div class="repos-header">
          <span>已選擇的 Repo</span>
          <el-button
            type="primary"
            link
            @click="selectedRepos = []"
            size="small"
          >
            清除全部
          </el-button>
        </div>
        <div class="repos-content">
          <el-tag
            v-for="repo in selectedRepos"
            :key="repo"
            :type="getTagType(repoExecutionStatus[repo])"
            closable
            @close="removeRepo(repo)"
            class="repo-tag"
          >
            <span class="repo-name">{{ repo }}</span>
            <span class="status-text">{{
              getStatusText(repoExecutionStatus[repo])
            }}</span>
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 已選擇的Repo標籤 -->

    <div class="content-container">
      <!-- 主要操作區塊 -->
      <div class="deployment-main-content">
        <el-card v-if="currentStepData" class="step-card">
          <div class="step-header">
            <h3>{{ currentStepData.name }}</h3>
            <el-progress
              :percentage="completionPercentage"
              :status="allReposCompleted ? 'success' : ''"
            />
          </div>

          <div class="step-content">
            <el-form v-for="repo in selectedRepos" :key="repo">
              <el-form-item
                :label="`${repo} ${currentStepData.outputReference || ''}`"
              >
                <el-input
                  v-if="currentStepData.hasOutputReference"
                  v-model="inputValues[repo][currentStepData.outputReference]"
                  placeholder="請輸入值"
                />
              </el-form-item>
            </el-form>

            <el-form v-if="currentStepData.hasDirectory">
              <el-form-item label="資料夾">
                <el-input
                  v-model="directoryValue"
                  placeholder="請輸入資料夾路徑"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="button-group">
            <el-button
              @click="executeStep"
              type="primary"
              :disabled="!canExecute || execution"
              class="execute-button"
            >
              執行
            </el-button>
            <div class="right-buttons">
              <el-button
                @click="resetForm"
                type="info"
                :disabled="currentStep == 0"
                >重設</el-button
              >
              <el-button
                v-if="currentStep > 0"
                @click="previousStep"
                type="primary"
              >
                上一步
              </el-button>
              <el-button
                v-if="currentStep < currentSteps.length - 1"
                @click="nextStep"
                type="primary"
                :disabled="execution"
              >
                下一步
              </el-button>
              <el-button
                v-else
                @click="finish"
                type="success"
                :disabled="execution"
                >完成</el-button
              >
            </div>
          </div>
        </el-card>
      </div>

      <!-- 輸出結果區塊 -->
      <div class="output-section">
        <el-card class="output-card">
          <template #header>
            <div class="output-header">
              <span>執行結果</span>
              <el-button
                type="primary"
                link
                @click="output = ''"
                :disabled="!output"
              >
                清除
              </el-button>
            </div>
          </template>
          <pre>{{ output }}</pre>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue'
import config from '~/src/config'
import log from 'electron-log/renderer'
import { ElMessage } from 'element-plus'
import { Step, StepCombination, Project, Repo } from '~/src/config'

interface InputValues {
  [repo: string]: { [field: string]: string }
}

// 選擇的專案 ID
const selectedProjectId = computed(() => config.value().selectedProject)
// 選擇的專案資料
const selectedProject = computed<Project | undefined>(() =>
  config.value().projects.find((p) => p.id === selectedProjectId.value),
)
// 選擇的環境
const selectedEnvironment = computed(() => config.value().selectedEnvironment)

// 選擇的程式碼庫
const selectedRepos = ref<string[]>([])
// 目前步驟索引
const currentStep = ref(0)
// 輸入值
const inputValues = reactive<InputValues>({})
// 資料夾路徑值
const directoryValue = ref('')
// 執行輸出結果
const output = ref('')
// 非同步資料
const asyncData = ref('')
// 選擇的步驟組合 ID
const selectedCombinationId = ref('')
// 執行中
const execution = ref(false)
// Repo執行狀態
const repoExecutionStatus = reactive<{
  [repo: string]: 'pending' | 'success' | 'error'
}>({})

// 可用的步驟組合
const availableStepCombinations = computed<StepCombination[]>(() =>
  config
    .value()
    .stepCombinations.filter(
      (combination) =>
        combination.projectId === selectedProjectId.value &&
        combination.environment === selectedEnvironment.value,
    ),
)

// 目前步驟組合的步驟列表
const currentSteps = computed<Step[]>(() => {
  const combination = config
    .value()
    .stepCombinations.find((c) => c.id === selectedCombinationId.value)
  return (
    (combination?.steps
      .map((stepId) => config.value().steps.find((s) => s.id === stepId))
      .filter(Boolean) as Step[]) || []
  )
})

// 目前步驟資料
const currentStepData = computed<Step | undefined>(
  () => currentSteps.value[currentStep.value],
)

// 是否可以執行目前步驟
const canExecute = computed(() => {
  if (
    !selectedProject.value ||
    !currentStepData.value ||
    !selectedRepos.value.length
  )
    return false
  if (!validateInputs()) return false
  return true
})

const completionPercentage = computed(() => {
  const totalRepos = selectedRepos.value.length
  const completedRepos = Object.values(repoExecutionStatus).filter(
    (status) => status === 'success',
  ).length
  return totalRepos === 0 ? 0 : Math.round((completedRepos / totalRepos) * 100)
})

const allReposCompleted = computed(() => {
  return selectedRepos.value.every(
    (repo) => repoExecutionStatus[repo] === 'success',
  )
})

const handleCombinationChange = () => {
  resetForm()
}

watch([selectedProjectId, selectedEnvironment], () => {
  selectedCombinationId.value = ''
  resetForm()
})

// 重設表單
const resetForm = () => {
  currentStep.value = 0
  output.value = ''
  selectedRepos.value = []
  directoryValue.value = ''
  for (const repo in inputValues) {
    inputValues[repo] = {}
  }
  resetExecutionStatus()
}

// 重置執行狀態
const resetExecutionStatus = () => {
  for (const repo in repoExecutionStatus) {
    repoExecutionStatus[repo] = 'pending'
  }
}

// 驗證輸入
const validateInputs = (): boolean => {
  if (!selectedProject.value || !currentStepData.value) return false

  if (
    selectedEnvironment.value === 'manage-environments' ||
    !selectedEnvironment.value
  ) {
    ElMessage.warning('請先選擇環境。')
    return false
  }

  if (
    currentStepData.value.hasOutputReference &&
    !selectedRepos.value.every(
      (repo) =>
        inputValues[repo] &&
        currentStepData.value?.outputReference &&
        inputValues[repo][currentStepData.value.outputReference],
    )
  )
    return false

  if (currentStepData.value.hasDirectory && !directoryValue.value) return false

  return true
}

// 監控 selectedRepos 的變化，更新 inputValues
watch(selectedRepos, (newRepos, oldRepos) => {
  for (const repo of newRepos) {
    if (!(repo in inputValues)) {
      inputValues[repo] = {}
    }
    if (!(repo in repoExecutionStatus)) {
      repoExecutionStatus[repo] = 'pending'
    }
  }
  for (const oldRepo of oldRepos) {
    if (!newRepos.includes(oldRepo)) {
      delete inputValues[oldRepo]
      delete repoExecutionStatus[oldRepo]
    }
  }

  if (currentStepData.value?.outputReference) {
    newRepos.forEach((repo) => {
      if (!inputValues[repo]) {
        inputValues[repo] = {}
      }

      if (!(currentStepData.value.outputReference in inputValues[repo])) {
        inputValues[repo][currentStepData.value.outputReference] = ''
      }
    })
  }
})

// 替換變數
const replaceVariables = (command: string, repo: Repo): string => {
  const variables: Record<string, string> = {
    ...inputValues[repo.name],
    repoPath: repo.path,
    projectPath: selectedProject.value?.path || '',
    tempPath: config.value().tempPath,
    env: selectedEnvironment.value,
    todayString: getCurrentDateYYYYMMDD(),
  }

  log.info(variables)

  return command.replace(/\{([^}]+)\}/g, (match, key) =>
    variables[key] !== undefined ? variables[key] : match,
  )
}

// 取得 YYYYMMDD 日期格式
function getCurrentDateYYYYMMDD(): string {
  const today = new Date()
  const year = today.getFullYear().toString()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}

const executeStep = async () => {
  try {
    execution.value = true
    if (!currentStepData.value || !selectedProject.value) {
      return
    }

    if (!selectedRepos.value.length) {
      ElMessage.warning('請選擇至少一個Repo。')
      return
    }

    const step = currentStepData.value
    const repos = selectedProject.value.repos.filter((r) =>
      selectedRepos.value.includes(r.name),
    )

    output.value = ''

    for (const repo of repos) {
      repoExecutionStatus[repo.name] = 'pending'
      if (!inputValues[repo.name]) {
        inputValues[repo.name] = {}
      }
      const command = replaceVariables(step.command, repo)
      const directory = step.hasDirectory ? directoryValue.value : repo.path

      output.value += `步驟 ${step.name}\n執行 ${repo.name}:\n${command}\n\n`

      try {
        if (step.executionMode === 'sync') {
          const result = await window.electron.ipcRenderer.invoke(
            'execute-command',
            command,
            directory,
            step.shellType,
          )
          output.value += `[${repo.name}] ${result}\n\n`
          if (step.outputField) {
            inputValues[repo.name][step.outputField] = result.trim()
          }
        } else {
          asyncData.value = ''
          let split = command.split(' ')

          await new Promise<void>((resolve, reject) => {
            window.electron.ipcRenderer
              .invoke(
                'execute-command-stream',
                split[0],
                split.slice(1),
                directory,
                step.shellType,
              )
              .then(() => {
                if (step.outputField) {
                  inputValues[repo.name][step.outputField] =
                    asyncData.value.trim()
                }
                output.value += `\n[${repo.name}] 命令執行完成\n\n`
                resolve()
              })
              .catch((error) => {
                output.value += `[${repo.name}] 錯誤: ${error.message}\n\n`
                reject(error)
              })
          })
        }
        repoExecutionStatus[repo.name] = 'success'
      } catch (error: never) {
        output.value += `[${repo.name}] 錯誤: ${error.message}\n\n`
        repoExecutionStatus[repo.name] = 'error'
      }
    }
    if (allReposCompleted.value) {
      nextStep()
    }
  } finally {
    execution.value = false
  }
}

const nextStep = () => {
  if (currentStep.value < currentSteps.value.length - 1) {
    currentStep.value++
    resetExecutionStatus()
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    resetExecutionStatus()
  }
}

const finish = () => {
  ElMessage.success('所有步驟已完成!')
  resetForm()
}

const loginToRegistry = async () => {
  output.value = '嘗試登入 Registry...\n'

  if (!selectedProject.value || !selectedEnvironment.value) {
    output.value += '錯誤: 未選擇專案或環境。\n'
    return
  }

  const dockerLogin =
    selectedProject.value.dockerLogin[selectedEnvironment.value]

  if (
    !dockerLogin?.username ||
    !dockerLogin?.password ||
    !dockerLogin?.registry
  ) {
    output.value += `錯誤: ${selectedEnvironment.value} 環境的 Docker 登入憑證或註冊中心沒有設定。\n`
    output.value += '請在系統設定中的專案設定中配置Registry、用戶名和密碼。\n'
    return
  }

  try {
    const result = await window.electron.ipcRenderer.invoke(
      'execute-command',
      `docker login ${dockerLogin.registry} -u '${dockerLogin.username}' -p '${dockerLogin.password}'`,
      '.',
    )
    output.value += result
    output.value += `\nDocker 登入 ${dockerLogin.registry} 成功。\n`
  } catch (error: any) {
    output.value += `登入 ${dockerLogin.registry} 時發生錯誤: ${error.message}\n`
  }
}

const getTagType = (status: string | undefined) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string | undefined) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'error':
      return '錯誤'
    default:
      return '等待中'
  }
}

const removeRepo = (repo: string) => {
  selectedRepos.value = selectedRepos.value.filter((r) => r !== repo)
}

onMounted(() => {
  // 預設選擇第一個組合
  if (availableStepCombinations.value.length > 0) {
    selectedCombinationId.value = availableStepCombinations.value[0].id
  }
  if (selectedProject.value && selectedProject.value.repos.length == 1) {
    selectedRepos.value.push(selectedProject.value.repos[0].name)
  }
  window.electron.ipcRenderer.on('command-output', (data: string) => {
    output.value += data
    asyncData.value += data
  })

  window.electron.ipcRenderer.on('command-error', (data: string) => {
    output.value += `<span style="color: red;">${data}</span>`
  })
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('command-output')
  window.electron.ipcRenderer.removeAllListeners('command-error')
})
</script>

<style scoped>
.deployment-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-container {
  display: flex;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-light);
  min-height: 40px;
  flex-wrap: nowrap;
}

.header-container h2 {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  margin-right: 15px;
  flex-shrink: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
}

.header-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
}

.header-form :deep(.el-form-item) {
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
}

.header-form :deep(.el-select) {
  width: 100%;
  min-width: 100px;
}

.header-controls .el-button {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 100px;
  padding: 8px 15px;
}

@media (max-width: 1024px) {
  .header-container {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .header-form {
    flex-direction: column;
  }

  .header-controls .el-button {
    align-self: flex-start;
  }
}

.progress-steps {
  padding: 10px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 5px;
}

.content-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  margin-top: 0;
}

.deployment-main-content {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-repos {
  background-color: var(--el-bg-color-page);
  padding: 5px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 5px;
}

.output-section {
  grid-column: 2;
  position: sticky;
  top: 20px;
  align-self: start;
  height: fit-content;
}

.form-section {
  background-color: var(--el-bg-color-page);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.repos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.repos-header span {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.repos-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.repo-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  max-width: 100%;
}

.repo-tag :deep(.el-tag__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  overflow: hidden;
}

.repo-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}

.status-text {
  margin-left: 4px;
  font-size: 0.85em;
  opacity: 0.8;
  flex-shrink: 0;
}

.workflow-section {
  margin-top: 20px;
}

.el-steps {
  padding: 25px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.el-step) {
  padding-bottom: 15px;
}

:deep(.el-step__title) {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}

.step-card {
  margin: 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.step-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.step-content {
  padding: 20px 0;
}

.button-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.execute-button {
  min-width: 120px;
}

.right-buttons {
  display: flex;
  gap: 10px;
}

.output-card {
  height: 100%;
  margin: 0;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.output-header span {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.output-card pre {
  margin: 0;
  padding: 15px;
  background-color: #1e1e1e;
  color: #ffffff;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  min-height: 150px;
}

.output-card :deep(span[style*='color: red']) {
  color: #ff6b6b !important;
}

@media (min-width: 1400px) {
  .top-section {
    grid-template-columns: 2fr 1fr;
  }

  .progress-steps {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1400px) {
  .content-container {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 1024px) {
  .deployment-view {
    padding: 15px;
  }

  .content-container {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 15px;
    margin-top: 0;
  }

  .progress-steps {
    padding: 15px;
  }

  .selected-repos {
    padding: 12px;
  }

  .form-section,
  .step-card {
    padding: 15px;
  }

  .output-card pre {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .content-container {
    grid-template-columns: 1fr;
    margin-top: 0;
  }

  .deployment-main-content,
  .output-section {
    grid-column: 1;
  }

  .output-section {
    position: static;
  }

  .button-group {
    flex-direction: column;
    gap: 15px;
  }

  .right-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .execute-button {
    width: 100%;
  }
}
</style>