import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock整個配置系統
const createMockConfig = () => {
  const mockData = {
    configVersion: 4,
    selectedProject: 'project1',
    selectedEnvironment: 'dev',
    gitBashPath: '',
    registrySiteUrl: '',
    tempPath: '',
    projects: [
      {
        id: 'project1',
        name: 'Frontend App',
        path: '/projects/frontend',
        repos: [
          { name: 'main-repo', path: '/projects/frontend/main' },
          { name: 'shared-lib', path: '/projects/frontend/shared' }
        ],
        dockerLogin: {
          dev: {
            registry: 'dev.company.com',
            username: 'dev-user',
            password: 'old-dev-password'
          },
          staging: {
            registry: 'staging.company.com',
            username: 'staging-user',
            password: 'old-staging-password'
          },
          prod: {
            registry: 'prod.company.com',
            username: 'prod-user',
            password: 'old-prod-password'
          }
        }
      },
      {
        id: 'project2',
        name: 'Backend API',
        path: '/projects/backend',
        repos: [
          { name: 'api-server', path: '/projects/backend/api' }
        ],
        dockerLogin: {
          dev: {
            registry: 'dev.company.com',
            username: 'dev-user',
            password: 'old-dev-password'
          },
          prod: {
            registry: 'prod.company.com',
            username: 'prod-user',
            password: 'old-prod-password'
          }
          // 注意：沒有staging環境
        }
      },
      {
        id: 'project3',
        name: 'Legacy System',
        path: '/projects/legacy',
        repos: [],
        dockerLogin: {
          // 只有prod環境
          prod: {
            registry: 'legacy.company.com',
            username: 'legacy-user',
            password: 'old-legacy-password'
          }
        }
      }
    ],
    environments: ['dev', 'staging', 'prod'],
    steps: [],
    stepCombinations: []
  }

  return {
    data: mockData,
    value: () => mockData,
    set: vi.fn((key: string, value: any) => {
      mockData[key] = value
    }),
    save: vi.fn()
  }
}

describe('Registry密碼更新整合測試', () => {
  let mockConfig: any
  let batchUpdateService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig = createMockConfig()
    
    // 模擬批次更新服務
    batchUpdateService = {
      updateSpecificEnvironment: (env: string, newPassword: string) => {
        const projects = [...mockConfig.data.projects]
        let updatedCount = 0
        
        projects.forEach((project) => {
          if (project.dockerLogin && project.dockerLogin[env]) {
            project.dockerLogin[env].password = newPassword
            updatedCount++
          }
        })
        
        mockConfig.set('projects', projects)
        mockConfig.save()
        
        return { success: true, updatedCount }
      },
      
      updateAllEnvironments: (newPassword: string) => {
        const projects = [...mockConfig.data.projects]
        const environments = mockConfig.data.environments
        let updatedCount = 0
        
        projects.forEach((project) => {
          if (project.dockerLogin) {
            environments.forEach((env) => {
              if (project.dockerLogin[env]) {
                project.dockerLogin[env].password = newPassword
                updatedCount++
              }
            })
          }
        })
        
        mockConfig.set('projects', projects)
        mockConfig.save()
        
        return { success: true, updatedCount }
      }
    }
  })

  describe('特定環境密碼更新', () => {
    it('應該成功更新dev環境的所有專案密碼', () => {
      const newPassword = 'new-dev-password-2024'
      const result = batchUpdateService.updateSpecificEnvironment('dev', newPassword)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2) // project1和project2有dev環境
      
      const projects = mockConfig.data.projects
      expect(projects[0].dockerLogin.dev.password).toBe(newPassword)
      expect(projects[1].dockerLogin.dev.password).toBe(newPassword)
      
      // 其他環境不應受影響
      expect(projects[0].dockerLogin.staging.password).toBe('old-staging-password')
      expect(projects[0].dockerLogin.prod.password).toBe('old-prod-password')
      
      expect(mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(mockConfig.save).toHaveBeenCalled()
    })

    it('應該成功更新staging環境的專案密碼', () => {
      const newPassword = 'new-staging-password-2024'
      const result = batchUpdateService.updateSpecificEnvironment('staging', newPassword)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(1) // 只有project1有staging環境
      
      const projects = mockConfig.data.projects
      expect(projects[0].dockerLogin.staging.password).toBe(newPassword)
      
      // 其他專案的staging環境應該不存在或不被影響
      expect(projects[1].dockerLogin.staging).toBeUndefined()
      expect(projects[2].dockerLogin.staging).toBeUndefined()
    })

    it('應該成功更新prod環境的所有專案密碼', () => {
      const newPassword = 'new-prod-password-2024'
      const result = batchUpdateService.updateSpecificEnvironment('prod', newPassword)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(3) // 所有專案都有prod環境
      
      const projects = mockConfig.data.projects
      expect(projects[0].dockerLogin.prod.password).toBe(newPassword)
      expect(projects[1].dockerLogin.prod.password).toBe(newPassword)
      expect(projects[2].dockerLogin.prod.password).toBe(newPassword)
    })

    it('應該處理不存在的環境', () => {
      const newPassword = 'test-password'
      const result = batchUpdateService.updateSpecificEnvironment('nonexistent', newPassword)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0) // 沒有專案有這個環境
      
      expect(mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(mockConfig.save).toHaveBeenCalled()
    })
  })

  describe('所有環境密碼更新', () => {
    it('應該成功更新所有專案所有環境的密碼', () => {
      const newPassword = 'global-password-2024'
      const result = batchUpdateService.updateAllEnvironments(newPassword)
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(6) // 總共6個Registry設定
      
      const projects = mockConfig.data.projects
      
      // project1: dev, staging, prod (3個)
      expect(projects[0].dockerLogin.dev.password).toBe(newPassword)
      expect(projects[0].dockerLogin.staging.password).toBe(newPassword)
      expect(projects[0].dockerLogin.prod.password).toBe(newPassword)
      
      // project2: dev, prod (2個)
      expect(projects[1].dockerLogin.dev.password).toBe(newPassword)
      expect(projects[1].dockerLogin.prod.password).toBe(newPassword)
      
      // project3: prod (1個)
      expect(projects[2].dockerLogin.prod.password).toBe(newPassword)
      
      expect(mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(mockConfig.save).toHaveBeenCalled()
    })

    it('應該保持registry和username不變', () => {
      const originalRegistries = {
        project1Dev: mockConfig.data.projects[0].dockerLogin.dev.registry,
        project1DevUser: mockConfig.data.projects[0].dockerLogin.dev.username,
        project2Prod: mockConfig.data.projects[1].dockerLogin.prod.registry,
        project2ProdUser: mockConfig.data.projects[1].dockerLogin.prod.username
      }
      
      batchUpdateService.updateAllEnvironments('new-global-password')
      
      const projects = mockConfig.data.projects
      
      // 驗證registry和username保持不變
      expect(projects[0].dockerLogin.dev.registry).toBe(originalRegistries.project1Dev)
      expect(projects[0].dockerLogin.dev.username).toBe(originalRegistries.project1DevUser)
      expect(projects[1].dockerLogin.prod.registry).toBe(originalRegistries.project2Prod)
      expect(projects[1].dockerLogin.prod.username).toBe(originalRegistries.project2ProdUser)
    })
  })

  describe('邊界情況和錯誤處理', () => {
    it('應該處理空專案列表', () => {
      mockConfig.data.projects = []
      
      const result = batchUpdateService.updateAllEnvironments('test-password')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0)
    })

    it('應該處理沒有dockerLogin的專案', () => {
      mockConfig.data.projects = [
        {
          id: 'project-no-docker',
          name: 'No Docker Project',
          path: '/no/docker',
          repos: []
          // 沒有dockerLogin屬性
        }
      ]
      
      const result = batchUpdateService.updateSpecificEnvironment('dev', 'test-password')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0)
    })

    it('應該處理空的dockerLogin物件', () => {
      mockConfig.data.projects = [
        {
          id: 'project-empty-docker',
          name: 'Empty Docker Project',
          path: '/empty/docker',
          repos: [],
          dockerLogin: {} // 空物件
        }
      ]
      
      const result = batchUpdateService.updateAllEnvironments('test-password')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0)
    })
  })

  describe('資料完整性驗證', () => {
    it('更新後應該維持專案的其他屬性不變', () => {
      const originalProject1 = JSON.parse(JSON.stringify(mockConfig.data.projects[0]))
      
      batchUpdateService.updateSpecificEnvironment('dev', 'new-password')
      
      const updatedProject1 = mockConfig.data.projects[0]
      
      // 驗證除了密碼外其他屬性保持不變
      expect(updatedProject1.id).toBe(originalProject1.id)
      expect(updatedProject1.name).toBe(originalProject1.name)
      expect(updatedProject1.path).toBe(originalProject1.path)
      expect(updatedProject1.repos).toEqual(originalProject1.repos)
      expect(updatedProject1.dockerLogin.dev.registry).toBe(originalProject1.dockerLogin.dev.registry)
      expect(updatedProject1.dockerLogin.dev.username).toBe(originalProject1.dockerLogin.dev.username)
      
      // 只有密碼應該改變
      expect(updatedProject1.dockerLogin.dev.password).not.toBe(originalProject1.dockerLogin.dev.password)
    })

    it('應該不影響未更新環境的設定', () => {
      const originalStagingPassword = mockConfig.data.projects[0].dockerLogin.staging.password
      const originalProdPassword = mockConfig.data.projects[0].dockerLogin.prod.password
      
      batchUpdateService.updateSpecificEnvironment('dev', 'new-dev-password')
      
      const updatedProject = mockConfig.data.projects[0]
      
      // 驗證其他環境密碼沒有改變
      expect(updatedProject.dockerLogin.staging.password).toBe(originalStagingPassword)
      expect(updatedProject.dockerLogin.prod.password).toBe(originalProdPassword)
    })
  })
})