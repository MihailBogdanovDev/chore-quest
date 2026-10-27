import { BASE_POINTS, DECAY_PERCENT_PER_STEP, DECAY_STEP_MS, FLOOR_PERCENT } from './rules'
import type { Quest } from './types'

type Priced = Pick<Quest, 'size' | 'dueAt'>

/** Number of started decay steps at `at`. Exactly at due is still on time. */
function lateSteps(q: Priced, at: number): number {
  const late = at - q.dueAt
  return late <= 0 ? 0 : Math.ceil(late / DECAY_STEP_MS)
}

function percentAfter(steps: number): number {
  return Math.max(FLOOR_PERCENT, 100 - DECAY_PERCENT_PER_STEP * steps)
}

/** Points a quest is worth if claimed at `at` (spec §3.2). Integer math avoids float drift. */
export function pointsAt(q: Priced, at: number): number {
  return Math.floor((BASE_POINTS[q.size] * percentAfter(lateSteps(q, at))) / 100)
}

/** When the worth next drops and what it drops to, or null once at the floor. */
export function nextDrop(q: Priced, now: number): { at: number; points: number } | null {
  const steps = lateSteps(q, now)
  if (percentAfter(steps) === FLOOR_PERCENT) return null
  const at = q.dueAt + steps * DECAY_STEP_MS
  return { at, points: pointsAt(q, at + 1) }
}
