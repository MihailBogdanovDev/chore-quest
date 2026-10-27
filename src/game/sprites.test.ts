import { expect, test } from 'vitest'
import type { MonsterKind } from '../core'
import { TIER_ORDER } from './palette'
import { BASE_SPRITE, MONSTER_SPRITE } from './sprites'

const kinds: MonsterKind[] = [
  'water-slime', 'garbage-golem', 'dust-beast', 'sock-ghost', 'mud-critter', 'paper-imp', 'goblin',
]
const files = Object.keys(import.meta.glob('../../public/sprites/**/*.png')).map((f) => f.replace('../../public', ''))
const onDisk = (url: string) => files.includes(url)

test('every monster kind has a sprite file', () => {
  for (const k of kinds) {
    expect(MONSTER_SPRITE[k]).toMatch(new RegExp(`/sprites/monsters/${k}\\.png$`))
    expect(onDisk(MONSTER_SPRITE[k])).toBe(true)
  }
})

test('every tier has a sprite file', () => {
  for (const t of TIER_ORDER) {
    expect(BASE_SPRITE[t]).toMatch(new RegExp(`/sprites/bases/${t}\\.png$`))
    expect(onDisk(BASE_SPRITE[t])).toBe(true)
  }
})
