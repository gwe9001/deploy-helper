import { Config, StepCombination } from '../config'
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
