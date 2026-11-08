import { tierFor, type Tier } from './base'
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

/** Everything the game scene needs to draw a kid's keep. */
export interface BaseView {
  tier: Tier
  monsters: MonsterView[]
}

export function buildBaseView(quests: Quest[], xp: number, now: number): BaseView {
  const monsters = quests
    .filter((q) => q.status !== 'done' && q.createdAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((q) => ({ questId: q.id, ...monsterFor(q.category, q.gold), claimed: q.status === 'claimed' }))
  return { tier: tierFor(xp), monsters }
}
