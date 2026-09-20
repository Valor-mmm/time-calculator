import { ParsingResult } from './parseTime'
import { TimeDifferenceError } from './errors'

export interface TimeInfo {
  minutes: number
  hours: number
}

export type TimeDifferenceInfo = ParsingResult & TimeInfo

export type TimeDifferenceInfoOrError = TimeDifferenceInfo | TimeDifferenceError

export interface Pause {
  between: {
    start: ParsingResult
    end: ParsingResult
  }
  pause: TimeInfo
}

/** A line such as `Samstag:` — starts a new work day. */
export interface DayHeader {
  label: string
}

/** Any other prose line from the pasted notes, kept for context. */
export interface NoteLine {
  note: string
}

/** What `parseTime` produces, one per non-blank input line. */
export type ParsedLine =
  | ParsingResult
  | DayHeader
  | NoteLine
  | TimeDifferenceError

export type TimeDiffRow =
  | TimeDifferenceInfoOrError
  | Pause
  | DayHeader
  | NoteLine

/** What survives inside a day group — headers become the group itself. */
export type DayGroupRow = TimeDifferenceInfoOrError | Pause | NoteLine

/** One work day's rows with its own totals. */
export interface DayGroup {
  label?: string
  rows: DayGroupRow[]
  total: TimeInfo
  pauseTotal: TimeInfo
}

export interface TimeDiffConfig {
  showPauses: boolean
}

export const isDayHeader = (row: TimeDiffRow | ParsedLine): row is DayHeader =>
  !(row instanceof TimeDifferenceError) && 'label' in row

export const isNoteLine = (row: TimeDiffRow | ParsedLine): row is NoteLine =>
  !(row instanceof TimeDifferenceError) && 'note' in row

/** An entry or a pause — anything that carries time to be summed. */
export const isTimeRow = (
  row: TimeDiffRow,
): row is TimeDifferenceInfo | Pause =>
  !(row instanceof TimeDifferenceError) && !isDayHeader(row) && !isNoteLine(row)
