import type { Category, Size } from './types'

export type MonsterKind =
  | 'water-slime'
  | 'garbage-golem'
  | 'dust-beast'
  | 'sock-ghost'
  | 'mud-critter'
  | 'paper-imp'
  | 'goblin'

const BY_CATEGORY: Record<Category, { kind: MonsterKind; name: string }> = {
  dishes: { kind: 'water-slime', name: 'Water Slime' },
  trash: { kind: 'garbage-golem', name: 'Garbage Golem' },
  room: { kind: 'dust-beast', name: 'Dust Beast' },
  laundry: { kind: 'sock-ghost', name: 'Sock Ghost' },
  pets: { kind: 'mud-critter', name: 'Mud Critter' },
  homework: { kind: 'paper-imp', name: 'Paper Imp' },
  other: { kind: 'goblin', name: 'Goblin' },
}

const SCALE: Record<Size, number> = { S: 0.6, M: 1, L: 1.6 }

/** Which monster a quest becomes (spec §3.1): category picks the element, size the bulk. */
export function monsterFor(category: Category, size: Size) {
  return { ...BY_CATEGORY[category], scale: SCALE[size] }
}
