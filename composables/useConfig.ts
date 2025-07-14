import { ref, readonly } from 'vue'
import { Step, StepCombination, Project } from '~/src/config'

export interface Config {
  configVersion: number
  selectedProject: string
  selectedEnvironment: string
  gitBashPath: string
  registrySiteUrl: string
  tempPath: string
  projects: Project[]
  environments: string[]
  steps: Step[]
  stepCombinations: StepCombination[]
}

const defaultConfig: Config = {
  configVersion: 1,
  selectedProject: '',
  selectedEnvironment: '',
  gitBashPath: '',
  registrySiteUrl: '',
  tempPath: '',
  projects: [],
  environments: [],
  steps: [],
  stepCombinations: [],
}

const config = ref<Config>(defaultConfig)

export function useConfig() {
  const updateConfig = (newConfig: Partial<Config>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const setSelectedProject = (projectId: string) => {
    config.value = { ...config.value, selectedProject: projectId }
  }

  const setSelectedEnvironment = (environment: string) => {
    config.value = { ...config.value, selectedEnvironment: environment }
  }

  const getConfig = () => config.value

  return {
    config: readonly(config),
    getConfig,
    updateConfig,
    setSelectedProject,
    setSelectedEnvironment,
  }
}
