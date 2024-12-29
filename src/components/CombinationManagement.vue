<template>
  <div class="combination-management">
    <div class="header-actions">
      <h3 class="section-title">步驟組合管理</h3>
      <el-button @click="addCombination" type="primary" :icon="Plus">
        新增組合
      </el-button>
    </div>

    <el-table :data="combinations" class="combination-table" border>
      <el-table-column prop="name" label="組合名稱" min-width="150">
        <template #default="{ row }">
          <div class="combination-name">{{ row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="projectName" label="適用專案" min-width="150" />
      <el-table-column prop="environment" label="適用環境" min-width="120" />
      <el-table-column label="步驟數量" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="info">{{ row.steps.length }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button
              @click="editCombination(row)"
              type="primary"
              :icon="Edit"
              circle
            />
            <el-button
              @click="viewCombination(row)"
              type="info"
              :icon="View"
              circle
            />
            <el-button
              @click="deleteCombination(row.id)"
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
      :title="editingCombination ? '編輯組合' : '新增組合'"
      width="800px"
      class="combination-dialog"
      destroy-on-close
    >
      <el-form :model="combinationForm" label-width="100px" class="dialog-form">
        <el-form-item label="組合名稱" required>
          <el-input
            v-model="combinationForm.name"
            placeholder="請輸入組合名稱"
          />
        </el-form-item>
        <el-form-item label="適用專案" required>
          <el-select
            v-model="combinationForm.projectId"
            placeholder="選擇專案"
            class="full-width"
          >
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
            class="full-width"
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
          >
            <template #default="{ option }">
              <div class="transfer-item">
                <div class="transfer-item-header">
                  <span class="transfer-item-name">{{ option.label }}</span>
                  <el-tooltip
                    :content="option.desc"
                    placement="top"
                    :show-after="100"
                  >
                    <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-transfer>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCombination">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="viewDialogVisible"
      title="查看組合詳情"
      width="700px"
      class="view-dialog"
      destroy-on-close
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="組合名稱">
          {{ viewingCombination?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="適用專案">
          {{ getProjectName(viewingCombination?.projectId) }}
        </el-descriptions-item>
        <el-descriptions-item label="適用環境">
          {{ viewingCombination?.environment }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="steps-list">
        <h4 class="steps-list-title">步驟列表：</h4>
        <el-table :data="viewingSteps" border>
          <el-table-column prop="name" label="步驟名稱" min-width="150" />
          <el-table-column prop="command" label="命令" min-width="250">
            <template #default="{ row }">
              <el-tooltip :content="row.command" placement="top">
                <div class="command-text">{{ row.command }}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="executionMode" label="執行模式" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.executionMode === 'sync' ? 'success' : 'warning'"
              >
                {{ row.executionMode === 'sync' ? '同步' : '異步' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Plus, Edit, View, Delete } from '@element-plus/icons-vue'
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

.combination-management {
  padding: 24px;
  background-color: var(--background-color);
  border-radius: 12px;
  min-height: calc(100vh - 48px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  position: relative;
}

.combination-table {
  margin-top: 20px;
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.combination-table :deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f8fafc;
}

.combination-table :deep(.el-table__header) {
  font-weight: 600;
  color: #1a1a1a;
}

.combination-table :deep(.el-table__row) {
  transition: all 0.2s ease;
}

.combination-table :deep(.el-table__row:hover) {
  background-color: #f8fafc;
}

.combination-name {
  font-weight: 500;
  color: var(--primary-color);
}

.table-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.table-actions .el-button {
  margin: 0;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.table-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.combination-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-dialog__header) {
    margin: 0;
    padding: 20px 24px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  :deep(.el-dialog__title) {
    font-weight: 600;
    font-size: 1.2rem;
    color: #1a1a1a;
  }

  :deep(.el-dialog__headerbtn) {
    top: 20px;
    right: 20px;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }
}

.dialog-form {
  margin-top: 24px;
}

.dialog-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.dialog-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #1a1a1a;
  padding-bottom: 8px;
  line-height: 1.5;
}

.dialog-form :deep(.el-input__wrapper),
.dialog-form :deep(.el-select .el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.dialog-form :deep(.el-input__wrapper:hover),
.dialog-form :deep(.el-select .el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.dialog-form :deep(.el-input__wrapper:focus-within),
.dialog-form :deep(.el-select .el-input__wrapper:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

.dialog-form :deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
  font-size: 0.95rem;
  color: #1a1a1a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  margin-top: 0;
}

.dialog-footer .el-button {
  min-width: 100px;
  height: 40px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.dialog-footer .el-button--primary {
  box-shadow: 0 2px 4px rgba(var(--el-color-primary-rgb), 0.3);
}

.dialog-footer .el-button--primary:hover {
  box-shadow: 0 4px 8px rgba(var(--el-color-primary-rgb), 0.4);
  transform: translateY(-1px);
}

.view-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-dialog__header) {
    margin: 0;
    padding: 20px 24px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  :deep(.el-dialog__title) {
    font-weight: 600;
    font-size: 1.2rem;
    color: #1a1a1a;
  }

  :deep(.el-dialog__headerbtn) {
    top: 20px;
    right: 20px;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-descriptions) {
    background-color: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e2e8f0;
  }

  :deep(.el-descriptions__cell) {
    padding: 12px 16px;
  }

  :deep(.el-descriptions__label) {
    font-weight: 500;
    color: #1a1a1a;
    width: 120px;
    background-color: #f1f5f9;
  }

  :deep(.el-descriptions__content) {
    color: #4a5568;
    line-height: 1.5;
  }

  .steps-list {
    margin-top: 32px;
  }

  .steps-list-title {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 20px;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 16px;
    position: relative;
  }

  .steps-list-title::before {
    content: '';
    position: absolute;
    left: 0;
    width: 4px;
    height: 18px;
    background-color: var(--el-color-primary);
    border-radius: 2px;
  }

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  :deep(.el-table__header) {
    background-color: #f8fafc;
  }

  :deep(.el-table__header-cell) {
    font-weight: 600;
    color: #1a1a1a;
    background-color: #f8fafc;
  }

  :deep(.el-table__row) {
    transition: background-color 0.2s ease;
  }

  :deep(.el-table__row:hover) {
    background-color: #f8fafc;
  }

  .command-text {
    font-family: monospace;
    background-color: #f8fafc;
    padding: 6px 10px;
    border-radius: 6px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9em;
    color: #4a5568;
  }
}

@media (max-width: 768px) {
  .view-dialog {
    :deep(.el-dialog) {
      width: 90% !important;
      margin: 5vh auto !important;
    }

    :deep(.el-dialog__body) {
      padding: 16px;
    }

    :deep(.el-descriptions__cell) {
      padding: 8px 12px;
    }

    :deep(.el-descriptions__label) {
      width: 100px;
    }

    .steps-list {
      margin-top: 24px;
    }

    .steps-list-title {
      font-size: 1rem;
      margin-bottom: 16px;
    }
  }
}

.el-tag {
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.el-tag--info {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

.el-tag--success {
  background-color: #ecfdf5;
  border-color: #d1fae5;
  color: #059669;
}

.el-tag--warning {
  background-color: #fff7ed;
  border-color: #ffedd5;
  color: #d97706;
}

.el-tag--primary {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.el-tag .el-tag__close {
  color: currentColor;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.el-tag .el-tag__close:hover {
  color: currentColor;
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .el-tag {
    padding: 3px 10px;
    font-size: 0.85rem;
  }
}

.combination-table :deep(.el-table__fixed-right) {
  height: 100% !important;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.05);
}

.combination-table :deep(.el-table__fixed-right-patch) {
  background-color: #f8fafc;
}

.combination-table :deep(.el-table__cell) {
  padding: 12px;
}

.combination-table :deep(.el-button.is-circle) {
  width: 36px;
  height: 36px;
  padding: 8px;
}

.combination-table :deep(.el-button.is-circle .el-icon) {
  font-size: 16px;
}

.combination-table :deep(.el-button--primary.is-circle) {
  background-color: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.combination-table :deep(.el-button--primary.is-circle:hover) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.combination-table :deep(.el-button--info.is-circle) {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

.combination-table :deep(.el-button--info.is-circle:hover) {
  background-color: #475569;
  border-color: #475569;
  color: white;
}

.combination-table :deep(.el-button--danger.is-circle) {
  background-color: #fef2f2;
  border-color: #fee2e2;
  color: #dc2626;
}

.combination-table :deep(.el-button--danger.is-circle:hover) {
  background-color: #dc2626;
  border-color: #dc2626;
  color: white;
}

.el-select :deep(.el-input__wrapper) {
  box-shadow: none;
}

.el-select :deep(.el-input__inner) {
  font-size: 0.95rem;
  color: #1a1a1a;
}

.el-select :deep(.el-select__tags) {
  margin: 3px 0;
}

.el-select :deep(.el-tag) {
  margin: 2px 4px 2px 0;
  border-radius: 4px;
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.el-select :deep(.el-tag .el-tag__close) {
  color: var(--el-color-primary);
  background-color: transparent;
}

.el-select :deep(.el-tag .el-tag__close:hover) {
  background-color: var(--el-color-primary);
  color: white;
}

.el-select :deep(.el-select__dropdown) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
}

.el-select :deep(.el-select-dropdown__item) {
  padding: 8px 12px;
  border-radius: 4px;
  margin: 2px 0;
}

.el-select :deep(.el-select-dropdown__item.hover) {
  background-color: var(--el-color-primary-light-9);
}

.el-select :deep(.el-select-dropdown__item.selected) {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .combination-management {
    padding: 16px;
    min-height: calc(100vh - 32px);
  }

  .header-actions {
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 1.4rem;
  }

  .combination-table {
    margin-top: 16px;
  }

  .table-actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dialog-footer {
    flex-direction: column;
    padding-top: 16px;
  }

  .dialog-footer .el-button {
    width: 100%;
    margin: 0;
  }

  .view-dialog :deep(.el-descriptions__label) {
    width: 100px;
  }

  .view-dialog :deep(.el-descriptions__cell) {
    padding: 8px 12px;
  }

  .combination-table :deep(.el-button.is-circle) {
    width: 32px;
    height: 32px;
    padding: 6px;
  }

  .combination-table :deep(.el-button.is-circle .el-icon) {
    font-size: 14px;
  }

  .el-select :deep(.el-input__inner) {
    font-size: 0.9rem;
  }
}

.steps-transfer {
  margin-top: 32px;
}

.steps-transfer :deep(.el-transfer) {
  display: flex;
  align-items: stretch;
  gap: 16px;
  height: 400px;
}

.steps-transfer :deep(.el-transfer__buttons) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 0;
  flex-shrink: 0;
}

.steps-transfer :deep(.el-transfer__button) {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 8px;
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.steps-transfer :deep(.el-transfer__button:hover) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.steps-transfer :deep(.el-transfer__button i) {
  font-size: 18px;
}

.steps-transfer :deep(.el-transfer-panel) {
  width: 100%;
  max-width: none;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.steps-transfer :deep(.el-transfer-panel__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 16px;
  height: auto;
}

.steps-transfer :deep(.el-transfer-panel__title) {
  font-weight: 500;
  color: #1a1a1a;
}

.steps-transfer :deep(.el-transfer-panel__filter) {
  margin: 12px 16px;
}

.steps-transfer :deep(.el-transfer-panel__filter .el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.steps-transfer :deep(.el-transfer-panel__filter .el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.steps-transfer
  :deep(.el-transfer-panel__filter .el-input__wrapper:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

.steps-transfer :deep(.el-transfer-panel__list) {
  padding: 8px;
  overflow: auto;
}

.steps-transfer :deep(.el-transfer-panel__item) {
  height: auto;
  line-height: 1.5;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.steps-transfer :deep(.el-transfer-panel__item:hover) {
  background-color: var(--el-color-primary-light-9);
}

.steps-transfer :deep(.el-transfer-panel__item.el-checkbox) {
  color: #1a1a1a;
}

.steps-transfer :deep(.el-transfer-panel__item.el-checkbox.is-checked) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.steps-transfer :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .steps-transfer :deep(.el-transfer) {
    flex-direction: column;
    height: auto;
    gap: 12px;
  }

  .steps-transfer :deep(.el-transfer__buttons) {
    flex-direction: row;
    justify-content: center;
    padding: 8px 0;
  }

  .steps-transfer :deep(.el-transfer-panel) {
    height: 300px;
  }
}
</style>
