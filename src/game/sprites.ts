// Pixel-art sprites generated with PixelLab (see CREDITS.md), served from public/sprites.
import type { MonsterKind, Tier } from '../core'

const base = `${import.meta.env.BASE_URL}sprites`

export const MONSTER_SPRITE: Record<MonsterKind, string> = {
  'water-slime': `${base}/monsters/water-slime.png`,
  'garbage-golem': `${base}/monsters/garbage-golem.png`,
  'dust-beast': `${base}/monsters/dust-beast.png`,
  'sock-ghost': `${base}/monsters/sock-ghost.png`,
  'mud-critter': `${base}/monsters/mud-critter.png`,
  'paper-imp': `${base}/monsters/paper-imp.png`,
  goblin: `${base}/monsters/goblin.png`,
}

export const BASE_SPRITE: Record<Tier, string> = {
  tent: `${base}/bases/tent.png`,
  hut: `${base}/bases/hut.png`,
  cottage: `${base}/bases/cottage.png`,
  house: `${base}/bases/house.png`,
  fort: `${base}/bases/fort.png`,
  castle: `${base}/bases/castle.png`,
}

export const monsterKey = (kind: MonsterKind) => `monster-${kind}`
export const baseKey = (tier: Tier) => `base-${tier}`
