import type { Tier } from '../../core'
import { heroSrc, MONSTER_SPRITE } from '../../game/sprites'
import type { MonsterKind } from '../../core'

export { heroSrc }
export const monsterSrc = (kind: MonsterKind) => MONSTER_SPRITE[kind]
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
export const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function timeLeft(dueAt: number, now: number): { text: string; late: boolean } {
  const ms = dueAt - now
  if (ms < 0) return { text: 'Overdue!', late: true }
  const min = Math.ceil(ms / 60_000)
  if (min < 60) return { text: `${min}m left`, late: false }
  const h = Math.floor(min / 60)
  if (h < 48) return { text: `${h}h left`, late: false }
  return { text: `${Math.floor(h / 24)}d left`, late: false }
}

/** Stable small tilt per id so the notes look hand-pinned. */
export function tilt(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return ((Math.abs(h) % 7) - 3) * 0.5
}

export const REPEAT_LABEL = { none: '', daily: 'Daily', weekly: 'Weekly' } as const

const TIER_XP: [Tier, number][] = [['tent', 0], ['hut', 100], ['cottage', 300], ['house', 700], ['fort', 1500], ['castle', 3000]]
export function nextTier(xp: number): { tier: Tier; xp: number } | null {
  const n = TIER_XP.find(([, min]) => xp < min)
  return n ? { tier: n[0], xp: n[1] } : null
}

export function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
export function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
