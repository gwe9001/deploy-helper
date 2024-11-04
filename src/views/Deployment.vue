<template>
  <div class="deployment">
    <div class="header-container">
      <h2>部署 {{ selectedProject?.name }}</h2>
      <el-button @click="loginToRegistry" type="primary"
        >登入 Registry</el-button
      >
    </div>

    <el-form>
      <el-form-item label="選擇步驟組合">
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
    </el-form>

    <el-form>
      <el-form-item label="選擇Repo">
        <el-select
          v-model="selectedRepos"
          multiple
          filterable
          placeholder="選擇Repo"
          style="width: 100%"
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

    <div class="selected-repos">
      <el-tag
        v-for="repo in selectedRepos"
        :key="repo"
        :type="getTagType(repoExecutionStatus[repo])"
        closable
        @close="removeRepo(repo)"
        class="repo-tag"
      >
        {{ repo }}
        <span class="status-text">{{
          getStatusText(repoExecutionStatus[repo])
        }}</span>
      </el-tag>
    </div>

    <el-steps :active="currentStep" finish-status="success">
      <el-step v-for="step in currentSteps" :key="step.id" :title="step.name" />
    </el-steps>

    <el-card v-if="currentStepData" class="step-card">
      <div class="step-header">
        <h3>{{ currentStepData.name }}</h3>
        <el-progress
          :percentage="completionPercentage"
          :status="allReposCompleted ? 'success' : ''"
        />
      </div>

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
          <el-input v-model="directoryValue" placeholder="請輸入資料夾路徑" />
        </el-form-item>
      </el-form>

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
          <el-button @click="resetForm" type="info" :disabled="currentStep == 0"
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
          <el-button v-else @click="finish" type="success" :disabled="execution"
            >完成</el-button
          >
        </div>
      </div>
    </el-card>

    <el-card v-if="output" class="output-card">
      <h4>執行結果：</h4>
      <pre>{{ output }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue'
import config from '../config'
import log from 'electron-log/renderer'
import { ElMessage } from 'element-plus'
import { Step, StepCombination, Project, Repo } from '../config'

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

  const { username, password, registry } =
    selectedProject.value?.dockerLogin || {}

  if (!username || !password || !registry) {
    output.value += '錯誤: Docker 登入憑證或註冊中心沒有設定。\n'
    output.value += '請在系統設定中的專案設定中配置Registry、用戶名和密碼。\n'
    return
  }

  try {
    const result = await window.electron.ipcRenderer.invoke(
      'execute-command',
      `docker login ${registry} -u '${username}' -p '${password}'`,
      '.',
    )
    output.value += result
    output.value += `\nDocker 登入 ${registry} 成功。\n`
  } catch (error: any) {
    output.value += `登入 ${registry} 時發生錯誤: ${error.message}\n`
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
.deployment {
  padding: 20px;
}

.step-card,
.output-card {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.output-card pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-container h2 {
  margin: 0;
}

.el-button {
  transition: background-color 0.3s ease;
}

.el-button:hover {
  background-color: #007bff;
}

.button-group {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}

.execute-button {
  /* No specific styling needed here, unless you want to style it differently */
}

.right-buttons {
  display: flex;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.step-header h3 {
  margin: 0;
}

.el-progress {
  width: 200px;
}

.ml-2 {
  margin-left: 8px;
}

.selected-repos {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.repo-tag {
  display: flex;
  align-items: center;
  padding: 5px 10px;
}

.status-text {
  margin-left: 5px;
  font-size: 0.8em;
}
</style>
