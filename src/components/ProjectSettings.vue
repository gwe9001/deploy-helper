<template>
  <div class="project-settings">
    <h2>專案設定</h2>

    <el-alert
      v-if="!selectedProject"
      title="未選擇專案"
      type="warning"
      description="請先在上方選擇一個專案或新增專案，然後才能編輯專案。"
      show-icon
      :closable="false"
      class="project-alert"
    />

    <el-card v-if="selectedProject" class="project-card">
      <template #header>
        <div class="card-header">
          <span>專案詳情</span>
          <el-button
            @click="removeProject(selectedProject.id)"
            type="danger"
            size="small"
            >移除專案</el-button
          >
        </div>
      </template>

      <el-tabs>
        <el-tab-pane label="一般">
          <el-form label-width="120px">
            <el-form-item label="專案名稱">
              <el-input
                v-model="selectedProject.name"
                @change="updateProject(selectedProject)"
                placeholder="請輸入專案名稱"
              />
            </el-form-item>
            <el-form-item label="專案路徑">
              <el-input
                v-model="selectedProject.path"
                @change="updateProject(selectedProject)"
                placeholder="請輸入專案路徑"
              >
                <template #append>
                  <el-button @click="openFolderDialog('project')"
                    >瀏覽</el-button
                  >
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="儲存庫">
          <div class="batch-import-section">
            <el-button
              @click="showBatchImportDialog"
              type="primary"
              size="small"
            >
              批次匯入儲存庫
            </el-button>
          </div>

          <!-- 批次匯入對話框 -->
          <el-dialog
            v-model="batchImportDialogVisible"
            title="批次匯入儲存庫"
            width="50%"
          >
            <el-form>
              <el-form-item label="選擇資料夾">
                <el-input
                  v-model="batchImportPaths"
                  type="textarea"
                  :rows="3"
                  placeholder="請選擇資料夾"
                  readonly
                />
                <el-button @click="openFolderDialog('batchImport')" class="mt-2"
                  >瀏覽</el-button
                >
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="batchImportDialogVisible = false"
                  >取消</el-button
                >
                <el-button type="primary" @click="performBatchImport">
                  匯入
                </el-button>
              </span>
            </template>
          </el-dialog>
          <div v-if="selectedProject.repos.length === 0" class="no-repos">
            尚未添加儲存庫。
          </div>
          <el-card
            v-else
            v-for="(repo, index) in selectedProject.repos"
            :key="index"
            class="repo-card"
          >
            <el-form label-width="100px">
              <el-form-item label="儲存庫名稱">
                <el-input
                  v-model="repo.name"
                  @change="updateRepo(selectedProject, index)"
                  size="small"
                  placeholder="請輸入儲存庫名稱"
                />
              </el-form-item>
              <el-form-item label="儲存庫路徑">
                <el-input
                  v-model="repo.path"
                  @change="updateRepo(selectedProject, index)"
                  size="small"
                  placeholder="請輸入儲存庫路徑"
                >
                  <template #append>
                    <el-button
                      @click="openFolderDialog('repo', index)"
                      size="small"
                      >瀏覽</el-button
                    >
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
            <div class="repo-actions">
              <el-button
                @click="removeRepo(selectedProject, index)"
                type="danger"
                size="small"
                :icon="Delete"
              >
                移除
              </el-button>
            </div>
          </el-card>

          <div class="add-repo-section">
            <el-button
              v-if="!showAddRepo"
              @click="showInput"
              type="primary"
              size="small"
            >
              + 新增儲存庫
            </el-button>
            <el-card v-else class="add-repo-form">
              <el-form
                @submit.prevent="addRepo(selectedProject)"
                label-width="100px"
              >
                <el-form-item label="儲存庫名稱">
                  <el-input
                    v-model="inputRepoName"
                    placeholder="請輸入儲存庫名稱"
                    size="small"
                  />
                </el-form-item>
                <el-form-item label="儲存庫路徑">
                  <el-input
                    v-model="inputRepoPath"
                    placeholder="請輸入儲存庫路徑"
                    size="small"
                  >
                    <template #append>
                      <el-button
                        @click="openFolderDialog('newRepo')"
                        size="small"
                        >瀏覽</el-button
                      >
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    size="small"
                    @click="addRepo(selectedProject)"
                  >
                    儲存
                  </el-button>
                  <el-button size="small" @click="showAddRepo = false">
                    取消
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Registry">
          <!-- 批次更新密碼區域 -->
          <div class="batch-update-section">
            <el-card class="batch-update-card">
              <template #header>
                <div class="batch-update-header">
                  <span>批次更新Registry密碼</span>
                  <el-button 
                    @click="showAdvancedSelectionDialog" 
                    type="info" 
                    size="small"
                    plain
                  >
                    精確選擇
                  </el-button>
                </div>
              </template>
              
              <!-- 快速更新區域 -->
              <el-tabs v-model="batchUpdateMode" class="batch-update-tabs">
                <el-tab-pane label="快速更新" name="quick">
                  <el-form label-width="120px">
                    <el-form-item label="目標環境">
                      <el-select 
                        v-model="batchUpdateEnv" 
                        placeholder="請選擇要更新的環境"
                        style="width: 200px;"
                      >
                        <el-option
                          v-for="env in environments"
                          :key="env"
                          :label="env"
                          :value="env"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="新密碼">
                      <el-input
                        v-model="batchUpdatePassword"
                        placeholder="請輸入新密碼"
                        type="password"
                        show-password
                        style="width: 300px;"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button 
                        type="primary" 
                        @click="batchUpdatePasswords"
                        :disabled="!batchUpdateEnv || !batchUpdatePassword"
                      >
                        更新所有專案的此環境密碼
                      </el-button>
                      <el-button 
                        type="warning" 
                        @click="showBatchUpdateDialog"
                        :disabled="!batchUpdatePassword"
                      >
                        更新所有專案的所有環境密碼
                      </el-button>
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
                
                <el-tab-pane label="精確選擇" name="advanced">
                  <el-form label-width="120px">
                    <el-form-item label="新密碼">
                      <el-input
                        v-model="advancedUpdatePassword"
                        placeholder="請輸入新密碼"
                        type="password"
                        show-password
                        style="width: 300px;"
                      />
                    </el-form-item>
                    <el-form-item label="選擇範圍">
                      <div class="selection-summary">
                        <el-tag 
                          v-if="selectedTargets.length > 0" 
                          type="info"
                          class="summary-tag"
                        >
                          已選擇 {{ selectedTargets.length }} 個目標
                        </el-tag>
                        <el-tag 
                          v-else 
                          type="warning"
                          class="summary-tag"
                        >
                          尚未選擇任何目標
                        </el-tag>
                        <el-button 
                          @click="showAdvancedSelectionDialog" 
                          size="small"
                          type="primary"
                          plain
                        >
                          選擇目標
                        </el-button>
                      </div>
                    </el-form-item>
                    <el-form-item>
                      <el-button 
                        type="success" 
                        @click="showAdvancedUpdateConfirmDialog"
                        :disabled="!advancedUpdatePassword || selectedTargets.length === 0"
                      >
                        更新選擇的目標 ({{ selectedTargets.length }})
                      </el-button>
                      <el-button 
                        @click="clearSelectedTargets"
                        :disabled="selectedTargets.length === 0"
                      >
                        清空選擇
                      </el-button>
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </div>

          <!-- 精確選擇對話框 -->
          <el-dialog
            v-model="advancedSelectionDialogVisible"
            title="精確選擇更新目標"
            width="70%"
            :close-on-click-modal="false"
          >
            <div class="advanced-selection-content">
              <div class="selection-toolbar">
                <el-space>
                  <el-button @click="selectAllTargets" size="small">全選</el-button>
                  <el-button @click="clearSelectedTargets" size="small">清空</el-button>
                  <el-button @click="selectByEnvironment" size="small">按環境選擇</el-button>
                  <el-button @click="selectByProject" size="small">按專案選擇</el-button>
                </el-space>
                <div class="selection-count">
                  已選擇: {{ selectedTargets.length }} / {{ totalTargets }} 個目標
                </div>
              </div>

              <div class="projects-grid">
                <el-card 
                  v-for="project in allProjects" 
                  :key="project.id" 
                  class="project-selection-card"
                  shadow="hover"
                >
                  <template #header>
                    <div class="project-header">
                      <div class="project-info">
                        <el-icon><Folder /></el-icon>
                        <span class="project-name">{{ project.name }}</span>
                      </div>
                      <el-checkbox
                        :model-value="isProjectFullySelected(project.id)"
                        :indeterminate="isProjectPartiallySelected(project.id)"
                        @change="toggleProjectSelection(project.id, $event)"
                      >
                        全選專案
                      </el-checkbox>
                    </div>
                  </template>
                  
                  <div class="environments-list">
                    <div 
                      v-for="env in environments" 
                      :key="`${project.id}-${env}`"
                      class="environment-item"
                    >
                      <el-checkbox
                        :model-value="isTargetSelected(project.id, env)"
                        @change="toggleTargetSelection(project.id, env, $event)"
                        :disabled="!hasRegistryConfig(project, env)"
                      >
                        <div class="env-info">
                          <el-tag 
                            :type="getEnvironmentTagType(env)" 
                            size="small"
                            class="env-tag"
                          >
                            {{ env }}
                          </el-tag>
                          <span v-if="hasRegistryConfig(project, env)" class="registry-info">
                            {{ project.dockerLogin[env]?.registry || '未設定' }}
                          </span>
                          <el-text v-else type="info" size="small">未配置</el-text>
                        </div>
                      </el-checkbox>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
            
            <template #footer>
              <div class="dialog-footer">
                <el-button @click="advancedSelectionDialogVisible = false">取消</el-button>
                <el-button 
                  type="primary" 
                  @click="confirmAdvancedSelection"
                  :disabled="selectedTargets.length === 0"
                >
                  確認選擇 ({{ selectedTargets.length }})
                </el-button>
              </div>
            </template>
          </el-dialog>

          <!-- 批次更新確認對話框 -->
          <el-dialog
            v-model="batchUpdateDialogVisible"
            title="確認批次更新"
            width="50%"
          >
            <div>
              <p>此操作將會更新所有專案在所有環境的Registry密碼。</p>
              <p><strong>影響範圍：</strong></p>
              <ul>
                <li>專案數量：{{ allProjects.length }}</li>
                <li>環境數量：{{ environments.length }}</li>
                <li>總共將更新：{{ allProjects.length * environments.length }} 個Registry密碼</li>
              </ul>
              <p><strong>注意：此操作無法復原，請確認新密碼正確無誤。</strong></p>
            </div>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="batchUpdateDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="batchUpdateAllPasswords">
                  確認更新所有密碼
                </el-button>
              </span>
            </template>
          </el-dialog>

          <!-- 進階更新確認對話框 -->
          <el-dialog
            v-model="advancedUpdateConfirmDialogVisible"
            title="確認精確更新"
            width="60%"
          >
            <div>
              <p>此操作將會更新以下選擇的Registry密碼：</p>
              <div class="selected-targets-preview">
                <div 
                  v-for="target in selectedTargets" 
                  :key="`${target.projectId}-${target.environment}`"
                  class="target-preview-item"
                >
                  <el-tag type="info" class="project-tag">{{ getProjectName(target.projectId) }}</el-tag>
                  <el-icon><ArrowRight /></el-icon>
                  <el-tag :type="getEnvironmentTagType(target.environment)" class="env-tag">
                    {{ target.environment }}
                  </el-tag>
                  <span class="registry-preview">
                    {{ getRegistryInfo(target.projectId, target.environment) }}
                  </span>
                </div>
              </div>
              <el-divider />
              <p><strong>總共將更新：{{ selectedTargets.length }} 個Registry密碼</strong></p>
              <p><strong>注意：此操作無法復原，請確認新密碼正確無誤。</strong></p>
            </div>
            <template #footer>
              <div class="dialog-footer">
                <el-button @click="advancedUpdateConfirmDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="performAdvancedUpdate">
                  確認更新選擇的目標
                </el-button>
              </div>
            </template>
          </el-dialog>

          <el-divider />

          <!-- 原有的單一專案Registry設定 -->
          <el-form label-width="120px">
            <el-form-item label="環境">
              <el-select v-model="selectedEnv" placeholder="請選擇環境">
                <el-option
                  v-for="env in environments"
                  :key="env"
                  :label="env"
                  :value="env"
                />
              </el-select>
            </el-form-item>

            <template v-if="selectedEnv">
              <el-form-item label="Registry">
                <el-input
                  v-model="currentDockerLogin.registry"
                  placeholder="example.com"
                  @change="updateDockerLogin"
                />
              </el-form-item>
              <el-form-item label="使用者名稱">
                <el-input
                  v-model="currentDockerLogin.username"
                  placeholder="請輸入使用者名稱"
                  @change="updateDockerLogin"
                />
              </el-form-item>
              <el-form-item label="密碼">
                <el-input
                  v-model="currentDockerLogin.password"
                  placeholder="請輸入密碼"
                  type="password"
                  show-password
                  @change="updateDockerLogin"
                />
              </el-form-item>
            </template>

            <el-alert
              v-else
              title="請先選擇環境"
              type="info"
              :closable="false"
              show-icon
            />
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import config from '../config'
import { Delete, Folder, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const projects = ref<never[]>([])
const selectedProjectId = computed(() => config.value().selectedProject || '')
const showAddRepo = ref(false)
const inputRepoName = ref('')
const inputRepoPath = ref('')

const batchImportDialogVisible = ref(false)
const batchImportPaths = ref('')

const selectedEnv = ref('')
const environments = computed(() => config.value().environments)

// 批次更新Registry密碼相關變數
const batchUpdateMode = ref('quick') // 'quick' 或 'advanced'
const batchUpdateEnv = ref('')
const batchUpdatePassword = ref('')
const batchUpdateDialogVisible = ref(false)
const allProjects = computed(() => config.value().projects)

// 精確選擇相關變數
const advancedUpdatePassword = ref('')
const advancedSelectionDialogVisible = ref(false)
const advancedUpdateConfirmDialogVisible = ref(false)
const selectedTargets = ref([]) // 格式: [{ projectId: string, environment: string }]

// 計算屬性
const totalTargets = computed(() => {
  let count = 0
  allProjects.value.forEach(project => {
    environments.value.forEach(env => {
      if (hasRegistryConfig(project, env)) {
        count++
      }
    })
  })
  return count
})

const currentDockerLogin = ref({
  registry: '',
  username: '',
  password: '',
})

watch(selectedEnv, (newEnv) => {
  if (selectedProject.value && newEnv) {
    const envLogin = selectedProject.value.dockerLogin[newEnv]
    if (envLogin) {
      currentDockerLogin.value = { ...envLogin }
    } else {
      currentDockerLogin.value = {
        registry: '',
        username: '',
        password: '',
      }
    }
  }
})

const initializeDockerLogin = (project) => {
  if (!project.dockerLogin) {
    project.dockerLogin = {}
  }
}

const updateDockerLogin = () => {
  if (!selectedProject.value || !selectedEnv.value) return

  initializeDockerLogin(selectedProject.value)

  selectedProject.value.dockerLogin[selectedEnv.value] = {
    registry: currentDockerLogin.value.registry,
    username: currentDockerLogin.value.username,
    password: currentDockerLogin.value.password,
  }

  updateProject(selectedProject.value)
}

const showBatchImportDialog = () => {
  batchImportDialogVisible.value = true
}

const selectedProject = computed(() => {
  return projects.value.find((p) => p.id === selectedProjectId.value)
})

onMounted(() => {
  projects.value = config.value().projects
  projects.value.forEach(initializeDockerLogin)
  selectedEnv.value = config.value().selectedEnvironment || ''
})

const updateProject = (project: never) => {
  const index = projects.value.findIndex((p) => p.id === project.id)
  if (index !== -1) {
    projects.value[index] = project
    config.set('projects', projects.value)
    config.save()
  }
}

const updateRepo = (project: never, index: number) => {
  project.repos[index] = project.repos[index]
  updateProject(project)
}

const removeProject = (id: string) => {
  projects.value = projects.value.filter((p) => p.id !== id)
  config.set('projects', projects.value)
  config.save()
}

const showInput = () => {
  showAddRepo.value = true
}

const addRepo = (project) => {
  if (inputRepoName.value && inputRepoPath.value) {
    project.repos.push({ name: inputRepoName.value, path: inputRepoPath.value })
    updateProject(project)
    showAddRepo.value = false
    inputRepoName.value = ''
    inputRepoPath.value = ''
  }
}

const removeRepo = (project: never, index: number) => {
  project.repos.splice(index, 1)
  updateProject(project)
}

const openFolderDialog = async (
  type: 'project' | 'repo' | 'newRepo' | 'batchImport',
  index?: number,
) => {
  let dialogProperties: string[] = ['openDirectory']

  if (type === 'batchImport') {
    dialogProperties.push('multiSelections')
  }

  const result = await window.electron.showOpenDialog({
    properties: dialogProperties,
  })

  if (!result.canceled && result.filePaths.length > 0) {
    if (type === 'batchImport') {
      batchImportPaths.value = result.filePaths.join('\n')
    } else if (type === 'project') {
      selectedProject.value.path = result.filePaths[0]
      updateProject(selectedProject.value)
    } else if (type === 'repo' && typeof index === 'number') {
      selectedProject.value.repos[index].path = result.filePaths[0]
      updateRepo(selectedProject.value, index)
    } else if (type === 'newRepo') {
      inputRepoPath.value = result.filePaths[0]
    }
  }
}
const performBatchImport = async () => {
  if (!batchImportPaths.value) {
    ElMessage.warning('請選擇至少一個資料夾')
    return
  }

  try {
    const selectedPaths = batchImportPaths.value
      .split('\n')
      .filter((path) => path.trim() !== '')
    const newRepos = selectedPaths.map((folderPath: string) => ({
      name: folderPath.split(/[/\\]/).pop() || '',
      path: folderPath,
    }))

    if (selectedProject.value) {
      selectedProject.value.repos = [
        ...selectedProject.value.repos,
        ...newRepos,
      ]
      updateProject(selectedProject.value)
      ElMessage.success(`成功匯入 ${newRepos.length} 個儲存庫`)
    } else {
      ElMessage.error('未選擇專案，無法匯入儲存庫')
    }

    batchImportDialogVisible.value = false
    batchImportPaths.value = ''
  } catch (error) {
    console.error('批次匯入時發生錯誤:', error)
    ElMessage.error('批次匯入時發生錯誤')
  }
}

// 批次更新Registry密碼相關函數
const showBatchUpdateDialog = () => {
  batchUpdateDialogVisible.value = true
}

const batchUpdatePasswords = () => {
  if (!batchUpdateEnv.value || !batchUpdatePassword.value) {
    ElMessage.warning('請選擇環境並輸入新密碼')
    return
  }

  let updatedCount = 0
  const projectsToUpdate = [...projects.value]

  projectsToUpdate.forEach((project) => {
    initializeDockerLogin(project)
    
    // 檢查該專案在此環境是否有Registry設定
    if (project.dockerLogin[batchUpdateEnv.value]) {
      project.dockerLogin[batchUpdateEnv.value].password = batchUpdatePassword.value
      updatedCount++
    }
  })

  // 更新配置
  config.set('projects', projectsToUpdate)
  config.save()
  projects.value = projectsToUpdate

  ElMessage.success(`成功更新 ${updatedCount} 個專案在 ${batchUpdateEnv.value} 環境的Registry密碼`)
  
  // 清空輸入
  batchUpdateEnv.value = ''
  batchUpdatePassword.value = ''
}

const batchUpdateAllPasswords = () => {
  if (!batchUpdatePassword.value) {
    ElMessage.warning('請輸入新密碼')
    return
  }

  let updatedCount = 0
  const projectsToUpdate = [...projects.value]
  const envs = environments.value

  projectsToUpdate.forEach((project) => {
    initializeDockerLogin(project)
    
    envs.forEach((env) => {
      // 檢查該專案在此環境是否有Registry設定
      if (project.dockerLogin[env]) {
        project.dockerLogin[env].password = batchUpdatePassword.value
        updatedCount++
      }
    })
  })

  // 更新配置
  config.set('projects', projectsToUpdate)
  config.save()
  projects.value = projectsToUpdate

  ElMessage.success(`成功更新 ${updatedCount} 個Registry密碼設定`)
  
  // 關閉對話框並清空輸入
  batchUpdateDialogVisible.value = false
  batchUpdatePassword.value = ''
}

// 精確選擇相關函數
const hasRegistryConfig = (project, environment) => {
  return project.dockerLogin && project.dockerLogin[environment]
}

const getEnvironmentTagType = (env) => {
  const envTypes = {
    dev: 'success',
    development: 'success',
    staging: 'warning',
    test: 'warning',
    prod: 'danger',
    production: 'danger'
  }
  return envTypes[env.toLowerCase()] || 'info'
}

const getProjectName = (projectId) => {
  const project = allProjects.value.find(p => p.id === projectId)
  return project ? project.name : '未知專案'
}

const getRegistryInfo = (projectId, environment) => {
  const project = allProjects.value.find(p => p.id === projectId)
  if (project && project.dockerLogin && project.dockerLogin[environment]) {
    return project.dockerLogin[environment].registry || '未設定'
  }
  return '未配置'
}

const isTargetSelected = (projectId, environment) => {
  return selectedTargets.value.some(
    target => target.projectId === projectId && target.environment === environment
  )
}

const isProjectFullySelected = (projectId) => {
  const project = allProjects.value.find(p => p.id === projectId)
  if (!project) return false
  
  const availableEnvs = environments.value.filter(env => hasRegistryConfig(project, env))
  if (availableEnvs.length === 0) return false
  
  return availableEnvs.every(env => isTargetSelected(projectId, env))
}

const isProjectPartiallySelected = (projectId) => {
  const project = allProjects.value.find(p => p.id === projectId)
  if (!project) return false
  
  const availableEnvs = environments.value.filter(env => hasRegistryConfig(project, env))
  if (availableEnvs.length === 0) return false
  
  const selectedEnvs = availableEnvs.filter(env => isTargetSelected(projectId, env))
  return selectedEnvs.length > 0 && selectedEnvs.length < availableEnvs.length
}

const toggleTargetSelection = (projectId, environment, checked) => {
  if (checked) {
    // 添加目標
    if (!isTargetSelected(projectId, environment)) {
      selectedTargets.value.push({ projectId, environment })
    }
  } else {
    // 移除目標
    selectedTargets.value = selectedTargets.value.filter(
      target => !(target.projectId === projectId && target.environment === environment)
    )
  }
}

const toggleProjectSelection = (projectId, checked) => {
  const project = allProjects.value.find(p => p.id === projectId)
  if (!project) return
  
  const availableEnvs = environments.value.filter(env => hasRegistryConfig(project, env))
  
  if (checked) {
    // 選擇專案的所有環境
    availableEnvs.forEach(env => {
      if (!isTargetSelected(projectId, env)) {
        selectedTargets.value.push({ projectId, environment: env })
      }
    })
  } else {
    // 取消選擇專案的所有環境
    selectedTargets.value = selectedTargets.value.filter(
      target => target.projectId !== projectId
    )
  }
}

const selectAllTargets = () => {
  selectedTargets.value = []
  allProjects.value.forEach(project => {
    environments.value.forEach(env => {
      if (hasRegistryConfig(project, env)) {
        selectedTargets.value.push({ projectId: project.id, environment: env })
      }
    })
  })
}

const clearSelectedTargets = () => {
  selectedTargets.value = []
}

const selectByEnvironment = () => {
  // 這裡可以實作按環境選擇的邏輯，為了簡化，先實作全選dev環境
  const devTargets = []
  allProjects.value.forEach(project => {
    if (hasRegistryConfig(project, 'dev')) {
      devTargets.push({ projectId: project.id, environment: 'dev' })
    }
  })
  selectedTargets.value = devTargets
  ElMessage.info('已選擇所有dev環境')
}

const selectByProject = () => {
  // 這裡可以實作按專案選擇的邏輯，為了簡化，先選擇第一個專案的所有環境
  if (allProjects.value.length > 0) {
    const firstProject = allProjects.value[0]
    const projectTargets = []
    environments.value.forEach(env => {
      if (hasRegistryConfig(firstProject, env)) {
        projectTargets.push({ projectId: firstProject.id, environment: env })
      }
    })
    selectedTargets.value = projectTargets
    ElMessage.info(`已選擇專案「${firstProject.name}」的所有環境`)
  }
}

const showAdvancedSelectionDialog = () => {
  advancedSelectionDialogVisible.value = true
}

const confirmAdvancedSelection = () => {
  advancedSelectionDialogVisible.value = false
  batchUpdateMode.value = 'advanced'
  ElMessage.success(`已選擇 ${selectedTargets.value.length} 個更新目標`)
}

const showAdvancedUpdateConfirmDialog = () => {
  if (!advancedUpdatePassword.value) {
    ElMessage.warning('請輸入新密碼')
    return
  }
  if (selectedTargets.value.length === 0) {
    ElMessage.warning('請先選擇要更新的目標')
    return
  }
  advancedUpdateConfirmDialogVisible.value = true
}

const performAdvancedUpdate = () => {
  if (!advancedUpdatePassword.value || selectedTargets.value.length === 0) {
    ElMessage.warning('請確認密碼和選擇目標')
    return
  }

  let updatedCount = 0
  const projectsToUpdate = [...projects.value]

  // 根據選擇的目標進行更新
  selectedTargets.value.forEach(target => {
    const project = projectsToUpdate.find(p => p.id === target.projectId)
    if (project && project.dockerLogin && project.dockerLogin[target.environment]) {
      project.dockerLogin[target.environment].password = advancedUpdatePassword.value
      updatedCount++
    }
  })

  // 更新配置
  config.set('projects', projectsToUpdate)
  config.save()
  projects.value = projectsToUpdate

  ElMessage.success(`成功更新 ${updatedCount} 個Registry密碼`)
  
  // 關閉對話框並清空輸入
  advancedUpdateConfirmDialogVisible.value = false
  advancedUpdatePassword.value = ''
  clearSelectedTargets()
}

watch(selectedProject, (newProject) => {
  if (newProject && selectedEnv.value) {
    const envLogin = newProject.dockerLogin[selectedEnv.value]
    if (envLogin) {
      currentDockerLogin.value = { ...envLogin }
    } else {
      currentDockerLogin.value = {
        registry: '',
        username: '',
        password: '',
      }
    }
  }
})
</script>

<style scoped>
.project-settings {
  padding: 24px;
  background-color: var(--background-color);
  border-radius: 12px;
  min-height: calc(100vh - 48px);
}

.project-settings h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 24px;
  color: var(--el-text-color-primary);
}

.project-alert {
  margin-bottom: 24px;
}

.project-alert :deep(.el-alert__title) {
  font-size: 1rem;
  font-weight: 500;
}

.project-alert :deep(.el-alert__description) {
  margin: 8px 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.project-card {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s ease;
}

.project-card:hover {
  box-shadow: var(--el-box-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-page);
  border-radius: 12px 12px 0 0;
}

.card-header span {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.project-card :deep(.el-card__body) {
  padding: 24px;
}

.project-card :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--el-border-color-light);
}

.project-card :deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 500;
  padding: 0 24px;
  height: 44px;
  line-height: 44px;
  transition: all 0.2s ease;
}

.project-card :deep(.el-tabs__item.is-active) {
  font-weight: 600;
}

.project-card :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.project-card :deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.project-card :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.project-card :deep(.el-input__wrapper:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

.batch-import-section {
  margin-bottom: 24px;
}

.no-repos {
  text-align: center;
  padding: 32px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px dashed var(--el-border-color);
}

.repo-card {
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;
  background-color: var(--el-bg-color);
}

.repo-card:hover {
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-color-primary-light-7);
}

.repo-card :deep(.el-card__body) {
  padding: 20px;
}

.repo-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
}

.add-repo-section {
  margin-top: 24px;
}

.add-repo-form {
  margin-top: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-page);
}

.add-repo-form :deep(.el-card__body) {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.dialog-footer .el-button {
  min-width: 100px;
}

.batch-update-section {
  margin-bottom: 24px;
}

.batch-update-card {
  background-color: var(--el-bg-color-page);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
}

.batch-update-card :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.batch-update-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.batch-update-tabs {
  margin-top: 16px;
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-tag {
  margin-right: 8px;
}

/* 精確選擇對話框樣式 */
.advanced-selection-content {
  max-height: 60vh;
  overflow-y: auto;
}

.selection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 16px;
}

.selection-count {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.project-selection-card {
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;
}

.project-selection-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.environments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.environment-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.environment-item:last-child {
  border-bottom: none;
}

.env-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.env-tag {
  flex-shrink: 0;
}

.registry-info {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  opacity: 0.8;
}

/* 選擇的目標預覽樣式 */
.selected-targets-preview {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--el-bg-color-page);
}

.target-preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.target-preview-item:last-child {
  border-bottom: none;
}

.project-tag {
  flex-shrink: 0;
}

.registry-preview {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
  margin-left: auto;
}

@media (max-width: 768px) {
  .project-settings {
    padding: 16px;
    min-height: calc(100vh - 32px);
  }

  .project-settings h2 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  .card-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .card-header span {
    font-size: 1.1rem;
  }

  .project-card :deep(.el-card__body) {
    padding: 16px;
  }

  .project-card :deep(.el-tabs__item) {
    padding: 0 16px;
    height: 40px;
    line-height: 40px;
    font-size: 0.95rem;
  }

  .repo-card :deep(.el-card__body) {
    padding: 16px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }

  .repo-actions {
    flex-direction: column;
  }
}
</style>
