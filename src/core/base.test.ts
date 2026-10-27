import { describe, expect, test } from 'vitest'
import { baseHp, hpBand, tierFor } from './base'
import { HOUR as H } from './rules'
import type { Quest, Size } from './types'

const t0 = 1_000_000_000_000
let n = 0
function q(size: Size, createdAt: number, extra: Partial<Quest> = {}): Quest {
  return {
    id: `q${n++}`,
    title: 'chore',
    category: 'other',
    size,
    createdAt,
    dueAt: createdAt + 24 * H,
    status: 'open',
    claimedAt: null,
    approvedAt: null,
    ...extra,
  }
}
const done = (at: number) => ({ status: 'done' as const, claimedAt: at, approvedAt: at })

describe('baseHp', () => {
  test('no quests: full hp', () => expect(baseHp([], t0)).toBe(100))
  test('one M monster for 4h', () => expect(baseHp([q('M', t0)], t0 + 4 * H)).toBe(80))
  test('damage adds up', () => expect(baseHp([q('S', t0), q('L', t0)], t0 + 5 * H)).toBe(40))
  test('clamps at 0', () => expect(baseHp([q('L', t0)], t0 + 20 * H)).toBe(0))
  test('approval heals 5', () => expect(baseHp([q('M', t0, done(t0 + 4 * H))], t0 + 4 * H)).toBe(85))
  test('regen 1/h with no monsters', () =>
    expect(baseHp([q('M', t0, done(t0 + 4 * H))], t0 + 10 * H)).toBe(91))
  test('regen and heal cap at 100', () =>
    expect(baseHp([q('S', t0, done(t0 + H))], t0 + 100 * H)).toBe(100))
  test('claimed monster still attacks', () =>
    expect(baseHp([q('M', t0, { status: 'claimed', claimedAt: t0 + 2 * H })], t0 + 4 * H)).toBe(80))
  test('quest from the future is ignored', () => expect(baseHp([q('L', t0 + H)], t0)).toBe(100))
  test('ruined base recovers after approval', () =>
    expect(baseHp([q('L', t0, done(t0 + 20 * H))], t0 + 20 * H)).toBe(5))
})

describe('hpBand', () => {
  test.each([
    [100, 'clean'], [76, 'clean'], [75, 'dirty'], [51, 'dirty'], [50, 'cracked'],
    [26, 'cracked'], [25, 'wrecked'], [1, 'wrecked'], [0, 'ruined'],
  ])('%i → %s', (hp, band) => expect(hpBand(hp)).toBe(band))
})

describe('tierFor', () => {
  test.each([
    [-5, 'tent'], [0, 'tent'], [99, 'tent'], [100, 'hut'], [300, 'cottage'],
    [700, 'house'], [1500, 'fort'], [2999, 'fort'], [3000, 'castle'],
  ])('%i → %s', (pts, tier) => expect(tierFor(pts)).toBe(tier))
})
