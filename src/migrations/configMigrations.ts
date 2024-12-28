import { Config, StepCombination, Project } from '../config'
import log from 'electron-log/renderer'

export function migrateToV2(config: Config): Config {
  const updatedConfig = { ...config }

  // 將 Project 中的 deploymentSteps 移動到全局 steps
  updatedConfig.steps = []
  updatedConfig.stepCombinations = []

  updatedConfig.projects.forEach((project) => {
    if (project.deploymentSteps) {
      updatedConfig.steps.push(...project.deploymentSteps)

      updatedConfig.environments.forEach((env) => {
        // 為每個項目創建一個默認的步驟組合
        const defaultCombination: StepCombination = {
          id: `default-${project.id}-${env}`,
          name: `default ${project.name} ${env}`,
          steps: project.deploymentSteps.map((step) => step.id),
          projectId: project.id,
          environment: env,
        }
        updatedConfig.stepCombinations.push(defaultCombination)
      })
      // 從 Project 中移除 deploymentSteps
      delete project.deploymentSteps
    }
  })

  updatedConfig.configVersion = 2
  log.info('Migrated from version 1 to 2')
  return updatedConfig
}

export function migrateToV3(config: Config): Config {
  const updatedConfig = { ...config }

  updatedConfig.steps.forEach((step) => {
    step.shellType = 'bash'
  })

  updatedConfig.configVersion = 3
  log.info('Migrated from version 2 to 3')
  return updatedConfig
}

export const migrateToV4 = (config: Config): Config => {
  const updatedConfig = { ...config }

  updatedConfig.projects = updatedConfig.projects.map((project: Project) => {
    const newProject = { ...project }

    // 檢查是否為舊格式
    if (
      newProject.dockerLogin &&
      typeof newProject.dockerLogin === 'object' &&
      'registry' in newProject.dockerLogin
    ) {
      const oldDockerLogin = {
        registry: newProject.dockerLogin.registry,
        username: newProject.dockerLogin.username,
        password: newProject.dockerLogin.password,
      }

      // 轉換為新格式：將舊的設定套用到所有現有環境
      newProject.dockerLogin = {}
      config.environments.forEach((env) => {
        if (env !== 'manage-environments') {
          // 排除管理環境選項
          newProject.dockerLogin[env] = { ...oldDockerLogin }
        }
      })
    }

    return newProject
  })

  updatedConfig.configVersion = 4
  log.info('配置已從版本 3 遷移到版本 4')
  return updatedConfig
}
