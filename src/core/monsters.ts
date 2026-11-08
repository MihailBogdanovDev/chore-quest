import type { Category, Quest, Size } from './types'

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

/** Size from gold: small under 15, normal under 40, else boss. */
export function sizeFor(gold: number): Size {
  return gold < 15 ? 'S' : gold < 40 ? 'M' : 'L'
}

/** Which monster a quest becomes: category picks the kind, gold the size. */
export function monsterFor(category: Category, gold: number) {
  const size = sizeFor(gold)
  return { ...BY_CATEGORY[category], size, scale: SCALE[size] }
}

export function isOverdue(q: Pick<Quest, 'status' | 'dueAt'>, now: number): boolean {
  return q.status === 'open' && q.dueAt < now
}
