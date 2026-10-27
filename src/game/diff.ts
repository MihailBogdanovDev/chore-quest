import type { MonsterView } from '../core'

/** Monsters that were on screen and are gone now: their quests were approved. */
export function slainMonsters(prev: MonsterView[], next: MonsterView[]): MonsterView[] {
  const alive = new Set(next.map((m) => m.questId))
  return prev.filter((m) => !alive.has(m.questId))
}
