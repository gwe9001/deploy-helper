<template>
  <div class="deployment-steps">
    <h2 v-if="selectedProject">{{ selectedProject.name }} 的部署步驟</h2>
    <h2 v-else>請先選擇一個專案</h2>

    <el-button @click="addStep" type="primary" :disabled="!selectedProject">
      新增步驟
    </el-button>

    <el-alert
      v-if="!selectedProject"
      title="未選擇專案"
      type="warning"
      description="請先在上方選擇一個專案或新增專案，然後才能添加或編輯部署步驟。"
      show-icon
      :closable="false"
      class="project-alert"
    />
    <el-card v-for="step in steps" :key="step.id" class="step-card">
      <el-form label-width="120px">
        <el-form-item>
          <template #label>
            <el-tooltip content="步驟名稱：用於識別此部署步驟" placement="top">
              <span>步驟名稱</span>
            </el-tooltip>
          </template>
          <el-input
            v-model="step.name"
            @change="updateStep(step)"
            placeholder="請輸入步驟名稱"
          />
        </el-form-item>

        <el-form-item>
          <template #label>
            <el-tooltip
              content="命令：要執行的具體命令，可以包含佔位符如 {version}, {repoPath} 等"
              placement="top"
            >
              <span>命令</span>
            </el-tooltip>
          </template>
          <el-input
            v-model="step.command"
            @change="updateStep(step)"
            placeholder="請輸入命令"
          >
            <template #append>
              <el-dropdown
                @command="insertVariable($event, step)"
                @visible-change="
                  (visible) => handleDropdownVisibleChange(visible, step)
                "
              >
                <el-button type="primary">
                  插入變量
                  <el-icon class="el-icon--right">
                    <arrow-down />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="field in availableFields"
                      :key="field"
                      :command="'{' + field + '}'"
                    >
                      {{ field }}
                    </el-dropdown-item>
                    <el-dropdown-item command="{repoPath}"
                      >倉庫路徑
                    </el-dropdown-item>
                    <el-dropdown-item command="{projectPath}"
                      >項目路徑
                    </el-dropdown-item>
                    <el-dropdown-item command="{tempPath}"
                      >臨時路徑
                    </el-dropdown-item>
                    <el-dropdown-item command="{env}"
                      >當前環境
                    </el-dropdown-item>
                    <el-dropdown-item command="{todayString}"
                      >今天日期 (YYYYMMDD)
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <template #label>
            <el-tooltip
              content="執行模式：同步（等待完成）或異步（實時輸出）"
              placement="top"
            >
              <span>執行模式</span>
            </el-tooltip>
          </template>
          <el-select
            v-model="step.executionMode"
            @change="updateStep(step)"
            placeholder="選擇執行模式"
          >
            <el-option label="同步" value="sync" />
            <el-option label="異步" value="async" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <template #label>
            <el-tooltip
              content="輸出字段：用於存儲命令輸出結果，可在後續步驟中使用"
              placement="top"
            >
              <span>輸出字段</span>
            </el-tooltip>
          </template>
          <el-switch
            v-model="step.hasOutputField"
            @change="toggleField(step, 'outputField')"
          />
          <el-input
            v-if="step.hasOutputField"
            v-model="step.outputField"
            @change="updateStep(step)"
            placeholder="請輸入輸出字段"
          />
        </el-form-item>

        <el-form-item>
          <template #label>
            <el-tooltip
              content="引用前步輸出：選擇要引用的先前步驟輸出字段，用於當前步驟的處理"
              placement="top"
            >
              <span>引用前步輸出</span>
            </el-tooltip>
          </template>
          <el-tooltip
            :content="
              !hasPreviousOutputs(step) ? '沒有可用的輸出字段可供引用' : ''
            "
            placement="top"
            :disabled="hasPreviousOutputs(step)"
          >
            <el-switch
              v-model="step.hasOutputReference"
              @change="toggleOutputReference(step)"
              :disabled="!hasPreviousOutputs(step)"
            >
            </el-switch>
          </el-tooltip>
          <template v-if="step.hasOutputReference">
            <el-select
              v-model="step.outputReference"
              @change="updateStep(step)"
              placeholder="選擇輸出字段"
            >
              <el-option
                v-for="output in getPreviousOutputs(step)"
                :key="output"
                :label="output"
                :value="output"
              />
            </el-select>
            <div class="form-item-hint">
              選擇先前步驟的輸出字段以用於當前步驟
            </div>
          </template>
        </el-form-item>

        <el-form-item>
          <template #label>
            <el-tooltip
              content="執行目錄：指定命令執行的目錄，預設是儲存庫路徑"
              placement="top"
            >
              <span>執行目錄</span>
            </el-tooltip>
          </template>
          <el-switch
            v-model="step.hasDirectory"
            @change="toggleField(step, 'directory')"
          />
          <el-input
            v-if="step.hasDirectory"
            v-model="step.directory"
            @change="updateStep(step)"
            placeholder="請輸入目錄"
          />
        </el-form-item>
      </el-form>
      <el-button @click="removeStep(step.id)" type="danger">移除步驟</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import config from '../config'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const selectedProjectId = computed(() => config.value().selectedProject || '')
const selectedProject = computed(() =>
  config.value().projects.find((p) => p.id === selectedProjectId.value),
)
const steps = ref([])
const currentEditingStepId = ref<string | null>(null)

onMounted(() => {
  if (selectedProject.value) {
    steps.value = selectedProject.value.deploymentSteps || []
  }
})

watch(selectedProjectId, (newProjectId) => {
  if (newProjectId) {
    steps.value = selectedProject.value?.deploymentSteps || []
  } else {
    steps.value = []
  }
})

const updateStep = (step) => {
  const index = steps.value.findIndex((s) => s.id === step.id)
  if (index !== -1) {
    steps.value[index] = step
    selectedProject.value.deploymentSteps = steps.value
    config.set('projects', config.value().projects)
    config.save()
  }
}

const addStep = () => {
  if (!selectedProject.value) {
    ElMessage.warning('請先選擇一個專案')
    return
  }

  const newStep = {
    id: Date.now().toString(),
    name: '新建步驟',
    command: '',
    executionMode: 'sync',
    hasOutputField: false,
    hasOutputReference: false,
    hasDirectory: false,
  }
  steps.value.push(newStep)
  selectedProject.value.deploymentSteps = steps.value
  config.set('projects', config.value().projects)
  config.save()
}

const removeStep = (id) => {
  steps.value = steps.value.filter((s) => s.id !== id)
  selectedProject.value.deploymentSteps = steps.value
  config.set('projects', config.value().projects)
  config.save()
}

const toggleField = (step, field) => {
  if (step[`has${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
    step[field] = ''
  } else {
    delete step[field]
  }
  updateStep(step)
}

const availableFields = computed(() => {
  const fields = new Set<string>()
  for (let i = 0; i < steps.value.length; i++) {
    const step = steps.value[i]
    if (step.id === currentEditingStepId.value) {
      break
    }
    if (step.outputField) {
      fields.add(step.outputField)
    }
  }
  return Array.from(fields)
})

const insertVariable = (variable: string, step: never) => {
  const input = document.querySelector(
    `input[value="${step.command}"]`,
  ) as HTMLInputElement | null
  if (input) {
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    step.command =
      step.command.substring(0, start) + variable + step.command.substring(end)
    updateStep(step)
    setTimeout(() => {
      input.setSelectionRange(start + variable.length, start + variable.length)
      input.focus()
    }, 0)
  } else {
    step.command += variable
    updateStep(step)
  }
}

const handleDropdownVisibleChange = (visible: boolean, step: never) => {
  if (visible) {
    currentEditingStepId.value = step.id
  } else {
    currentEditingStepId.value = null
  }
}

const toggleOutputReference = (step) => {
  if (step.hasOutputReference) {
    step.outputReference = ''
  } else {
    delete step.outputReference
  }
  updateStep(step)
}

const hasPreviousOutputs = (currentStep) => {
  return getPreviousOutputs(currentStep).length > 0
}

const getPreviousOutputs = (currentStep) => {
  const outputs = []
  for (const step of steps.value) {
    if (step.id === currentStep.id) {
      break
    }
    if (step.hasOutputField && step.outputField) {
      outputs.push(step.outputField)
    }
  }
  return outputs
}
</script>

<style scoped>
.deployment-steps {
  padding: 20px;
}

.step-card {
  margin-top: 20px;
}

.el-button {
  transition:
    background-color 0.3s,
    color 0.3s;
}

.el-button:hover {
  background-color: #007bff;
}
</style>
