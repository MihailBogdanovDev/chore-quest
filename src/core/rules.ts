// Game numbers from spec §3. Kept in one place so parents can tune them later (FR-18).
import type { Size } from './types'

export const HOUR = 3_600_000

export const DAMAGE_PER_HOUR: Record<Size, number> = { S: 2, M: 5, L: 10 }
export const BASE_POINTS: Record<Size, number> = { S: 10, M: 25, L: 60 }

export const MAX_HP = 100
export const HEAL_ON_APPROVE = 5
export const REGEN_PER_HOUR = 1

export const DECAY_PERCENT_PER_STEP = 10
export const DECAY_STEP_MS = 12 * HOUR
export const FLOOR_PERCENT = 25

export const DEFAULT_DUE_MS = 24 * HOUR
