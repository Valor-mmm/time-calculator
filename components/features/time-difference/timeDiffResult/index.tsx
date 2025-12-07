import { FC, useEffect, useMemo, useState } from 'react'
import { TimeDiffTable } from './timeDiffTable'
import { aggregateTimeDifference } from './aggregateTimeDifference'
import {
  type TimeDiffConfig as TimeDiffConfigType,
  TimeDiffRow,
} from '../types'
import { TimeDiffConfig } from './timeDiffConfig'
import { loadLocallyStoredConfig, storeConfigLocally } from './configStore'
import { isPause } from '../pauses'

interface TimeDiffResultProps {
  result: TimeDiffRow[]
}

export const TimeDiffResult: FC<TimeDiffResultProps> = ({ result }) => {
  const totalTime = useMemo(
    () => aggregateTimeDifference(result.filter((item) => !isPause(item))),
    [result],
  )
  const totalPauseTime = useMemo(
    () => aggregateTimeDifference(result.filter((item) => isPause(item))),
    [result],
  )
  const [config, setConfig] = useState<TimeDiffConfigType>(
    loadLocallyStoredConfig(),
  )

  useEffect(() => {
    storeConfigLocally(config)
  }, [config])

  return (
    <section className="container mx-auto bg-gray-200 dark:bg-gray-700 border-2 border-gray-400 border-opacity-50 rounded-lg p-4 sm:flex sm:justify-center flex-col">
      <TimeDiffTable
        timeDifferences={result}
        totalTime={totalTime}
        totalPauseTime={totalPauseTime}
        config={config}
      />
      <TimeDiffConfig currentConfig={config} onConfigChanged={setConfig} />
    </section>
  )
}
