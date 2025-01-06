<template>
  <div class="deployment-workflow">
    <h2>部署工作流</h2>
    <el-form :model="form" label-width="120px">
      <el-form-item label="選擇專案">
        <el-select
          v-model="form.projectId"
          placeholder="請選擇專案"
          @change="handleProjectChange"
        >
          <el-option
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="選擇環境">
        <el-select
          v-model="form.environment"
          placeholder="請選擇環境"
          @change="handleEnvironmentChange"
        >
          <el-option
            v-for="env in environments"
            :key="env"
            :label="env"
            :value="env"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="選擇組合">
        <el-select
          v-model="form.combinationId"
          placeholder="請選擇組合"
          @change="handleCombinationChange"
        >
          <el-option
            v-for="combination in availableCombinations"
            :key="combination.id"
            :label="combination.name"
            :value="combination.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div v-if="workflowSteps.length > 0" class="workflow-steps">
      <h4>工作流步驟</h4>
      <VueDraggable
        v-model="workflowSteps"
        handle=".drag-handle"
        @end="handleDragEnd"
      >
        <transition-group>
          <div v-for="step in workflowSteps" :key="step.id" class="step-item">
            <el-card>
              <div class="drag-handle">
                <el-icon><Rank /></el-icon>
              </div>
              <h5>{{ step.name }}</h5>
              <p>{{ step.command }}</p>
              <el-button @click="removeStep(step)" size="small" type="danger"
                >移除</el-button
              >
            </el-card>
          </div>
        </transition-group>
      </VueDraggable>
    </div>

    <div class="add-step">
      <el-select
        v-model="selectedStepToAdd"
        placeholder="選擇步驟以添加"
        filterable
      >
        <el-option
          v-for="step in availableSteps"
          :key="step.id"
          :label="step.name"
          :value="step.id"
        />
      </el-select>
      <el-button @click="addStep" type="primary" :disabled="!selectedStepToAdd"
        >添加步驟</el-button
      >
    </div>

    <el-button @click="saveWorkflow" type="primary" class="save-button"
      >保存工作流</el-button
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '#imports'
import { VueDraggable } from 'vue-draggable-plus'
import { ElMessage } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'
import config from '../config'
import { Project, StepCombination, Step } from '../config'

const form = ref({
  projectId: '',
  environment: '',
  combinationId: '',
})

const projects = computed(() => config.value().projects)
const environments = computed(() => config.value().environments)
const allCombinations = computed(() => config.value().stepCombinations)
const allSteps = computed(() => config.value().steps)

const availableCombinations = computed(() => {
  return allCombinations.value.filter(
    (combination) =>
      combination.projectId === form.value.projectId &&
      combination.environment === form.value.environment,
  )
})

const workflowSteps = ref<Step[]>([])
const selectedStepToAdd = ref('')

const availableSteps = computed(() => {
  const currentStepIds = new Set(workflowSteps.value.map((step) => step.id))
  return allSteps.value.filter((step) => !currentStepIds.has(step.id))
})

watch(
  () => form.value.projectId,
  () => {
    form.value.environment = ''
    form.value.combinationId = ''
    workflowSteps.value = []
  },
)

watch(
  () => form.value.environment,
  () => {
    form.value.combinationId = ''
    workflowSteps.value = []
  },
)

const handleProjectChange = () => {
  // 可以在這裡添加額外的邏輯，如果需要的話
}

const handleEnvironmentChange = () => {
  // 可以在這裡添加額外的邏輯，如果需要的話
}

const handleCombinationChange = () => {
  const selectedCombination = allCombinations.value.find(
    (c) => c.id === form.value.combinationId,
  )
  if (selectedCombination) {
    workflowSteps.value = selectedCombination.steps
      .map((stepId) => allSteps.value.find((step) => step.id === stepId))
      .filter((step): step is Step => step !== undefined)
  } else {
    workflowSteps.value = []
  }
}

const handleDragEnd = () => {
  // 可以在這裡添加拖拽結束後的邏輯，如果需要的話
}

const addStep = () => {
  if (selectedStepToAdd.value) {
    const stepToAdd = allSteps.value.find(
      (step) => step.id === selectedStepToAdd.value,
    )
    if (stepToAdd) {
      workflowSteps.value.push(stepToAdd)
      selectedStepToAdd.value = ''
    }
  }
}

const removeStep = (stepToRemove: Step) => {
  workflowSteps.value = workflowSteps.value.filter(
    (step) => step.id !== stepToRemove.id,
  )
}

const saveWorkflow = () => {
  if (
    !form.value.projectId ||
    !form.value.environment ||
    workflowSteps.value.length === 0
  ) {
    ElMessage.warning('請確保已選擇專案和環境，並且工作流中至少有一個步驟')
    return
  }

  const updatedCombination: StepCombination = {
    id: form.value.combinationId || Date.now().toString(),
    name: `${form.value.projectId}-${form.value.environment}-workflow`,
    projectId: form.value.projectId,
    environment: form.value.environment,
    steps: workflowSteps.value.map((step) => step.id),
  }

  const combinations = config.value().stepCombinations
  const index = combinations.findIndex((c) => c.id === updatedCombination.id)
  if (index !== -1) {
    combinations[index] = updatedCombination
  } else {
    combinations.push(updatedCombination)
  }

  config.set('stepCombinations', combinations)
  config.save()

  ElMessage.success('工作流已保存')
  form.value.combinationId = updatedCombination.id
}
</script>

<style scoped>
.deployment-workflow {
  padding: 24px;
  background-color: var(--background-color);
  border-radius: 12px;
  min-height: calc(100vh - 48px);
}

.deployment-workflow h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 24px;
  color: #1a1a1a;
}

.deployment-workflow :deep(.el-form) {
  background-color: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.deployment-workflow :deep(.el-form-item__label) {
  font-weight: 500;
  color: #1a1a1a;
  padding-bottom: 8px;
  line-height: 1.5;
}

.deployment-workflow :deep(.el-select .el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.deployment-workflow :deep(.el-select .el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.deployment-workflow :deep(.el-select .el-input__wrapper:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

.workflow-steps {
  margin-top: 32px;
  background-color: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.workflow-steps h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 20px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  position: relative;
}

.workflow-steps h4::before {
  content: '';
  position: absolute;
  left: 0;
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

.step-item {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.step-item:hover {
  transform: translateY(-2px);
}

.step-item :deep(.el-card) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.step-item :deep(.el-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-item :deep(.el-card__body) {
  padding: 16px;
}

.drag-handle {
  cursor: move;
  padding: 8px;
  margin-bottom: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  background-color: #f1f5f9;
  color: #475569;
}

.step-item h5 {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0 0 8px;
  color: #1a1a1a;
}

.step-item p {
  font-family: monospace;
  background-color: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0 0 16px;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-all;
}

.step-item :deep(.el-button--danger) {
  background-color: #fef2f2;
  border-color: #fee2e2;
  color: #dc2626;
}

.step-item :deep(.el-button--danger:hover) {
  background-color: #dc2626;
  border-color: #dc2626;
  color: white;
}

.add-step {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.add-step :deep(.el-select) {
  flex: 1;
}

.add-step :deep(.el-button) {
  height: 40px;
  padding: 0 24px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-step :deep(.el-button--primary) {
  box-shadow: 0 2px 4px rgba(var(--el-color-primary-rgb), 0.3);
}

.add-step :deep(.el-button--primary:hover) {
  box-shadow: 0 4px 8px rgba(var(--el-color-primary-rgb), 0.4);
  transform: translateY(-1px);
}

.save-button {
  margin-top: 32px;
  width: 100%;
  height: 44px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(var(--el-color-primary-rgb), 0.3);
}

.save-button:hover {
  box-shadow: 0 4px 8px rgba(var(--el-color-primary-rgb), 0.4);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .deployment-workflow {
    padding: 16px;
    min-height: calc(100vh - 32px);
  }

  .deployment-workflow h2 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  .deployment-workflow :deep(.el-form) {
    padding: 16px;
  }

  .workflow-steps {
    margin-top: 24px;
    padding: 16px;
  }

  .workflow-steps h4 {
    font-size: 1.1rem;
    margin-bottom: 16px;
  }

  .step-item {
    margin-bottom: 12px;
  }

  .step-item h5 {
    font-size: 1rem;
  }

  .add-step {
    margin-top: 24px;
    padding: 16px;
    flex-direction: column;
  }

  .add-step :deep(.el-button) {
    width: 100%;
  }

  .save-button {
    margin-top: 24px;
  }
}
</style>
