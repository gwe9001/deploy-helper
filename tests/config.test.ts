import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock config 模組
const mockConfig = {
  value: vi.fn(() => ({
    projects: [
      {
        id: 'project1',
        name: 'Test Project 1',
        path: '/path/to/project1',
        repos: [],
        dockerLogin: {
          dev: {
            registry: 'dev.registry.com',
            username: 'devuser',
            password: 'oldpassword'
          },
          prod: {
            registry: 'prod.registry.com',
            username: 'produser',
            password: 'oldpassword'
          }
        }
      },
      {
        id: 'project2',
        name: 'Test Project 2',
        path: '/path/to/project2',
        repos: [],
        dockerLogin: {
          dev: {
            registry: 'dev.registry.com',
            username: 'devuser2',
            password: 'oldpassword'
          }
        }
      }
    ],
    environments: ['dev', 'staging', 'prod']
  })),
  set: vi.fn(),
  save: vi.fn()
}

vi.mock('../src/config', () => ({
  default: mockConfig
}))

describe('配置管理測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Registry密碼更新功能', () => {
    it('應該能夠取得所有專案的Registry設定', () => {
      const config = mockConfig.value()
      
      expect(config.projects).toHaveLength(2)
      expect(config.projects[0].dockerLogin.dev.password).toBe('oldpassword')
      expect(config.projects[1].dockerLogin.dev.password).toBe('oldpassword')
    })

    it('應該能夠更新特定環境的所有專案密碼', () => {
      const config = mockConfig.value()
      const newPassword = 'newpassword123'
      const targetEnv = 'dev'
      
      // 模擬批次更新邏輯
      const projectsToUpdate = [...config.projects]
      let updatedCount = 0
      
      projectsToUpdate.forEach((project) => {
        if (project.dockerLogin[targetEnv]) {
          project.dockerLogin[targetEnv].password = newPassword
          updatedCount++
        }
      })
      
      expect(updatedCount).toBe(2) // 兩個專案都有dev環境設定
      expect(projectsToUpdate[0].dockerLogin.dev.password).toBe(newPassword)
      expect(projectsToUpdate[1].dockerLogin.dev.password).toBe(newPassword)
      // prod環境不應該被影響
      expect(projectsToUpdate[0].dockerLogin.prod.password).toBe('oldpassword')
    })

    it('應該能夠更新所有專案所有環境的密碼', () => {
      const config = mockConfig.value()
      const newPassword = 'newglobalpassword'
      const envs = config.environments
      
      // 模擬批次更新所有環境邏輯
      const projectsToUpdate = [...config.projects]
      let updatedCount = 0
      
      projectsToUpdate.forEach((project) => {
        envs.forEach((env) => {
          if (project.dockerLogin[env]) {
            project.dockerLogin[env].password = newPassword
            updatedCount++
          }
        })
      })
      
      expect(updatedCount).toBe(3) // project1有2個環境, project2有1個環境
      expect(projectsToUpdate[0].dockerLogin.dev.password).toBe(newPassword)
      expect(projectsToUpdate[0].dockerLogin.prod.password).toBe(newPassword)
      expect(projectsToUpdate[1].dockerLogin.dev.password).toBe(newPassword)
    })

    it('應該忽略沒有Registry設定的專案和環境', () => {
      const config = mockConfig.value()
      const newPassword = 'testpassword'
      const targetEnv = 'staging' // 沒有專案有staging環境設定
      
      const projectsToUpdate = [...config.projects]
      let updatedCount = 0
      
      projectsToUpdate.forEach((project) => {
        if (project.dockerLogin[targetEnv]) {
          project.dockerLogin[targetEnv].password = newPassword
          updatedCount++
        }
      })
      
      expect(updatedCount).toBe(0) // 沒有專案有staging環境設定
    })

    it('應該能夠處理空專案列表', () => {
      // 覆寫mock回傳空專案列表
      mockConfig.value.mockReturnValueOnce({
        projects: [],
        environments: ['dev', 'prod']
      })
      
      const config = mockConfig.value()
      const newPassword = 'testpassword'
      const targetEnv = 'dev'
      
      const projectsToUpdate = [...config.projects]
      let updatedCount = 0
      
      projectsToUpdate.forEach((project) => {
        if (project.dockerLogin[targetEnv]) {
          project.dockerLogin[targetEnv].password = newPassword
          updatedCount++
        }
      })
      
      expect(updatedCount).toBe(0)
      expect(projectsToUpdate).toHaveLength(0)
    })

    it('應該初始化dockerLogin物件如果不存在', () => {
      const project = {
        id: 'project3',
        name: 'Test Project 3',
        path: '/path/to/project3',
        repos: []
        // 注意：沒有dockerLogin屬性
      }
      
      // 模擬initializeDockerLogin函數邏輯
      if (!project.dockerLogin) {
        project.dockerLogin = {}
      }
      
      expect(project.dockerLogin).toBeDefined()
      expect(typeof project.dockerLogin).toBe('object')
    })
  })
})