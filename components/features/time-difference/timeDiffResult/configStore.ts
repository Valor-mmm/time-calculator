import { TimeDiffConfig } from '../types'

const timeDiffConfigKey = 'TIME_DIFF_CONFIG'

export const loadLocallyStoredConfig = (): TimeDiffConfig => {
  if (typeof window !== 'undefined') {
    const storedConfig: string | null =
      window.localStorage.getItem(timeDiffConfigKey)

    if (storedConfig) {
      return JSON.parse(storedConfig)
    }
  }
  return {
    showPauses: false,
  }
}

export const storeConfigLocally = (config: TimeDiffConfig) => {
  window.localStorage.setItem(timeDiffConfigKey, JSON.stringify(config))
}
