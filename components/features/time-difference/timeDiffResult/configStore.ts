import { TimeDiffConfig } from '../types'

const timeDiffConfigKey = 'TIME_DIFF_CONFIG'

const defaultConfig: TimeDiffConfig = {
  showPauses: false,
}

const isTimeDiffConfig = (value: unknown): value is TimeDiffConfig =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as TimeDiffConfig).showPauses === 'boolean'

export const loadLocallyStoredConfig = (): TimeDiffConfig => {
  if (typeof window === 'undefined') {
    return defaultConfig
  }

  try {
    const storedConfig = window.localStorage.getItem(timeDiffConfigKey)
    if (!storedConfig) {
      return defaultConfig
    }

    const parsed: unknown = JSON.parse(storedConfig)
    return isTimeDiffConfig(parsed) ? parsed : defaultConfig
  } catch {
    // Corrupt or unavailable storage must not take the whole page down.
    return defaultConfig
  }
}

export const storeConfigLocally = (config: TimeDiffConfig) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(timeDiffConfigKey, JSON.stringify(config))
  } catch {
    // Storage can be full or disabled; persisting config is best effort.
  }
}
