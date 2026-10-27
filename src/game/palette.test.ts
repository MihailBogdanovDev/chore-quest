import { expect, test } from 'vitest'
import type { HpBand, MonsterKind, Tier } from '../core'
import { BAND_TINT, MONSTER_COLOR, TIER_ORDER, TIER_WIDTH } from './palette'

const kinds: MonsterKind[] = [
  'water-slime', 'garbage-golem', 'dust-beast', 'sock-ghost', 'mud-critter', 'paper-imp', 'goblin',
]
const bands: HpBand[] = ['clean', 'dirty', 'cracked', 'wrecked', 'ruined']

test('every monster and band has a color', () => {
  for (const k of kinds) expect(MONSTER_COLOR[k]).toBeTypeOf('number')
  for (const b of bands) expect(BAND_TINT[b]).toBeTypeOf('number')
})

test('base grows with every tier', () => {
  const widths = TIER_ORDER.map((t: Tier) => TIER_WIDTH[t])
  expect(TIER_ORDER).toHaveLength(6)
  for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThan(widths[i - 1])
})
