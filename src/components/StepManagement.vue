<template>
  <div class="step-management">
    <!--    <h3>步驟管理</h3>-->
    <el-button @click="addStep" type="primary">新增步驟</el-button>

    <!-- 步驟列表 -->
    <el-table :data="steps" style="width: 100%; margin-top: 20px">
      <el-table-column prop="name" label="步驟名稱" />
      <el-table-column prop="command" label="命令" />
      <el-table-column prop="executionMode" label="執行模式" />
      <el-table-column prop="shellType" label="Shell 類型" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button @click="editStep(scope.row)" type="primary" size="small"
            >編輯</el-button
          >
          <el-button
            @click="removeStep(scope.row.id)"
            type="danger"
            size="small"
            >刪除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingStep ? '編輯步驟' : '新增步驟'"
      width="70%"
    >
      <el-form v-if="editingStep" label-width="120px">
        <el-form-item>
          <template #label>
            <el-tooltip content="步驟名稱：用於識別此部署步驟" placement="top">
              <span>步驟名稱</span>
            </el-tooltip>
          </template>
          <el-input v-model="editingStep.name" />
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
            v-model="editingStep.command"
            type="textarea"
            :rows="3"
            ref="commandInput"
          />
          <el-dropdown @command="insertVariable" trigger="click">
            <el-button type="primary">
              插入變量
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
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
            <el-tooltip
              content="執行模式：同步（使用exec，等待命令完成後顯示結果）或異步（使用spawn，即時顯示執行過程）"
              placement="top"
            >
              <span>執行模式</span>
            </el-tooltip>
          </template>
          <el-select v-model="editingStep.executionMode">
            <el-option label="同步 (exec)" value="sync" />
            <el-option label="異步 (spawn)" value="async" />
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
          <el-switch v-model="editingStep.hasOutputField" />
          <el-input
            v-if="editingStep.hasOutputField"
            v-model="editingStep.outputField"
            style="margin-top: 10px"
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
          <el-switch v-model="editingStep.hasOutputReference" />
          <el-select
            v-if="editingStep.hasOutputReference"
            v-model="editingStep.outputReference"
            style="margin-top: 10px"
          >
            <el-option
              v-for="output in getPreviousOutputs(editingStep)"
              :key="output"
              :label="output"
              :value="output"
            />
          </el-select>
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
          <el-switch v-model="editingStep.hasDirectory" />
          <el-input
            v-if="editingStep.hasDirectory"
            v-model="editingStep.directory"
            style="margin-top: 10px"
          />
        </el-form-item>
        <el-form-item>
          <template #label>
            <el-tooltip
              content="Shell 類型：選擇執行命令的 shell 環境"
              placement="top"
            >
              <span>Shell 類型</span>
            </el-tooltip>
          </template>
          <el-select v-model="editingStep.shellType">
            <el-option label="Bash" value="bash" />
            <el-option label="PowerShell" value="powershell" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStep">確定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import config from '../config'
import { Step } from '../config'

const steps = ref<Step[]>(config.value().steps)
const dialogVisible = ref(false)
const editingStep = ref<Step | null>(null)

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

const updateSteps = () => {
  config.set('steps', steps.value)
  config.save()
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
</script>

<style scoped>
.el-button {
  margin: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
