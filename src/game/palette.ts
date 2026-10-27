// Placeholder art colors until real pixel sprites land (issue #7).
import type { HpBand, MonsterKind, Tier } from '../core'

export const MONSTER_COLOR: Record<MonsterKind, number> = {
  'water-slime': 0x3fa9f5,
  'garbage-golem': 0x6b8e23,
  'dust-beast': 0xb8a99a,
  'sock-ghost': 0xf2f2f2,
  'mud-critter': 0x7b4a2a,
  'paper-imp': 0xf4e3b1,
  goblin: 0x4caf50,
}

/** Wall color as the base takes damage: clean → grimy → scorched. */
export const BAND_TINT: Record<HpBand, number> = {
  clean: 0xe8d5b0,
  dirty: 0xc2a878,
  cracked: 0x9c8460,
  wrecked: 0x6e5c45,
  ruined: 0x4a3f33,
}

export const TIER_ORDER: Tier[] = ['tent', 'hut', 'cottage', 'house', 'fort', 'castle']

export const TIER_WIDTH: Record<Tier, number> = {
  tent: 40,
  hut: 56,
  cottage: 72,
  house: 92,
  fort: 116,
  castle: 140,
}
