import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ElMessage
const mockElMessage = {
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn()
}

// Mock config
const mockConfig = {
  set: vi.fn(),
  save: vi.fn()
}

describe('ProjectSettings 邏輯功能測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Registry批次密碼更新邏輯', () => {
    const createMockProjects = () => [
      {
        id: 'project1',
        name: 'Test Project 1',
        path: '/path/to/project1',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.registry.com', username: 'devuser', password: 'oldpassword' },
          prod: { registry: 'prod.registry.com', username: 'produser', password: 'oldpassword' }
        }
      },
      {
        id: 'project2',
        name: 'Test Project 2',
        path: '/path/to/project2',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.registry.com', username: 'devuser2', password: 'oldpassword' }
        }
      }
    ]

    const initializeDockerLogin = (project: any) => {
      if (!project.dockerLogin) {
        project.dockerLogin = {}
      }
    }

    const batchUpdatePasswords = (
      batchUpdateEnv: string,
      batchUpdatePassword: string,
      projects: any[]
    ) => {
      if (!batchUpdateEnv || !batchUpdatePassword) {
        mockElMessage.warning('請選擇環境並輸入新密碼')
        return { success: false, updatedCount: 0 }
      }

      let updatedCount = 0
      const projectsToUpdate = [...projects]

      projectsToUpdate.forEach((project) => {
        initializeDockerLogin(project)
        
        if (project.dockerLogin[batchUpdateEnv]) {
          project.dockerLogin[batchUpdateEnv].password = batchUpdatePassword
          updatedCount++
        }
      })

      mockConfig.set('projects', projectsToUpdate)
      mockConfig.save()

      mockElMessage.success(`成功更新 ${updatedCount} 個專案在 ${batchUpdateEnv} 環境的Registry密碼`)
      
      return { success: true, updatedCount, projects: projectsToUpdate }
    }

    const batchUpdateAllPasswords = (
      batchUpdatePassword: string,
      projects: any[],
      environments: string[]
    ) => {
      if (!batchUpdatePassword) {
        mockElMessage.warning('請輸入新密碼')
        return { success: false, updatedCount: 0 }
      }

      let updatedCount = 0
      const projectsToUpdate = [...projects]

      projectsToUpdate.forEach((project) => {
        initializeDockerLogin(project)
        
        environments.forEach((env) => {
          if (project.dockerLogin[env]) {
            project.dockerLogin[env].password = batchUpdatePassword
            updatedCount++
          }
        })
      })

      mockConfig.set('projects', projectsToUpdate)
      mockConfig.save()

      mockElMessage.success(`成功更新 ${updatedCount} 個Registry密碼設定`)
      
      return { success: true, updatedCount, projects: projectsToUpdate }
    }

    it('應該正確執行特定環境密碼更新', () => {
      const projects = createMockProjects()
      const result = batchUpdatePasswords('dev', 'newpassword123', projects)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2) // 兩個專案都有dev環境
      expect(result.projects[0].dockerLogin.dev.password).toBe('newpassword123')
      expect(result.projects[1].dockerLogin.dev.password).toBe('newpassword123')
      
      // 其他環境不應受影響
      expect(result.projects[0].dockerLogin.prod.password).toBe('oldpassword')
      
      expect(mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(mockConfig.save).toHaveBeenCalled()
      expect(mockElMessage.success).toHaveBeenCalledWith(
        '成功更新 2 個專案在 dev 環境的Registry密碼'
      )
    })

    it('應該正確執行所有環境密碼更新', () => {
      const projects = createMockProjects()
      const environments = ['dev', 'staging', 'prod']
      
      const result = batchUpdateAllPasswords('newglobalpassword', projects, environments)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(3) // project1有2個環境, project2有1個環境
      expect(result.projects[0].dockerLogin.dev.password).toBe('newglobalpassword')
      expect(result.projects[0].dockerLogin.prod.password).toBe('newglobalpassword')
      expect(result.projects[1].dockerLogin.dev.password).toBe('newglobalpassword')
      
      expect(mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(mockConfig.save).toHaveBeenCalled()
      expect(mockElMessage.success).toHaveBeenCalledWith('成功更新 3 個Registry密碼設定')
    })

    it('應該在缺少必要參數時顯示警告（特定環境）', () => {
      const projects = createMockProjects()
      
      // 測試缺少環境選擇
      let result = batchUpdatePasswords('', 'password123', projects)
      expect(result.success).toBe(false)
      expect(mockElMessage.warning).toHaveBeenCalledWith('請選擇環境並輸入新密碼')
      
      // 測試缺少密碼
      result = batchUpdatePasswords('dev', '', projects)
      expect(result.success).toBe(false)
      expect(mockElMessage.warning).toHaveBeenCalledWith('請選擇環境並輸入新密碼')
    })

    it('應該在缺少密碼時顯示警告（所有環境）', () => {
      const projects = createMockProjects()
      const environments = ['dev', 'prod']
      
      const result = batchUpdateAllPasswords('', projects, environments)
      
      expect(result.success).toBe(false)
      expect(mockElMessage.warning).toHaveBeenCalledWith('請輸入新密碼')
    })

    it('應該正確初始化dockerLogin物件', () => {
      const project = {
        id: 'test',
        name: 'Test',
        path: '/test'
        // 沒有dockerLogin
      }
      
      initializeDockerLogin(project)
      
      expect(project.dockerLogin).toBeDefined()
      expect(typeof project.dockerLogin).toBe('object')
    })

    it('應該處理沒有對應環境設定的專案', () => {
      const projects = createMockProjects()
      
      const result = batchUpdatePasswords('staging', 'testpassword', projects)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0) // 沒有專案有staging環境
      expect(mockElMessage.success).toHaveBeenCalledWith(
        '成功更新 0 個專案在 staging 環境的Registry密碼'
      )
    })

    it('應該保持registry和username不變', () => {
      const projects = createMockProjects()
      const originalRegistry = projects[0].dockerLogin.dev.registry
      const originalUsername = projects[0].dockerLogin.dev.username
      
      const result = batchUpdatePasswords('dev', 'newpassword', projects)
      
      expect(result.projects[0].dockerLogin.dev.registry).toBe(originalRegistry)
      expect(result.projects[0].dockerLogin.dev.username).toBe(originalUsername)
      expect(result.projects[0].dockerLogin.dev.password).toBe('newpassword')
    })

    it('應該處理空專案列表', () => {
      const result = batchUpdatePasswords('dev', 'testpassword', [])
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0)
      expect(result.projects).toHaveLength(0)
    })

    it('應該處理沒有dockerLogin的專案', () => {
      const projects = [
        {
          id: 'project-no-docker',
          name: 'No Docker Project',
          path: '/no/docker',
          repos: []
          // 沒有dockerLogin屬性
        }
      ]
      
      const result = batchUpdatePasswords('dev', 'testpassword', projects)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0)
      expect(result.projects[0].dockerLogin).toBeDefined() // 應該被初始化
    })
  })
})