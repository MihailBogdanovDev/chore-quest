export type Tier = 'tent' | 'hut' | 'cottage' | 'house' | 'fort' | 'castle'

const TIERS: [number, Tier][] = [
  [3000, 'castle'],
  [1500, 'fort'],
  [700, 'house'],
  [300, 'cottage'],
  [100, 'hut'],
]

/** Keep tier from XP. */
export function tierFor(xp: number): Tier {
  return TIERS.find(([min]) => xp >= min)?.[1] ?? 'tent'
}
