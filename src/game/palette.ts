// Colors and sizes the scene still draws in code around the sprites.
import type { HpBand, MonsterKind, Tier } from '../core'

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

/** Tint multiplied over the base sprite as it takes damage: clean → grimy → scorched. */
export const BAND_TINT: Record<HpBand, number> = {
  clean: 0xffffff,
  dirty: 0xd9cbb4,
  cracked: 0xb8a68a,
  wrecked: 0x8f7e67,
  ruined: 0x6b5f52,
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
