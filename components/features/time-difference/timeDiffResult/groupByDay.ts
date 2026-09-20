import { DayGroup, DayGroupRow, isDayHeader, TimeDiffRow } from '../types'
import {
  aggregatePauses,
  aggregateTimeDifference,
} from './aggregateTimeDifference'

const toGroup = (label: string | undefined, rows: DayGroupRow[]): DayGroup => ({
  label,
  rows,
  total: aggregateTimeDifference(rows),
  pauseTotal: aggregatePauses(rows),
})

/**
 * Splits the rows into work days at every day header, each with its own
 * totals.
 *
 * Notes pasted from a single day carry no header at all, which yields exactly
 * one unlabelled group — the table can then render it without any day
 * scaffolding and look as it always did.
 */
export const groupByDay = (rows: TimeDiffRow[]): DayGroup[] => {
  const groups: DayGroup[] = []
  let label: string | undefined
  let current: DayGroupRow[] = []

  for (const row of rows) {
    if (isDayHeader(row)) {
      if (current.length > 0) {
        groups.push(toGroup(label, current))
      }
      label = row.label
      current = []
      continue
    }

    current.push(row)
  }

  if (current.length > 0 || groups.length === 0) {
    groups.push(toGroup(label, current))
  }

  return groups
}
