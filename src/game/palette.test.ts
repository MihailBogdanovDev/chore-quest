import { expect, test } from 'vitest'
import type { MonsterKind, Tier } from '../core'
import { MONSTER_COLOR, TIER_ORDER, TIER_WIDTH } from './palette'

const kinds: MonsterKind[] = [
  'water-slime', 'garbage-golem', 'dust-beast', 'sock-ghost', 'mud-critter', 'paper-imp', 'goblin',
]

test('every monster has a burst color', () => {
  for (const k of kinds) expect(MONSTER_COLOR[k]).toBeTypeOf('number')
})

test('base grows with every tier', () => {
  const widths = TIER_ORDER.map((t: Tier) => TIER_WIDTH[t])
  expect(TIER_ORDER).toHaveLength(6)
  for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThan(widths[i - 1])
})
