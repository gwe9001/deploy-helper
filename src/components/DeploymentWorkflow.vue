<template>
  <div class="deployment-workflow">
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
import { ref, computed, watch } from 'vue'
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
  padding: 20px;
}

.workflow-steps {
  margin-top: 20px;
}

.step-item {
  margin-bottom: 10px;
}

.drag-handle {
  cursor: move;
  padding: 5px;
  margin-right: 10px;
  display: inline-block;
}

.add-step {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.save-button {
  margin-top: 20px;
}
</style>
