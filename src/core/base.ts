import { DAMAGE_PER_HOUR, HEAL_ON_APPROVE, HOUR, MAX_HP, REGEN_PER_HOUR } from './rules'
import type { Quest } from './types'

export type HpBand = 'clean' | 'dirty' | 'cracked' | 'wrecked' | 'ruined'
export type Tier = 'tent' | 'hut' | 'cottage' | 'house' | 'fort' | 'castle'

interface HpEvent {
  at: number
  kind: 'spawn' | 'slay'
  rate: number
}

const clamp = (hp: number) => Math.min(MAX_HP, Math.max(0, hp))

/**
 * Base HP at `now` (spec §3.3), replayed from quest timestamps so nothing has to be stored.
 * Monsters drain HP from creation until approval; with no monster alive the base regenerates.
 */
export function baseHp(quests: Quest[], now: number): number {
  const events: HpEvent[] = []
  for (const q of quests) {
    if (q.createdAt > now) continue
    const rate = DAMAGE_PER_HOUR[q.size]
    events.push({ at: q.createdAt, kind: 'spawn', rate })
    if (q.approvedAt !== null && q.approvedAt <= now) events.push({ at: q.approvedAt, kind: 'slay', rate })
  }
  // At equal times spawns go first, so a monster always exists before it is slain.
  events.sort((a, b) => a.at - b.at || (a.kind === 'spawn' ? -1 : 1))

  let hp = MAX_HP
  let rate = 0
  let t = events[0]?.at ?? now
  const advance = (to: number) => {
    const hours = (to - t) / HOUR
    hp = clamp(rate > 0 ? hp - rate * hours : hp + REGEN_PER_HOUR * hours)
    t = to
  }

  for (const e of events) {
    advance(e.at)
    if (e.kind === 'spawn') {
      rate += e.rate
    } else {
      rate -= e.rate
      hp = clamp(hp + HEAL_ON_APPROVE)
    }
  }
  advance(now)
  return Math.round(hp)
}

export function hpBand(hp: number): HpBand {
  if (hp > 75) return 'clean'
  if (hp > 50) return 'dirty'
  if (hp > 25) return 'cracked'
  if (hp > 0) return 'wrecked'
  return 'ruined'
}

const TIERS: [number, Tier][] = [
  [3000, 'castle'],
  [1500, 'fort'],
  [700, 'house'],
  [300, 'cottage'],
  [100, 'hut'],
]

/** Base tier from lifetime points (spec §3.4). */
export function tierFor(lifetimePoints: number): Tier {
  return TIERS.find(([min]) => lifetimePoints >= min)?.[1] ?? 'tent'
}
