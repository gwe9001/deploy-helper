import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock整個精確選擇系統
const createAdvancedRegistryUpdateSystem = () => {
  const mockData = {
    projects: [
      {
        id: 'frontend',
        name: 'Frontend Application',
        path: '/projects/frontend',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.frontend.com', username: 'frontend-dev', password: 'old-dev-pass' },
          staging: { registry: 'staging.frontend.com', username: 'frontend-staging', password: 'old-staging-pass' },
          prod: { registry: 'prod.frontend.com', username: 'frontend-prod', password: 'old-prod-pass' }
        }
      },
      {
        id: 'backend',
        name: 'Backend API',
        path: '/projects/backend',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.backend.com', username: 'backend-dev', password: 'old-dev-pass' },
          prod: { registry: 'prod.backend.com', username: 'backend-prod', password: 'old-prod-pass' }
          // 注意：沒有staging環境
        }
      },
      {
        id: 'microservice',
        name: 'Microservice',
        path: '/projects/microservice',
        repos: [],
        dockerLogin: {
          dev: { registry: 'dev.micro.com', username: 'micro-dev', password: 'old-dev-pass' }
          // 只有dev環境
        }
      },
      {
        id: 'legacy',
        name: 'Legacy System',
        path: '/projects/legacy',
        repos: [],
        dockerLogin: {}
        // 沒有任何Registry配置
      }
    ],
    environments: ['dev', 'staging', 'prod']
  }

  let selectedTargets = []
  let operationHistory = []

  const mockElMessage = {
    success: vi.fn((msg) => operationHistory.push({ type: 'success', message: msg })),
    warning: vi.fn((msg) => operationHistory.push({ type: 'warning', message: msg })),
    error: vi.fn((msg) => operationHistory.push({ type: 'error', message: msg })),
    info: vi.fn((msg) => operationHistory.push({ type: 'info', message: msg }))
  }

  const mockConfig = {
    set: vi.fn(),
    save: vi.fn()
  }

  // 核心功能函數
  const hasRegistryConfig = (project, environment) => {
    return !!(project.dockerLogin && project.dockerLogin[environment])
  }

  const isTargetSelected = (projectId, environment) => {
    return selectedTargets.some(
      target => target.projectId === projectId && target.environment === environment
    )
  }

  const toggleTargetSelection = (projectId, environment, checked) => {
    if (checked) {
      if (!isTargetSelected(projectId, environment)) {
        selectedTargets.push({ projectId, environment })
      }
    } else {
      selectedTargets = selectedTargets.filter(
        target => !(target.projectId === projectId && target.environment === environment)
      )
    }
  }

  const toggleProjectSelection = (projectId, checked) => {
    const project = mockData.projects.find(p => p.id === projectId)
    if (!project) return

    const availableEnvs = mockData.environments.filter(env => hasRegistryConfig(project, env))

    if (checked) {
      availableEnvs.forEach(env => {
        if (!isTargetSelected(projectId, env)) {
          selectedTargets.push({ projectId, environment: env })
        }
      })
    } else {
      selectedTargets = selectedTargets.filter(
        target => target.projectId !== projectId
      )
    }
  }

  const selectAllTargets = () => {
    selectedTargets = []
    mockData.projects.forEach(project => {
      mockData.environments.forEach(env => {
        if (hasRegistryConfig(project, env)) {
          selectedTargets.push({ projectId: project.id, environment: env })
        }
      })
    })
  }

  const selectByEnvironment = (targetEnv) => {
    selectedTargets = []
    mockData.projects.forEach(project => {
      if (hasRegistryConfig(project, targetEnv)) {
        selectedTargets.push({ projectId: project.id, environment: targetEnv })
      }
    })
    mockElMessage.info(`已選擇所有${targetEnv}環境`)
  }

  const clearSelectedTargets = () => {
    selectedTargets = []
  }

  const performAdvancedUpdate = (newPassword) => {
    if (!newPassword || selectedTargets.length === 0) {
      mockElMessage.warning('請確認密碼和選擇目標')
      return { success: false, updatedCount: 0 }
    }

    let updatedCount = 0
    const projectsToUpdate = [...mockData.projects]

    selectedTargets.forEach(target => {
      const project = projectsToUpdate.find(p => p.id === target.projectId)
      if (project && project.dockerLogin && project.dockerLogin[target.environment]) {
        project.dockerLogin[target.environment].password = newPassword
        updatedCount++
      }
    })

    mockConfig.set('projects', projectsToUpdate)
    mockConfig.save()
    mockData.projects = projectsToUpdate

    mockElMessage.success(`成功更新 ${updatedCount} 個Registry密碼`)
    clearSelectedTargets()

    return { success: true, updatedCount, projects: projectsToUpdate }
  }

  const getTotalTargets = () => {
    let count = 0
    mockData.projects.forEach(project => {
      mockData.environments.forEach(env => {
        if (hasRegistryConfig(project, env)) {
          count++
        }
      })
    })
    return count
  }

  const getSelectedTargetsInfo = () => {
    return selectedTargets.map(target => {
      const project = mockData.projects.find(p => p.id === target.projectId)
      const projectName = project ? project.name : '未知專案'
      const registryInfo = project && project.dockerLogin && project.dockerLogin[target.environment]
        ? project.dockerLogin[target.environment].registry
        : '未配置'
      
      return {
        projectId: target.projectId,
        projectName,
        environment: target.environment,
        registry: registryInfo
      }
    })
  }

  return {
    // 資料存取
    getData: () => mockData,
    getSelectedTargets: () => selectedTargets,
    getOperationHistory: () => operationHistory,
    getTotalTargets,
    getSelectedTargetsInfo,
    
    // 核心功能
    hasRegistryConfig,
    isTargetSelected,
    toggleTargetSelection,
    toggleProjectSelection,
    selectAllTargets,
    selectByEnvironment,
    clearSelectedTargets,
    performAdvancedUpdate,
    
    // Mock物件
    mockElMessage,
    mockConfig
  }
}

describe('精確Registry密碼更新整合測試', () => {
  let system: any

  beforeEach(() => {
    vi.clearAllMocks()
    system = createAdvancedRegistryUpdateSystem()
  })

  describe('系統初始化和基本資訊', () => {
    it('應該正確計算可用目標總數', () => {
      const totalTargets = system.getTotalTargets()
      
      // frontend: 3個環境 (dev, staging, prod)
      // backend: 2個環境 (dev, prod)  
      // microservice: 1個環境 (dev)
      // legacy: 0個環境
      expect(totalTargets).toBe(6)
    })

    it('應該正確識別每個專案的Registry配置', () => {
      const data = system.getData()
      
      expect(system.hasRegistryConfig(data.projects[0], 'dev')).toBe(true) // frontend-dev
      expect(system.hasRegistryConfig(data.projects[0], 'staging')).toBe(true) // frontend-staging
      expect(system.hasRegistryConfig(data.projects[0], 'prod')).toBe(true) // frontend-prod
      
      expect(system.hasRegistryConfig(data.projects[1], 'dev')).toBe(true) // backend-dev
      expect(system.hasRegistryConfig(data.projects[1], 'staging')).toBe(false) // backend-staging
      expect(system.hasRegistryConfig(data.projects[1], 'prod')).toBe(true) // backend-prod
      
      expect(system.hasRegistryConfig(data.projects[2], 'dev')).toBe(true) // microservice-dev
      expect(system.hasRegistryConfig(data.projects[2], 'staging')).toBe(false) // microservice-staging
      expect(system.hasRegistryConfig(data.projects[2], 'prod')).toBe(false) // microservice-prod
      
      expect(system.hasRegistryConfig(data.projects[3], 'dev')).toBe(false) // legacy-dev
      expect(system.hasRegistryConfig(data.projects[3], 'staging')).toBe(false) // legacy-staging
      expect(system.hasRegistryConfig(data.projects[3], 'prod')).toBe(false) // legacy-prod
    })
  })

  describe('單一目標選擇功能', () => {
    it('應該正確選擇和取消選擇單一目標', () => {
      // 初始狀態
      expect(system.getSelectedTargets()).toHaveLength(0)
      expect(system.isTargetSelected('frontend', 'dev')).toBe(false)
      
      // 選擇目標
      system.toggleTargetSelection('frontend', 'dev', true)
      expect(system.getSelectedTargets()).toHaveLength(1)
      expect(system.isTargetSelected('frontend', 'dev')).toBe(true)
      
      // 重複選擇不應增加數量
      system.toggleTargetSelection('frontend', 'dev', true)
      expect(system.getSelectedTargets()).toHaveLength(1)
      
      // 取消選擇
      system.toggleTargetSelection('frontend', 'dev', false)
      expect(system.getSelectedTargets()).toHaveLength(0)
      expect(system.isTargetSelected('frontend', 'dev')).toBe(false)
    })

    it('應該支援選擇多個不同的目標', () => {
      system.toggleTargetSelection('frontend', 'dev', true)
      system.toggleTargetSelection('backend', 'prod', true)
      system.toggleTargetSelection('microservice', 'dev', true)
      
      expect(system.getSelectedTargets()).toHaveLength(3)
      expect(system.isTargetSelected('frontend', 'dev')).toBe(true)
      expect(system.isTargetSelected('backend', 'prod')).toBe(true)
      expect(system.isTargetSelected('microservice', 'dev')).toBe(true)
    })
  })

  describe('專案級選擇功能', () => {
    it('應該正確選擇整個專案的所有環境', () => {
      // 選擇frontend專案（有3個環境）
      system.toggleProjectSelection('frontend', true)
      
      expect(system.getSelectedTargets()).toHaveLength(3)
      expect(system.isTargetSelected('frontend', 'dev')).toBe(true)
      expect(system.isTargetSelected('frontend', 'staging')).toBe(true)
      expect(system.isTargetSelected('frontend', 'prod')).toBe(true)
      
      // 選擇backend專案（有2個環境）
      system.toggleProjectSelection('backend', true)
      
      expect(system.getSelectedTargets()).toHaveLength(5)
      expect(system.isTargetSelected('backend', 'dev')).toBe(true)
      expect(system.isTargetSelected('backend', 'prod')).toBe(true)
      expect(system.isTargetSelected('backend', 'staging')).toBe(false) // 沒有這個環境
    })

    it('應該正確取消選擇整個專案', () => {
      // 先選擇多個專案
      system.toggleProjectSelection('frontend', true)
      system.toggleProjectSelection('backend', true)
      expect(system.getSelectedTargets()).toHaveLength(5)
      
      // 取消選擇frontend專案
      system.toggleProjectSelection('frontend', false)
      expect(system.getSelectedTargets()).toHaveLength(2) // 只剩backend的2個環境
      expect(system.isTargetSelected('frontend', 'dev')).toBe(false)
      expect(system.isTargetSelected('frontend', 'staging')).toBe(false)
      expect(system.isTargetSelected('frontend', 'prod')).toBe(false)
      expect(system.isTargetSelected('backend', 'dev')).toBe(true)
      expect(system.isTargetSelected('backend', 'prod')).toBe(true)
    })

    it('應該正確處理沒有Registry配置的專案', () => {
      // 嘗試選擇legacy專案（沒有任何Registry配置）
      system.toggleProjectSelection('legacy', true)
      
      expect(system.getSelectedTargets()).toHaveLength(0)
    })
  })

  describe('批次選擇功能', () => {
    it('應該正確執行全選操作', () => {
      system.selectAllTargets()
      
      expect(system.getSelectedTargets()).toHaveLength(6) // 所有可用的Registry配置
      expect(system.isTargetSelected('frontend', 'dev')).toBe(true)
      expect(system.isTargetSelected('frontend', 'staging')).toBe(true)
      expect(system.isTargetSelected('frontend', 'prod')).toBe(true)
      expect(system.isTargetSelected('backend', 'dev')).toBe(true)
      expect(system.isTargetSelected('backend', 'prod')).toBe(true)
      expect(system.isTargetSelected('microservice', 'dev')).toBe(true)
      
      // 不應包含沒有配置的環境
      expect(system.isTargetSelected('backend', 'staging')).toBe(false)
      expect(system.isTargetSelected('legacy', 'dev')).toBe(false)
    })

    it('應該正確執行按環境選擇', () => {
      // 選擇dev環境
      system.selectByEnvironment('dev')
      
      expect(system.getSelectedTargets()).toHaveLength(3) // frontend, backend, microservice都有dev
      expect(system.isTargetSelected('frontend', 'dev')).toBe(true)
      expect(system.isTargetSelected('backend', 'dev')).toBe(true)
      expect(system.isTargetSelected('microservice', 'dev')).toBe(true)
      expect(system.isTargetSelected('frontend', 'staging')).toBe(false)
      expect(system.isTargetSelected('frontend', 'prod')).toBe(false)
      
      const history = system.getOperationHistory()
      expect(history.some(h => h.type === 'info' && h.message.includes('已選擇所有dev環境'))).toBe(true)
    })

    it('應該正確執行按不存在環境選擇', () => {
      system.selectByEnvironment('test')
      
      expect(system.getSelectedTargets()).toHaveLength(0)
      
      const history = system.getOperationHistory()
      expect(history.some(h => h.type === 'info' && h.message.includes('已選擇所有test環境'))).toBe(true)
    })

    it('應該正確清空選擇', () => {
      // 先選擇一些目標
      system.selectAllTargets()
      expect(system.getSelectedTargets()).toHaveLength(6)
      
      // 清空選擇
      system.clearSelectedTargets()
      expect(system.getSelectedTargets()).toHaveLength(0)
    })
  })

  describe('精確更新功能', () => {
    it('應該正確執行精確密碼更新', () => {
      // 選擇特定目標
      system.toggleTargetSelection('frontend', 'dev', true)
      system.toggleTargetSelection('backend', 'prod', true)
      
      const result = system.performAdvancedUpdate('new-secure-password-2024')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2)
      
      // 驗證密碼被正確更新
      const data = system.getData()
      expect(data.projects[0].dockerLogin.dev.password).toBe('new-secure-password-2024')
      expect(data.projects[1].dockerLogin.prod.password).toBe('new-secure-password-2024')
      
      // 驗證未選擇的環境密碼保持不變
      expect(data.projects[0].dockerLogin.staging.password).toBe('old-staging-pass')
      expect(data.projects[0].dockerLogin.prod.password).toBe('old-prod-pass')
      expect(data.projects[1].dockerLogin.dev.password).toBe('old-dev-pass')
      
      // 驗證其他屬性保持不變
      expect(data.projects[0].dockerLogin.dev.registry).toBe('dev.frontend.com')
      expect(data.projects[0].dockerLogin.dev.username).toBe('frontend-dev')
      
      // 驗證選擇被清空
      expect(system.getSelectedTargets()).toHaveLength(0)
      
      // 驗證配置儲存
      expect(system.mockConfig.set).toHaveBeenCalledWith('projects', expect.any(Array))
      expect(system.mockConfig.save).toHaveBeenCalled()
      
      // 驗證成功訊息
      const history = system.getOperationHistory()
      expect(history.some(h => h.type === 'success' && h.message.includes('成功更新 2 個Registry密碼'))).toBe(true)
    })

    it('應該在缺少密碼時顯示警告', () => {
      system.toggleTargetSelection('frontend', 'dev', true)
      
      const result = system.performAdvancedUpdate('')
      
      expect(result.success).toBe(false)
      expect(result.updatedCount).toBe(0)
      
      const history = system.getOperationHistory()
      expect(history.some(h => h.type === 'warning' && h.message.includes('請確認密碼和選擇目標'))).toBe(true)
    })

    it('應該在沒有選擇目標時顯示警告', () => {
      const result = system.performAdvancedUpdate('password123')
      
      expect(result.success).toBe(false)
      expect(result.updatedCount).toBe(0)
      
      const history = system.getOperationHistory()
      expect(history.some(h => h.type === 'warning' && h.message.includes('請確認密碼和選擇目標'))).toBe(true)
    })

    it('應該正確處理大量選擇的更新', () => {
      // 全選並更新
      system.selectAllTargets()
      expect(system.getSelectedTargets()).toHaveLength(6)
      
      const result = system.performAdvancedUpdate('enterprise-password-2024')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(6)
      
      // 驗證所有選擇的Registry密碼都被更新
      const data = system.getData()
      expect(data.projects[0].dockerLogin.dev.password).toBe('enterprise-password-2024') // frontend-dev
      expect(data.projects[0].dockerLogin.staging.password).toBe('enterprise-password-2024') // frontend-staging
      expect(data.projects[0].dockerLogin.prod.password).toBe('enterprise-password-2024') // frontend-prod
      expect(data.projects[1].dockerLogin.dev.password).toBe('enterprise-password-2024') // backend-dev
      expect(data.projects[1].dockerLogin.prod.password).toBe('enterprise-password-2024') // backend-prod
      expect(data.projects[2].dockerLogin.dev.password).toBe('enterprise-password-2024') // microservice-dev
      
      // legacy專案沒有Registry配置，應該保持不變
      expect(Object.keys(data.projects[3].dockerLogin)).toHaveLength(0)
    })
  })

  describe('選擇資訊展示功能', () => {
    it('應該正確提供選擇目標的詳細資訊', () => {
      system.toggleTargetSelection('frontend', 'dev', true)
      system.toggleTargetSelection('backend', 'prod', true)
      
      const selectedInfo = system.getSelectedTargetsInfo()
      
      expect(selectedInfo).toHaveLength(2)
      
      expect(selectedInfo[0]).toEqual({
        projectId: 'frontend',
        projectName: 'Frontend Application',
        environment: 'dev',
        registry: 'dev.frontend.com'
      })
      
      expect(selectedInfo[1]).toEqual({
        projectId: 'backend',
        projectName: 'Backend API',
        environment: 'prod',
        registry: 'prod.backend.com'
      })
    })

    it('應該正確處理未知專案的資訊展示', () => {
      // 手動添加一個不存在的專案目標（模擬異常情況）
      const selectedTargets = system.getSelectedTargets()
      selectedTargets.push({ projectId: 'unknown', environment: 'dev' })
      
      const selectedInfo = system.getSelectedTargetsInfo()
      
      expect(selectedInfo.some(info => 
        info.projectId === 'unknown' && 
        info.projectName === '未知專案' && 
        info.registry === '未配置'
      )).toBe(true)
    })
  })

  describe('複雜場景整合測試', () => {
    it('應該支援混合選擇和更新流程', () => {
      // 場景：先按環境選擇，然後手動調整，最後批次更新
      
      // 1. 選擇所有dev環境
      system.selectByEnvironment('dev')
      expect(system.getSelectedTargets()).toHaveLength(3)
      
      // 2. 手動取消microservice的dev環境
      system.toggleTargetSelection('microservice', 'dev', false)
      expect(system.getSelectedTargets()).toHaveLength(2)
      
      // 3. 手動添加backend的prod環境
      system.toggleTargetSelection('backend', 'prod', true)
      expect(system.getSelectedTargets()).toHaveLength(3)
      
      // 4. 執行更新
      const result = system.performAdvancedUpdate('mixed-update-password')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(3)
      
      // 5. 驗證更新結果
      const data = system.getData()
      expect(data.projects[0].dockerLogin.dev.password).toBe('mixed-update-password') // frontend-dev
      expect(data.projects[1].dockerLogin.dev.password).toBe('mixed-update-password') // backend-dev
      expect(data.projects[1].dockerLogin.prod.password).toBe('mixed-update-password') // backend-prod
      expect(data.projects[2].dockerLogin.dev.password).toBe('old-dev-pass') // microservice-dev 未更新
    })

    it('應該支援多輪選擇和更新', () => {
      // 第一輪：更新所有dev環境
      system.selectByEnvironment('dev')
      let result = system.performAdvancedUpdate('dev-password-round1')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(3)
      expect(system.getSelectedTargets()).toHaveLength(0) // 自動清空
      
      // 第二輪：更新所有prod環境
      system.selectByEnvironment('prod')
      result = system.performAdvancedUpdate('prod-password-round2')
      
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2) // frontend和backend有prod
      
      // 驗證兩輪更新的結果
      const data = system.getData()
      expect(data.projects[0].dockerLogin.dev.password).toBe('dev-password-round1')
      expect(data.projects[0].dockerLogin.prod.password).toBe('prod-password-round2')
      expect(data.projects[1].dockerLogin.dev.password).toBe('dev-password-round1')
      expect(data.projects[1].dockerLogin.prod.password).toBe('prod-password-round2')
      expect(data.projects[2].dockerLogin.dev.password).toBe('dev-password-round1')
      
      // staging環境應該保持原樣
      expect(data.projects[0].dockerLogin.staging.password).toBe('old-staging-pass')
    })
  })
})