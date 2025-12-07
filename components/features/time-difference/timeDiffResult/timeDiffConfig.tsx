import { TimeDiffConfig as TimeDiffConfigType } from '../types'

interface TimeDiffConfigProps {
  currentConfig: TimeDiffConfigType
  onConfigChanged: (
    update: (previousConfig: TimeDiffConfigType) => TimeDiffConfigType,
  ) => void
}

export const TimeDiffConfig = ({
  onConfigChanged,
  currentConfig,
}: TimeDiffConfigProps) => {
  return (
    <section className="mt-3">
      <h3 className="text-l font-bold underline">Config:</h3>
      <div className="flex justify-between w-fit gap-3 align-center mt-1">
        <label
          className={currentConfig.showPauses ? 'text-blue-300' : undefined}
          htmlFor="showPausesCheckbox"
        >
          Show Pauses:
        </label>
        <input
          className="mt-0.5"
          id="showPausesCheckbox"
          checked={currentConfig.showPauses}
          type="checkbox"
          onChange={() => {
            onConfigChanged((previousConfig) => ({
              ...previousConfig,
              showPauses: !previousConfig.showPauses,
            }))
          }}
        />
      </div>
    </section>
  )
}
