import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ElMessage
const mockElMessage = {
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}

// Mock config
const mockConfig = {
  set: vi.fn(),
  save: vi.fn()
}

describe('ProjectSettings 精確選擇功能測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('目標選擇邏輯', () => {
    const createMockProjects = () => [
      {
        id: 'project1',
        name: 'Frontend App',
        path: '/projects/frontend',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.company.com', username: 'dev-user', password: 'old-password' },
          staging: { registry: 'staging.company.com', username: 'staging-user', password: 'old-password' },
          prod: { registry: 'prod.company.com', username: 'prod-user', password: 'old-password' }
        }
      },
      {
        id: 'project2',
        name: 'Backend API',
        path: '/projects/backend',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.company.com', username: 'dev-user', password: 'old-password' },
          prod: { registry: 'prod.company.com', username: 'prod-user', password: 'old-password' }
        }
      }
    ]

    const environments = ['dev', 'staging', 'prod']

    const hasRegistryConfig = (project, environment) => {
      return !!(project.dockerLogin && project.dockerLogin[environment])
    }

    const isTargetSelected = (selectedTargets, projectId, environment) => {
      return selectedTargets.some(
        target => target.projectId === projectId && target.environment === environment
      )
    }

    const isProjectFullySelected = (selectedTargets, projectId, projects, environments) => {
      const project = projects.find(p => p.id === projectId)
      if (!project) return false
      
      const availableEnvs = environments.filter(env => hasRegistryConfig(project, env))
      if (availableEnvs.length === 0) return false
      
      return availableEnvs.every(env => isTargetSelected(selectedTargets, projectId, env))
    }

    const isProjectPartiallySelected = (selectedTargets, projectId, projects, environments) => {
      const project = projects.find(p => p.id === projectId)
      if (!project) return false
      
      const availableEnvs = environments.filter(env => hasRegistryConfig(project, env))
      if (availableEnvs.length === 0) return false
      
      const selectedEnvs = availableEnvs.filter(env => isTargetSelected(selectedTargets, projectId, env))
      return selectedEnvs.length > 0 && selectedEnvs.length < availableEnvs.length
    }

    const toggleTargetSelection = (selectedTargets, projectId, environment, checked) => {
      if (checked) {
        if (!isTargetSelected(selectedTargets, projectId, environment)) {
          selectedTargets.push({ projectId, environment })
        }
      } else {
        const index = selectedTargets.findIndex(
          target => target.projectId === projectId && target.environment === environment
        )
        if (index !== -1) {
          selectedTargets.splice(index, 1)
        }
      }
      return selectedTargets
    }

    const toggleProjectSelection = (selectedTargets, projectId, checked, projects, environments) => {
      const project = projects.find(p => p.id === projectId)
      if (!project) return selectedTargets
      
      const availableEnvs = environments.filter(env => hasRegistryConfig(project, env))
      
      if (checked) {
        availableEnvs.forEach(env => {
          if (!isTargetSelected(selectedTargets, projectId, env)) {
            selectedTargets.push({ projectId, environment: env })
          }
        })
      } else {
        selectedTargets = selectedTargets.filter(
          target => target.projectId !== projectId
        )
      }
      
      return selectedTargets
    }

    it('應該正確檢測Registry配置是否存在', () => {
      const projects = createMockProjects()
      
      expect(hasRegistryConfig(projects[0], 'dev')).toBe(true)
      expect(hasRegistryConfig(projects[0], 'staging')).toBe(true)
      expect(hasRegistryConfig(projects[0], 'prod')).toBe(true)
      
      expect(hasRegistryConfig(projects[1], 'dev')).toBe(true)
      expect(hasRegistryConfig(projects[1], 'staging')).toBe(false)
      expect(hasRegistryConfig(projects[1], 'prod')).toBe(true)
    })

    it('應該正確切換單一目標選擇狀態', () => {
      let selectedTargets = []
      
      // 選擇目標
      selectedTargets = toggleTargetSelection(selectedTargets, 'project1', 'dev', true)
      expect(selectedTargets).toHaveLength(1)
      expect(isTargetSelected(selectedTargets, 'project1', 'dev')).toBe(true)
      
      // 再次選擇相同目標（不應重複）
      selectedTargets = toggleTargetSelection(selectedTargets, 'project1', 'dev', true)
      expect(selectedTargets).toHaveLength(1)
      
      // 取消選擇
      selectedTargets = toggleTargetSelection(selectedTargets, 'project1', 'dev', false)
      expect(selectedTargets).toHaveLength(0)
      expect(isTargetSelected(selectedTargets, 'project1', 'dev')).toBe(false)
    })

    it('應該正確檢測專案完全選擇狀態', () => {
      const projects = createMockProjects()
      
      // 空選擇
      let selectedTargets = []
      expect(isProjectFullySelected(selectedTargets, 'project1', projects, environments)).toBe(false)
      
      // 部分選擇
      selectedTargets = [{ projectId: 'project1', environment: 'dev' }]
      expect(isProjectFullySelected(selectedTargets, 'project1', projects, environments)).toBe(false)
      
      // 完全選擇project1的所有環境
      selectedTargets = [
        { projectId: 'project1', environment: 'dev' },
        { projectId: 'project1', environment: 'staging' },
        { projectId: 'project1', environment: 'prod' }
      ]
      expect(isProjectFullySelected(selectedTargets, 'project1', projects, environments)).toBe(true)
      
      // project2只有dev和prod環境
      selectedTargets = [
        { projectId: 'project2', environment: 'dev' },
        { projectId: 'project2', environment: 'prod' }
      ]
      expect(isProjectFullySelected(selectedTargets, 'project2', projects, environments)).toBe(true)
    })

    it('應該正確檢測專案部分選擇狀態', () => {
      const projects = createMockProjects()
      
      // 空選擇
      let selectedTargets = []
      expect(isProjectPartiallySelected(selectedTargets, 'project1', projects, environments)).toBe(false)
      
      // 部分選擇
      selectedTargets = [{ projectId: 'project1', environment: 'dev' }]
      expect(isProjectPartiallySelected(selectedTargets, 'project1', projects, environments)).toBe(true)
      
      // 完全選擇
      selectedTargets = [
        { projectId: 'project1', environment: 'dev' },
        { projectId: 'project1', environment: 'staging' },
        { projectId: 'project1', environment: 'prod' }
      ]
      expect(isProjectPartiallySelected(selectedTargets, 'project1', projects, environments)).toBe(false)
    })

    it('應該正確切換專案選擇狀態', () => {
      const projects = createMockProjects()
      let selectedTargets = []
      
      // 選擇project1的所有環境
      selectedTargets = toggleProjectSelection(selectedTargets, 'project1', true, projects, environments)
      expect(selectedTargets).toHaveLength(3) // dev, staging, prod
      expect(isProjectFullySelected(selectedTargets, 'project1', projects, environments)).toBe(true)
      
      // 取消選擇project1
      selectedTargets = toggleProjectSelection(selectedTargets, 'project1', false, projects, environments)
      expect(selectedTargets).toHaveLength(0)
      expect(isProjectFullySelected(selectedTargets, 'project1', projects, environments)).toBe(false)
      
      // 選擇project2的所有環境
      selectedTargets = toggleProjectSelection(selectedTargets, 'project2', true, projects, environments)
      expect(selectedTargets).toHaveLength(2) // dev, prod (沒有staging)
      expect(isProjectFullySelected(selectedTargets, 'project2', projects, environments)).toBe(true)
    })
  })

  describe('批次選擇功能', () => {
    const createMockProjects = () => [
      {
        id: 'project1',
        name: 'Frontend App',
        dockerLogin: {
          dev: { registry: 'dev.company.com', username: 'dev-user', password: 'old-password' },
          prod: { registry: 'prod.company.com', username: 'prod-user', password: 'old-password' }
        }
      },
      {
        id: 'project2',
        name: 'Backend API',
        dockerLogin: {
          dev: { registry: 'dev.company.com', username: 'dev-user', password: 'old-password' }
        }
      },
      {
        id: 'project3',
        name: 'Legacy System',
        dockerLogin: {
          prod: { registry: 'legacy.company.com', username: 'legacy-user', password: 'old-password' }
        }
      }
    ]

    const environments = ['dev', 'staging', 'prod']

    const hasRegistryConfig = (project, environment) => {
      return !!(project.dockerLogin && project.dockerLogin[environment])
    }

    const selectAllTargets = (projects, environments) => {
      const targets = []
      projects.forEach(project => {
        environments.forEach(env => {
          if (hasRegistryConfig(project, env)) {
            targets.push({ projectId: project.id, environment: env })
          }
        })
      })
      return targets
    }

    const selectByEnvironment = (projects, targetEnv) => {
      const targets = []
      projects.forEach(project => {
        if (hasRegistryConfig(project, targetEnv)) {
          targets.push({ projectId: project.id, environment: targetEnv })
        }
      })
      return targets
    }

    it('應該正確執行全選操作', () => {
      const projects = createMockProjects()
      const selectedTargets = selectAllTargets(projects, environments)
      
      expect(selectedTargets).toHaveLength(4) // project1(dev,prod) + project2(dev) + project3(prod)
      
      // 驗證包含的目標
      const targetIds = selectedTargets.map(t => `${t.projectId}-${t.environment}`)
      expect(targetIds).toContain('project1-dev')
      expect(targetIds).toContain('project1-prod')
      expect(targetIds).toContain('project2-dev')
      expect(targetIds).toContain('project3-prod')
      
      // 不應包含不存在的配置
      expect(targetIds).not.toContain('project1-staging')
      expect(targetIds).not.toContain('project2-staging')
      expect(targetIds).not.toContain('project2-prod')
    })

    it('應該正確執行按環境選擇操作', () => {
      const projects = createMockProjects()
      
      // 選擇dev環境
      const devTargets = selectByEnvironment(projects, 'dev')
      expect(devTargets).toHaveLength(2) // project1, project2
      expect(devTargets.every(t => t.environment === 'dev')).toBe(true)
      
      // 選擇prod環境
      const prodTargets = selectByEnvironment(projects, 'prod')
      expect(prodTargets).toHaveLength(2) // project1, project3
      expect(prodTargets.every(t => t.environment === 'prod')).toBe(true)
      
      // 選擇staging環境（沒有專案有此環境）
      const stagingTargets = selectByEnvironment(projects, 'staging')
      expect(stagingTargets).toHaveLength(0)
    })
  })

  describe('精確更新功能', () => {
    const performAdvancedUpdate = (selectedTargets, newPassword, projects) => {
      if (!newPassword || selectedTargets.length === 0) {
        mockElMessage.warning('請確認密碼和選擇目標')
        return { success: false, updatedCount: 0 }
      }

      let updatedCount = 0
      const projectsToUpdate = [...projects]

      selectedTargets.forEach(target => {
        const project = projectsToUpdate.find(p => p.id === target.projectId)
        if (project && project.dockerLogin && project.dockerLogin[target.environment]) {
          project.dockerLogin[target.environment].password = newPassword
          updatedCount++
        }
      })

      mockConfig.set('projects', projectsToUpdate)
      mockConfig.save()

      mockElMessage.success(`成功更新 ${updatedCount} 個Registry密碼`)
      
      return { success: true, updatedCount, projects: projectsToUpdate }
    }

    it('應該正確執行精確更新操作', () => {
      const projects = [
        {
          id: 'project1',
          name: 'Frontend App',
          dockerLogin: {
            dev: { registry: 'dev.company.com', username: 'dev-user', password: 'old-password' },
            prod: { registry: 'prod.company.com', username: 'prod-user', password: 'old-password' }
          }
        },
        {
          id: 'project2',
          name: 'Backend API',
          dockerLogin: {
            dev: { registry: 'dev.company.com', username: 'dev-user', password: 'old-password' }
          }
        }
      ]

      const selectedTargets = [
        { projectId: 'project1', environment: 'dev' },
        { projectId: 'project2', environment: 'dev' }
      ]

      const result = performAdvancedUpdate(selectedTargets, 'new-password-123', projects)

      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2)
      
      // 驗證密碼被正確更新
      expect(result.projects[0].dockerLogin.dev.password).toBe('new-password-123')
      expect(result.projects[1].dockerLogin.dev.password).toBe('new-password-123')
      
      // 驗證未選擇的環境密碼保持不變
      expect(result.projects[0].dockerLogin.prod.password).toBe('old-password')
      
      // 驗證其他屬性保持不變
      expect(result.projects[0].dockerLogin.dev.registry).toBe('dev.company.com')
      expect(result.projects[0].dockerLogin.dev.username).toBe('dev-user')

      expect(mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(mockConfig.save).toHaveBeenCalled()
      expect(mockElMessage.success).toHaveBeenCalledWith('成功更新 2 個Registry密碼')
    })

    it('應該在缺少密碼時顯示警告', () => {
      const projects = []
      const selectedTargets = [{ projectId: 'project1', environment: 'dev' }]

      const result = performAdvancedUpdate(selectedTargets, '', projects)

      expect(result.success).toBe(false)
      expect(result.updatedCount).toBe(0)
      expect(mockElMessage.warning).toHaveBeenCalledWith('請確認密碼和選擇目標')
    })

    it('應該在沒有選擇目標時顯示警告', () => {
      const projects = []
      const selectedTargets = []

      const result = performAdvancedUpdate(selectedTargets, 'password123', projects)

      expect(result.success).toBe(false)
      expect(result.updatedCount).toBe(0)
      expect(mockElMessage.warning).toHaveBeenCalledWith('請確認密碼和選擇目標')
    })

    it('應該忽略不存在的專案或環境', () => {
      const projects = [
        {
          id: 'project1',
          name: 'Test Project',
          dockerLogin: {
            dev: { registry: 'dev.com', username: 'user', password: 'old-password' }
          }
        }
      ]

      const selectedTargets = [
        { projectId: 'project1', environment: 'dev' }, // 存在
        { projectId: 'project1', environment: 'staging' }, // 環境不存在
        { projectId: 'project2', environment: 'dev' }, // 專案不存在
      ]

      const result = performAdvancedUpdate(selectedTargets, 'new-password', projects)

      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(1) // 只有1個有效目標被更新
      expect(result.projects[0].dockerLogin.dev.password).toBe('new-password')
    })
  })

  describe('工具函數測試', () => {
    it('應該正確取得環境標籤類型', () => {
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

      expect(getEnvironmentTagType('dev')).toBe('success')
      expect(getEnvironmentTagType('DEV')).toBe('success')
      expect(getEnvironmentTagType('staging')).toBe('warning')
      expect(getEnvironmentTagType('prod')).toBe('danger')
      expect(getEnvironmentTagType('production')).toBe('danger')
      expect(getEnvironmentTagType('unknown')).toBe('info')
    })

    it('應該正確取得專案名稱', () => {
      const projects = [
        { id: 'project1', name: 'Frontend App' },
        { id: 'project2', name: 'Backend API' }
      ]

      const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId)
        return project ? project.name : '未知專案'
      }

      expect(getProjectName('project1')).toBe('Frontend App')
      expect(getProjectName('project2')).toBe('Backend API')
      expect(getProjectName('nonexistent')).toBe('未知專案')
    })

    it('應該正確取得Registry資訊', () => {
      const projects = [
        {
          id: 'project1',
          dockerLogin: {
            dev: { registry: 'dev.company.com', username: 'user', password: 'pass' },
            prod: { registry: '', username: 'user', password: 'pass' }
          }
        },
        {
          id: 'project2',
          dockerLogin: {}
        }
      ]

      const getRegistryInfo = (projectId, environment) => {
        const project = projects.find(p => p.id === projectId)
        if (project && project.dockerLogin && project.dockerLogin[environment]) {
          return project.dockerLogin[environment].registry || '未設定'
        }
        return '未配置'
      }

      expect(getRegistryInfo('project1', 'dev')).toBe('dev.company.com')
      expect(getRegistryInfo('project1', 'prod')).toBe('未設定')
      expect(getRegistryInfo('project1', 'staging')).toBe('未配置')
      expect(getRegistryInfo('project2', 'dev')).toBe('未配置')
      expect(getRegistryInfo('nonexistent', 'dev')).toBe('未配置')
    })
  })
})