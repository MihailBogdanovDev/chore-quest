import { baseHp, hpBand, tierFor, type HpBand, type Tier } from './base'
import { monsterFor, type MonsterKind } from './monsters'
import type { Quest, Size } from './types'

export interface MonsterView {
  questId: string
  kind: MonsterKind
  name: string
  size: Size
  scale: number
  claimed: boolean
}

/** Everything the game scene needs to draw a kid's base. */
export interface BaseView {
  tier: Tier
  hp: number
  band: HpBand
  monsters: MonsterView[]
}

export function buildBaseView(quests: Quest[], lifetimePoints: number, now: number): BaseView {
  const hp = baseHp(quests, now)
  const monsters = quests
    .filter((q) => q.status !== 'done' && q.createdAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((q) => ({
      questId: q.id,
      ...monsterFor(q.category, q.size),
      size: q.size,
      claimed: q.status === 'claimed',
    }))
  return { tier: tierFor(lifetimePoints), hp, band: hpBand(hp), monsters }
}
