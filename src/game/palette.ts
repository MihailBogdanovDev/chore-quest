// Colors and sizes the scene still draws in code around the sprites.
import type { MonsterKind, Tier } from '../core'

/** Pixel color a slain monster bursts into, picked from its sprite. */
export const MONSTER_COLOR: Record<MonsterKind, number> = {
  'water-slime': 0x3fa9f5,
  'garbage-golem': 0x6b8e23,
  'dust-beast': 0xb8a99a,
  'sock-ghost': 0xf2f2f2,
  'mud-critter': 0x7b4a2a,
  'paper-imp': 0xf4e3b1,
  goblin: 0x4caf50,
}

export const TIER_ORDER: Tier[] = ['tent', 'hut', 'cottage', 'house', 'fort', 'castle']

/** Width the base sprite is drawn at, in logical pixels. */
export const TIER_WIDTH: Record<Tier, number> = {
  tent: 40,
  hut: 56,
  cottage: 72,
  house: 92,
  fort: 116,
  castle: 140,
}
