<template>
  <div class="step-management">
    <div class="header-actions">
      <h3 class="section-title">步驟管理</h3>
      <el-button @click="addStep" type="primary" :icon="Plus"
        >新增步驟</el-button
      >
    </div>

    <el-table :data="steps" class="step-table" border>
      <el-table-column prop="name" label="步驟名稱" min-width="150">
        <template #default="{ row }">
          <div class="step-name">{{ row.name }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="command" label="命令" min-width="250">
        <template #default="{ row }">
          <el-tooltip :content="row.command" placement="top" :show-after="1000">
            <div class="command-text">{{ row.command }}</div>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="executionMode" label="執行模式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.executionMode === 'sync' ? 'success' : 'warning'">
            {{ row.executionMode === 'sync' ? '同步' : '異步' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="shellType" label="Shell 類型" width="150">
        <template #default="{ row }">
          <el-tag type="info">{{ formatShellType(row.shellType) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <div class="step-actions">
            <el-button
              @click="editStep(row)"
              type="primary"
              :icon="Edit"
              circle
            />
            <el-button
              @click="removeStep(row.id)"
              type="danger"
              :icon="Delete"
              circle
            />
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingStep ? '編輯步驟' : '新增步驟'"
      width="650px"
      destroy-on-close
    >
      <el-form v-if="editingStep" label-width="120px" class="dialog-form">
        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>步驟名稱</span>
              <el-tooltip content="用於識別此部署步驟" placement="top">
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-input v-model="editingStep.name" placeholder="請輸入步驟名稱" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>命令</span>
              <el-tooltip
                content="要執行的具體命令，可以包含佔位符"
                placement="top"
              >
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-input
            v-model="editingStep.command"
            type="textarea"
            :rows="3"
            placeholder="請輸入要執行的命令"
            class="command-input"
          />
          <el-dropdown
            @command="insertVariable"
            trigger="click"
            class="variable-dropdown"
          >
            <el-button type="primary" :icon="Plus"> 插入變量 </el-button>
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
                  >倉庫路徑</el-dropdown-item
                >
                <el-dropdown-item command="{projectPath}"
                  >項目路徑</el-dropdown-item
                >
                <el-dropdown-item command="{tempPath}"
                  >臨時路徑</el-dropdown-item
                >
                <el-dropdown-item command="{env}">當前環境</el-dropdown-item>
                <el-dropdown-item command="{todayString}"
                  >今天日期 (YYYYMMDD)</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>執行模式</span>
              <el-tooltip
                content="同步（等待命令完成）或異步（即時顯示執行過程）"
                placement="top"
              >
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-select v-model="editingStep.executionMode" class="full-width">
            <el-option label="同步 (exec)" value="sync" />
            <el-option label="異步 (spawn)" value="async" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>輸出字段</span>
              <el-tooltip
                content="用於存儲命令輸出結果，可在後續步驟中使用"
                placement="top"
              >
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="step-switch">
            <el-switch v-model="editingStep.hasOutputField" />
            <el-input
              v-if="editingStep.hasOutputField"
              v-model="editingStep.outputField"
              placeholder="請輸入輸出字段名稱"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>引用前步輸出</span>
              <el-tooltip
                content="選擇要引用的先前步驟輸出字段"
                placement="top"
              >
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="step-switch">
            <el-switch v-model="editingStep.hasOutputReference" />
            <el-select
              v-if="editingStep.hasOutputReference"
              v-model="editingStep.outputReference"
              class="full-width"
            >
              <el-option
                v-for="output in getPreviousOutputs(editingStep)"
                :key="output"
                :label="output"
                :value="output"
              />
            </el-select>
          </div>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>執行目錄</span>
              <el-tooltip
                content="指定命令執行的目錄，預設是儲存庫路徑"
                placement="top"
              >
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="step-switch">
            <el-switch v-model="editingStep.hasDirectory" />
            <el-input
              v-if="editingStep.hasDirectory"
              v-model="editingStep.directory"
              placeholder="請輸入執行目錄路徑"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>Shell 類型</span>
              <el-tooltip content="選擇執行命令的 shell 環境" placement="top">
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-select v-model="editingStep.shellType" class="full-width">
            <el-option label="Bash" value="bash" />
            <el-option label="PowerShell" value="powershell" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="tooltip-label">
              <span>環境特定參數</span>
              <el-tooltip
                content="設定此步驟在特定環境下的參數"
                placement="top"
              >
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="step-switch">
            <el-switch v-model="editingStep.hasEnvSpecificParams" />
            <div v-if="editingStep.hasEnvSpecificParams">
              <el-form-item
                v-for="(param, index) in editingStep.envSpecificParams"
                :key="index"
                label="參數"
              >
                <el-input
                  v-model="param.key"
                  placeholder="參數名稱"
                  class="param-input"
                />
                <el-input
                  v-model="param.value"
                  placeholder="參數值"
                  class="param-input"
                />
                <el-select
                  v-model="param.environment"
                  placeholder="選擇環境"
                  class="param-select"
                >
                  <el-option
                    v-for="env in environments"
                    :key="env"
                    :label="env"
                    :value="env"
                  />
                </el-select>
                <el-button
                  @click="removeEnvSpecificParam(index)"
                  type="danger"
                  icon="el-icon-delete"
                  circle
                />
              </el-form-item>
              <el-button @click="addEnvSpecificParam" type="primary"
                >新增參數</el-button
              >
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStep">確定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, InfoFilled } from '@element-plus/icons-vue'
import config from '../config'
import { Step } from '../config'

const steps = ref<Step[]>([])
const dialogVisible = ref(false)
const editingStep = ref<Step | null>(null)
const environments = computed(() => config.value().environments)

onMounted(() => {
  steps.value = config.value().steps
})

const updateSteps = () => {
  config.set('steps', steps.value)
  config.save()
}

const formatShellType = (shellType: string) => {
  return shellType === 'powershell' ? 'POWERSHELL' : shellType.toUpperCase()
}

const addStep = () => {
  editingStep.value = {
    id: Date.now().toString(),
    name: '',
    command: '',
    executionMode: 'sync',
    hasOutputField: false,
    hasOutputReference: false,
    hasDirectory: false,
    shellType: 'bash',
    hasEnvSpecificParams: false,
    envSpecificParams: [],
  }
  dialogVisible.value = true
}

const editStep = (step: Step) => {
  editingStep.value = { ...step }
  dialogVisible.value = true
}

const removeStep = (id: string) => {
  ElMessageBox.confirm('確定要刪除這個步驟嗎？', '警告', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      steps.value = steps.value.filter((s) => s.id !== id)
      updateSteps()
      ElMessage.success('步驟已刪除')
    })
    .catch(() => {
      ElMessage.info('已取消刪除')
    })
}

const saveStep = () => {
  if (!editingStep.value) return

  const index = steps.value.findIndex((s) => s.id === editingStep.value!.id)
  if (index !== -1) {
    steps.value[index] = editingStep.value
  } else {
    steps.value.push(editingStep.value)
  }

  updateSteps()
  dialogVisible.value = false
  ElMessage.success('步驟已保存')
}

const availableFields = computed(() => {
  return steps.value
    .filter(
      (step) =>
        step.id !== editingStep.value?.id &&
        step.hasOutputField &&
        step.outputField,
    )
    .map((step) => step.outputField!)
})

const insertVariable = (variable: string) => {
  if (editingStep.value) {
    editingStep.value.command += variable
  }
}

const getPreviousOutputs = (currentStep: Step) => {
  const outputs: string[] = []
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

const addEnvSpecificParam = () => {
  if (editingStep.value) {
    if (!editingStep.value.envSpecificParams) {
      editingStep.value.envSpecificParams = []
    }
    editingStep.value.envSpecificParams.push({
      key: '',
      value: '',
      environment: '',
    })
  }
}

const removeEnvSpecificParam = (index: number) => {
  if (editingStep.value) {
    editingStep.value.envSpecificParams.splice(index, 1)
  }
}
</script>

<style scoped>
.el-button {
  margin: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.step-management {
  position: relative;
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 8px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px var(--shadow-color);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.step-table {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 12px var(--shadow-color);
}

.step-table :deep(.el-table) {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: #f8f9fa;
}

.step-table :deep(.el-table__header) {
  font-weight: 600;
}

.step-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.step-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.step-name {
  font-weight: 500;
  color: var(--text-color);
}

.command-text {
  font-family: monospace;
  padding: 4px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.step-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.step-actions .el-button {
  margin: 0;
  transition: all 0.3s ease;
}

.step-actions .el-button:hover {
  transform: translateY(-2px);
}

.dialog-form {
  margin-top: 24px;
}

.dialog-form .el-form-item {
  margin-bottom: 28px;
}

.dialog-form .command-input {
  margin-bottom: 16px;
  font-family: monospace;
}

.dialog-form .command-input :deep(.el-textarea__inner) {
  font-family: monospace;
  padding: 12px;
  line-height: 1.6;
}

.variable-dropdown {
  margin-bottom: 24px;
}

.tooltip-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-icon {
  color: var(--info-color);
  cursor: help;
  transition: color 0.3s ease;
}

.tooltip-icon:hover {
  color: var(--primary-color);
}

.step-switch {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-switch .el-input {
  margin-top: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.param-input {
  margin-bottom: 8px;
}

.param-select {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .step-management {
    padding: 16px;
  }

  .header-actions {
    flex-direction: column;
    gap: 16px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .step-table {
    margin-top: 16px;
  }

  .command-text {
    max-width: 200px;
  }

  .dialog-form {
    margin-top: 16px;
  }

  .dialog-form .el-form-item {
    margin-bottom: 20px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    padding-top: 20px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }
}
</style>
