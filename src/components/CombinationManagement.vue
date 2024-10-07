<template>
  <div class="combination-management">
    <el-button @click="addCombination" type="primary">新增組合</el-button>

    <el-table :data="combinations" style="width: 100%; margin-top: 20px">
      <el-table-column prop="name" label="組合名稱" />
      <el-table-column prop="projectName" label="適用專案" />
      <el-table-column prop="environment" label="適用環境" />
      <el-table-column label="步驟數量" width="100">
        <template #default="scope">
          {{ scope.row.steps.length }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button
            @click="editCombination(scope.row)"
            type="primary"
            size="small"
            >編輯</el-button
          >
          <el-button
            @click="viewCombination(scope.row)"
            type="info"
            size="small"
            >查看</el-button
          >
          <el-button
            @click="deleteCombination(scope.row.id)"
            type="danger"
            size="small"
            >刪除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingCombination ? '編輯組合' : '新增組合'"
      width="90%"
      class="combination-dialog"
    >
      <el-form :model="combinationForm" label-width="100px">
        <el-form-item label="組合名稱" required>
          <el-input v-model="combinationForm.name" />
        </el-form-item>
        <el-form-item label="適用專案" required>
          <el-select v-model="combinationForm.projectId" placeholder="選擇專案">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="適用環境" required>
          <el-select
            v-model="combinationForm.environment"
            placeholder="選擇環境"
          >
            <el-option
              v-for="env in environments"
              :key="env"
              :label="env"
              :value="env"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="選擇步驟" required class="steps-transfer">
          <el-transfer
            v-model="combinationForm.steps"
            :data="allSteps"
            filterable
            :titles="['可用步驟', '已選步驟']"
            :button-texts="['', '']"
            :format="{
              noChecked: '${total}',
              hasChecked: '${checked}/${total}',
            }"
          >
            <template #default="{ option }">
              <div class="transfer-item">
                <span>{{ option.label }}</span>
                <el-tooltip :content="option.desc" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
          </el-transfer>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCombination">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="查看組合詳情" width="50%">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="組合名稱">{{
          viewingCombination?.name
        }}</el-descriptions-item>
        <el-descriptions-item label="適用專案">{{
          getProjectName(viewingCombination?.projectId)
        }}</el-descriptions-item>
        <el-descriptions-item label="適用環境">{{
          viewingCombination?.environment
        }}</el-descriptions-item>
      </el-descriptions>
      <h4>步驟列表：</h4>
      <el-table :data="viewingSteps" style="width: 100%">
        <el-table-column prop="name" label="步驟名稱" />
        <el-table-column prop="command" label="命令" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import config from '../config'
import { StepCombination, Project, Step } from '../config'

const combinations = computed(() => {
  return config.value().stepCombinations.map((combination) => ({
    ...combination,
    projectName: getProjectName(combination.projectId),
  }))
})

const projects = computed(() => config.value().projects)
const environments = computed(() => config.value().environments)
const allSteps = computed(() =>
  config.value().steps.map((step) => ({
    key: step.id,
    label: step.name,
    desc: step.command,
  })),
)

const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const editingCombination = ref<StepCombination | null>(null)
const viewingCombination = ref<StepCombination | null>(null)
const viewingSteps = ref<Step[]>([])

const combinationForm = ref({
  id: '',
  name: '',
  projectId: '',
  environment: '',
  steps: [] as string[],
})

const addCombination = () => {
  editingCombination.value = null
  resetForm()
  dialogVisible.value = true
}

const editCombination = (combination: StepCombination) => {
  editingCombination.value = combination
  combinationForm.value = {
    id: combination.id,
    name: combination.name,
    projectId: combination.projectId,
    environment: combination.environment,
    steps: combination.steps,
  }
  dialogVisible.value = true
}

const viewCombination = (combination: StepCombination) => {
  viewingCombination.value = combination
  viewingSteps.value = config
    .value()
    .steps.filter((step) => combination.steps.includes(step.id))
  viewDialogVisible.value = true
}

const deleteCombination = (id: string) => {
  ElMessage.confirm('確定要刪除這個組合嗎？', '警告', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const updatedCombinations = config
        .value()
        .stepCombinations.filter((c) => c.id !== id)
      config.set('stepCombinations', updatedCombinations)
      config.save()
      ElMessage.success('組合已成功刪除')
    })
    .catch(() => {
      ElMessage.info('已取消刪除')
    })
}

const saveCombination = () => {
  if (
    !combinationForm.value.name ||
    !combinationForm.value.projectId ||
    !combinationForm.value.environment ||
    combinationForm.value.steps.length === 0
  ) {
    ElMessage.warning('請填寫所有必要信息並至少選擇一個步驟')
    return
  }

  const combination: StepCombination = {
    id: combinationForm.value.id || Date.now().toString(),
    name: combinationForm.value.name,
    projectId: combinationForm.value.projectId,
    environment: combinationForm.value.environment,
    steps: combinationForm.value.steps,
  }

  const combinations = config.value().stepCombinations
  const index = combinations.findIndex((c) => c.id === combination.id)
  if (index !== -1) {
    combinations[index] = combination
  } else {
    combinations.push(combination)
  }

  config.set('stepCombinations', combinations)
  config.save()
  ElMessage.success(editingCombination.value ? '組合已更新' : '新組合已創建')
  dialogVisible.value = false
}

const resetForm = () => {
  combinationForm.value = {
    id: '',
    name: '',
    projectId: '',
    environment: '',
    steps: [],
  }
}

const getProjectName = (projectId: string) => {
  const project = projects.value.find((p) => p.id === projectId)
  return project ? project.name : '未知專案'
}
</script>

<style scoped>
.dialog-footer {
  margin-top: 20px;
  text-align: right;
}

.el-descriptions {
  margin-bottom: 20px;
}
</style>
