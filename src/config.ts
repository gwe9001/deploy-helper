import { ref } from 'vue'
import log from 'electron-log/renderer'

export interface Config {
  configVersion: number
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

const INITIAL_CONFIG_VERSION = 1
const LATEST_CONFIG_VERSION = 1 // 當前最新版本

const defaultConfig = ref<Config>({
  configVersion: INITIAL_CONFIG_VERSION,
  selectedProject: '',
  selectedEnvironment: '',
  gitBashPath: '',
  registrySiteUrl: '',
  tempPath: '',
  projects: [],
  environments: [],
})

function migrateConfig(config: Config): void {
  const initialVersion = config.configVersion
  log.debug(`Config migration check. Current version: ${initialVersion}`)

  if (config.configVersion === undefined) {
    config.configVersion = INITIAL_CONFIG_VERSION
    log.info('Config version was undefined. Initialized to version 1.')
  }

  switch (config.configVersion) {
    case LATEST_CONFIG_VERSION:
      log.debug('Config is already up to date')
      return // 直接返回，不需要further處理

    // 未來的case將在這裡添加
    case 1:
    // 當前版本是 1，暫時不需要遷移
    // 未來版本 2 的遷移邏輯可以放在這裡
    // config.configVersion = 2;
    // log.info('Migrated from version 1 to 2');
    // 繼續執行下一個 case

    // case 2:
    //   // 版本 2 到 3 的遷移邏輯
    //   // config.configVersion = 3;
    //   // log.info('Migrated from version 2 to 3');
    //   // 繼續執行下一個 case

    default:
      if (config.configVersion > LATEST_CONFIG_VERSION) {
        log.warn(
          `Config version (${config.configVersion}) is newer than the latest known version (${LATEST_CONFIG_VERSION}). No migration performed.`,
        )
      } else {
        log.warn(
          `Unknown config version: ${config.configVersion}. Migrating to latest version.`,
        )
        config.configVersion = LATEST_CONFIG_VERSION
        log.info(
          `Config migrated. Version: ${initialVersion} -> ${config.configVersion}`,
        )
      }
  }
}

const getLocalConfig = async (): Promise<void> => {
  try {
    const configTemp = await window.electron.ipcRenderer.getStoreValue('config')
    if (configTemp) {
      Object.assign(defaultConfig.value, configTemp)
    } else {
      log.info('No existing config found. Using default config.')
    }
    migrateConfig(defaultConfig.value)
    await saveConfig() // 保存可能更新過的配置
  } catch (error) {
    log.error('Error getting local config:', error)
  }
}

const saveConfig = async (): Promise<void> => {
  try {
    const serializableConfig = JSON.parse(JSON.stringify(defaultConfig.value))
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

const getPlainConfig = (): Config => defaultConfig.value

const configProxy = new Proxy(defaultConfig, {
  get(obj, prop: string) {
    if (prop === 'set') return setConfig
    if (prop === 'save') return saveConfig
    if (prop === 'value') return getPlainConfig
    return undefined
  },
})

// 初始化配置
await getLocalConfig()

export default configProxy
