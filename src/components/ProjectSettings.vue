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
            <el-form-item label="Registry">
              <el-input
                v-model="selectedProject.dockerLogin.registry"
                placeholder="example.com"
                @change="updateProject(selectedProject)"
              />
            </el-form-item>
            <el-form-item label="使用者名稱">
              <el-input
                v-model="selectedProject.dockerLogin.username"
                placeholder="請輸入使用者名稱"
                @change="updateProject(selectedProject)"
              />
            </el-form-item>
            <el-form-item label="密碼">
              <el-input
                v-model="selectedProject.dockerLogin.password"
                placeholder="請輸入密碼"
                type="password"
                show-password
                @change="updateProject(selectedProject)"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import config from '../config'
import { Delete } from '@element-plus/icons-vue'

const projects = ref<never[]>([])
const selectedProjectId = computed(() => config.value().selectedProject || '')
const showAddRepo = ref(false)
const inputRepoName = ref('')
const inputRepoPath = ref('')

const selectedProject = computed(() => {
  return projects.value.find((p) => p.id === selectedProjectId.value)
})

onMounted(() => {
  projects.value = config.value().projects
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
  type: 'project' | 'repo' | 'newRepo',
  index?: number,
) => {
  const result = await window.electron.showOpenDialog({
    properties: ['openDirectory'],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    if (type === 'project') {
      selectedProject.value.path = selectedPath
      updateProject(selectedProject.value)
    } else if (type === 'repo' && typeof index === 'number') {
      selectedProject.value.repos[index].path = selectedPath
      updateRepo(selectedProject.value, index)
    } else if (type === 'newRepo') {
      inputRepoPath.value = selectedPath
    }
  }
}
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
</style>
