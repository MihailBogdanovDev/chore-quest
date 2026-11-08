export interface LevelInfo {
  level: number
  title: string
  xpIntoLevel: number
  xpForLevel: number
  progress: number
}

/** Total XP needed to reach level n (lvl2 = 50, lvl3 = 150, lvl4 = 300...). */
const xpToReach = (n: number) => (50 * (n - 1) * n) / 2

const TITLES: [number, string][] = [
  [16, 'Legend'],
  [12, 'Lord'],
  [8, 'Paladin'],
  [5, 'Champion'],
  [3, 'Knight'],
  [1, 'Squire'],
]

export function levelFor(xp: number): LevelInfo {
  let level = 1
  while (xpToReach(level + 1) <= xp) level++
  const xpIntoLevel = xp - xpToReach(level)
  const xpForLevel = xpToReach(level + 1) - xpToReach(level)
  return {
    level,
    title: TITLES.find(([min]) => level >= min)![1],
    xpIntoLevel,
    xpForLevel,
    progress: xpIntoLevel / xpForLevel,
  }
}
