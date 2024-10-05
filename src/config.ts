import { ref } from 'vue'

export interface Config {
  selectedProject: string
  selectedEnvironment: string
  gitBashPath: string
  registrySiteUrl: string
  tempPath: string
  projects: Project[]
  environments: string[]
}

export interface Project {
  id: string
  name: string
  path: string
  repos: Repo[]
  dockerLogin: {
    registry: string
    username: string
    password: string
  }
  deploymentSteps: Step[]
}

export interface Repo {
  name: string
  path: string
}

export interface Step {
  id: string
  name: string
  command: string
  outputField?: string
  outputReference?: string
  directory?: string
  hasOutputField: boolean
  hasOutputReference: boolean
  hasDirectory: boolean
  executionMode: 'sync' | 'async'
}

const defaultConfig: Config = ref({
  selectedProject: '',
  selectedEnvironment: '',
  registrySiteUrl: '',
  tempPath: '',
  projects: [],
  environments: [],
})

const getLocalConfig = async () => {
  const configTemp = await window.electron.ipcRenderer.getStoreValue('config')
  Object.assign(defaultConfig.value, configTemp)
}
await getLocalConfig()

const saveConfig = async () => {
  try {
    const serializableConfig = JSON.parse(JSON.stringify(defaultConfig.value))
    await window.electron.ipcRenderer.setStoreValue(
      'config',
      serializableConfig,
    )
  } catch (error) {
    console.error('Error saving config:', error)
  }
}

const setConfig = (key, value) => {
  Reflect.set(defaultConfig.value, key, value)
}

const getPlainConfig = () => defaultConfig.value

const configProxy = new Proxy(defaultConfig, {
  get(obj, prop) {
    if (prop === 'set') return setConfig
    if (prop === 'save') return saveConfig
    if (prop === 'value') return getPlainConfig
  },
})

export default configProxy
