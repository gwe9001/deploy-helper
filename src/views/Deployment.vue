<template>
  <div class="deployment">
    <div class="header-container">
      <h2>Deployment for {{ selectedProject?.name }}</h2>
      <el-button @click="loginToRegistry" type="primary"
        >登入 Registry</el-button
      >
    </div>

    <el-form>
      <el-form-item label="選擇步驟組合">
        <el-select v-model="selectedCombinationId" placeholder="選擇步驟組合">
          <el-option
            v-for="combination in availableStepCombinations"
            :key="combination.id"
            :label="combination.name"
            :value="combination.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- Repo 選擇 -->
    <el-form>
      <el-form-item label="選擇庫">
        <el-checkbox-group v-model="selectedRepos">
          <el-checkbox
            v-for="repo in selectedProject?.repos"
            :key="repo.name"
            :value="repo.name"
          >
            {{ repo.name }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <!-- 步驟顯示 -->
    <el-steps :active="currentStep" finish-status="success">
      <el-step v-for="step in currentSteps" :key="step.id" :title="step.name" />
    </el-steps>

    <!-- 當前步驟卡片 -->
    <el-card v-if="currentStepData" class="step-card">
      <h3>{{ currentStepData.name }}</h3>

      <el-form v-for="repo in selectedRepos" :key="repo">
        <el-form-item
          :label="`${repo} ${currentStepData.outputReference || ''}`"
        >
          <template v-if="currentStepData.hasOutputReference">
            <el-input
              v-model="inputValues[repo][currentStepData.outputReference]"
              @input="
                updateInputValue(repo, currentStepData.outputReference, $event)
              "
              placeholder="請輸入值"
            />
          </template>
        </el-form-item>
      </el-form>

      <el-form v-if="currentStepData.hasDirectory">
        <el-form-item label="資料夾">
          <el-input v-model="directoryValue" placeholder="請輸入資料夾路徑" />
        </el-form-item>
      </el-form>

      <el-button @click="executeStep" type="primary" :disabled="!canExecute">
        執行
      </el-button>
    </el-card>

    <!-- 輸出顯示 -->
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
import { Step, StepCombination, Project } from '../config'

const selectedProjectId = computed(() => config.value().selectedProject)
const selectedProject = computed(() =>
  config.value().projects.find((p) => p.id === selectedProjectId.value),
)
const selectedEnvironment = computed(() => config.value().selectedEnvironment)

const selectedRepos = ref<string[]>([])
const currentStep = ref(0)
const inputValues = reactive<Record<string, Record<string, string>>>({})
const directoryValue = ref('')
const output = ref('')
const asyncData = ref('')

const selectedCombinationId = ref('')

const availableStepCombinations = computed(() => {
  return config
    .value()
    .stepCombinations.filter(
      (combination) =>
        combination.projectId === selectedProjectId.value &&
        combination.environment === selectedEnvironment.value,
    )
})

const currentSteps = computed(() => {
  const combination = config
    .value()
    .stepCombinations.find((c) => c.id === selectedCombinationId.value)
  if (!combination) return []
  return combination.steps
    .map((stepId) => config.value().steps.find((s) => s.id === stepId))
    .filter(Boolean) as Step[]
})

const currentStepData = computed(() => currentSteps.value[currentStep.value])

const canExecute = computed(() => {
  return validateInputs()
})

watch([selectedProjectId, selectedEnvironment], () => {
  selectedCombinationId.value = ''
  resetForm()
})

watch(selectedCombinationId, () => {
  resetForm()
})

watch(selectedRepos, (newRepos) => {
  updateInputValues(newRepos)
})

onMounted(() => {
  // 預設選擇第一個組合
  if (availableStepCombinations.value.length > 0) {
    selectedCombinationId.value = availableStepCombinations.value[0].id
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

const resetForm = () => {
  selectedRepos.value = []
  Object.assign(inputValues, {})
  currentStep.value = 0
  output.value = ''
}

const validateInputs = () => {
  if (selectedRepos.value.length === 0) return false
  if (
    selectedEnvironment.value === 'manage-environments' ||
    !selectedEnvironment.value
  ) {
    ElMessage.warning('請先選擇環境。')
    return false
  }
  if (
    currentStepData.value?.hasOutputReference &&
    !selectedRepos.value.every(
      (repo) =>
        inputValues[repo] &&
        currentStepData.value.outputReference &&
        currentStepData.value.outputReference in inputValues[repo] &&
        inputValues[repo][currentStepData.value.outputReference],
    )
  )
    return false
  if (currentStepData.value?.hasDirectory && !directoryValue.value) return false
  return true
}

const updateInputValues = (newRepos: string[]) => {
  newRepos.forEach((repo) => {
    if (!inputValues[repo]) {
      inputValues[repo] = {}
    }
    if (currentStepData.value?.outputReference) {
      if (!(currentStepData.value.outputReference in inputValues[repo])) {
        inputValues[repo][currentStepData.value.outputReference] = ''
      }
    }
  })
  Object.keys(inputValues).forEach((repo) => {
    if (!newRepos.includes(repo)) {
      delete inputValues[repo]
    }
  })
}

const updateInputValue = (repo: string, field: string, value: string) => {
  if (!inputValues[repo]) {
    inputValues[repo] = {}
  }
  inputValues[repo][field] = value
}

const replaceVariables = (
  command: string,
  repo: { name: string; path: string },
) => {
  const variables = {
    ...inputValues[repo.name],
    repoPath: repo.path,
    projectPath: selectedProject.value?.path,
    tempPath: config.value().tempPath,
    env: selectedEnvironment.value,
    todayString: getCurrentDateYYYYMMDD(),
  }

  log.info(variables)

  return command.replace(/\{([^}]+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match
  })
}

function getCurrentDateYYYYMMDD(): string {
  const today = new Date()
  const year = today.getFullYear().toString()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}

const executeStep = async () => {
  if (!currentStepData.value || !selectedProject.value) return

  const step = currentStepData.value
  const repos = selectedProject.value.repos.filter((r) =>
    selectedRepos.value.includes(r.name),
  )

  output.value = ''

  for (const repo of repos) {
    if (!inputValues[repo.name]) {
      inputValues[repo.name] = {}
    }

    const command = replaceVariables(step.command, repo)
    const directory = step.hasDirectory ? directoryValue.value : repo.path

    output.value += `步驟 ${step.name}\n執行 ${repo.name}:\n${command}\n\n`

    if (step.executionMode === 'sync') {
      try {
        const result = await window.electron.ipcRenderer.invoke(
          'execute-command',
          command,
          directory,
        )
        output.value += `[${repo.name}] ${result}\n\n`
        if (step.outputField) {
          inputValues[repo.name][step.outputField] = result.trim()
        }
      } catch (error) {
        output.value += `[${repo.name}] 錯誤: ${error.message}\n\n`
      }
    } else {
      try {
        asyncData.value = ''
        let split = command.split(' ')
        await window.electron.ipcRenderer.invoke(
          'execute-command-stream',
          split[0],
          split.slice(1),
          directory,
        )
        if (step.outputField) {
          inputValues[repo.name][step.outputField] = asyncData.value.trim()
        }
        output.value += `\n[${repo.name}] 命令完成成功\n\n`
      } catch (error) {
        output.value += `\n[${repo.name}] 錯誤: ${error.message}\n\n`
      }
    }
  }

  if (currentStep.value < currentSteps.value.length - 1) {
    currentStep.value++
  }
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
    let result = await window.electron.ipcRenderer.invoke(
      'execute-command',
      `docker login ${registry} -u '${username}' -p '${password}'`,
      '.',
    )
    output.value += result
    output.value += `\nDocker 登入 ${registry} 成功。\n`
  } catch (error) {
    output.value += `登入 ${registry} 時發生錯誤: ${error.message}\n`
  }
}
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
</style>
