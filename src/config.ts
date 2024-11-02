import { ref } from 'vue'
import log from 'electron-log/renderer'
import { migrateToV2, migrateToV3 } from './migrations/configMigrations'

export interface Config {
  configVersion: number
  selectedProject: string | null
  selectedEnvironment: string | null
  gitBashPath: string
  registrySiteUrl: string
  tempPath: string
  projects: Project[]
  environments: string[]
  steps: Step[]
  stepCombinations: StepCombination[]
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
  shellType: 'bash' | 'powershell'
}

export interface StepCombination {
  id: string
  name: string
  steps: string[]
  projectId: string
  environment: string
}

const INITIAL_CONFIG_VERSION = 3
const LATEST_CONFIG_VERSION = 3 // 更新到新的版本

const defaultConfig = ref<Config>({
  configVersion: LATEST_CONFIG_VERSION,
  selectedProject: null,
  selectedEnvironment: null,
  gitBashPath: '',
  registrySiteUrl: '',
  tempPath: '',
  projects: [],
  environments: [],
  steps: [],
  stepCombinations: [],
})

function migrateConfig(config: Config): Config {
  const initialVersion = config.configVersion || INITIAL_CONFIG_VERSION
  log.debug(`Config migration check. Current version: ${initialVersion}`)

  if (initialVersion > LATEST_CONFIG_VERSION) {
    log.warn(
      `Config version (${initialVersion}) is newer than the latest known version (${LATEST_CONFIG_VERSION}). No migration performed.`,
    )
    return config
  }

  let updatedConfig = { ...config }

  const migrationFunctions = [
    { version: 1, migrate: migrateToV2 },
    { version: 2, migrate: migrateToV3 },
    // 可以在這裡添加更多的遷移函數
  ]

  for (const { version, migrate } of migrationFunctions) {
    if (initialVersion <= version) {
      updatedConfig = migrate(updatedConfig)
    }
  }

  if (initialVersion < LATEST_CONFIG_VERSION) {
    updatedConfig.configVersion = LATEST_CONFIG_VERSION
    log.info(
      `Config migrated. Version: ${initialVersion} -> ${updatedConfig.configVersion}`,
    )
  }

  return updatedConfig
}

const getLocalConfig = async (): Promise<void> => {
  try {
    const configTemp = await window.electron.ipcRenderer.getStoreValue('config')
    if (configTemp) {
      const migratedConfig = migrateConfig(configTemp)
      Object.assign(defaultConfig.value, migratedConfig)
    } else {
      log.info('No existing config found. Using default config.')
    }
    await saveConfig() // 保存可能更新過的配置
  } catch (error) {
    log.error('Error getting local config:', error)
  }
}

const saveConfig = async (): Promise<void> => {
  try {
    let serializableConfig = JSON.parse(JSON.stringify(defaultConfig.value))
    if (serializableConfig.configVersion !== LATEST_CONFIG_VERSION) {
      serializableConfig = migrateConfig(serializableConfig)
    }
    await window.electron.ipcRenderer.setStoreValue(
      'config',
      serializableConfig,
    )
  } catch (error) {
    log.error('Error saving config:', error)
  }
}

const setConfig = <K extends keyof Config>(key: K, value: Config[K]): void => {
  defaultConfig.value[key] = value
}

const loadConfig = (config: Config): void => {
  defaultConfig.value = migrateConfig(config)
}

const getPlainConfig = (): Config => defaultConfig.value

const configProxy = new Proxy(defaultConfig, {
  get(obj, prop: string) {
    if (prop === 'set') return setConfig
    if (prop === 'save') return saveConfig
    if (prop === 'value') return getPlainConfig
    if (prop === 'load') return loadConfig
    return undefined
  },
})

// 初始化配置
await getLocalConfig()

export default configProxy
