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
import { Delete } from '@element-plus/icons-vue'
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
  padding: 20px;
}

.project-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.project-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form-item .el-form-item {
  margin-bottom: 0;
  width: 100%;
}

.no-repos {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.add-repo-section {
  margin-top: 20px;
}

.add-repo-form {
  margin-top: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  background-color: #f5f7fa;
}

.repo-card {
  margin-bottom: 20px;
}

.repo-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.el-form-item {
  margin-bottom: 15px;
}

.el-input {
  width: 100%;
}

.el-input__inner {
  text-overflow: ellipsis;
}

.el-input:hover .el-input__inner {
  position: absolute;
  z-index: 1;
  width: auto;
  min-width: 100%;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.batch-import-section {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
