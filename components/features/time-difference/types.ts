import { ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'

export interface TimeInfo {
  minutes: number
  hours: number
}

export type TimeDifferenceInfo = ParsingResult & TimeInfo

export type TimeDifferenceInfoOrError =
  | (ParsingResult & TimeInfo)
  | TimeDifferenceError

export interface Pause {
  between: {
    start: ParsingResult
    end: ParsingResult
  }
  pause: TimeInfo
}

export type TimeDiffRow = TimeDifferenceInfoOrError | Pause

export interface TimeDiffConfig {
  showPauses: boolean
}
