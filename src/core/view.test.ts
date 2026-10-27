import { expect, test } from 'vitest'
import { HOUR as H } from './rules'
import type { Quest } from './types'
import { buildBaseView } from './view'

const t0 = 1_000_000_000_000
const base: Quest = {
  id: '', title: '', category: 'other', size: 'M', createdAt: t0, dueAt: t0 + 24 * H,
  status: 'open', claimedAt: null, approvedAt: null,
}

test('empty family: fresh tent', () =>
  expect(buildBaseView([], 0, t0)).toEqual({ tier: 'tent', hp: 100, band: 'clean', monsters: [] }))

test('only live monsters, oldest first', () => {
  const quests: Quest[] = [
    { ...base, id: 'claimed', category: 'trash', createdAt: t0 + H, status: 'claimed', claimedAt: t0 + 2 * H },
    { ...base, id: 'open', category: 'dishes', size: 'L' },
    { ...base, id: 'done', status: 'done', claimedAt: t0, approvedAt: t0 },
    { ...base, id: 'future', createdAt: t0 + 10 * H },
  ]
  const view = buildBaseView(quests, 120, t0 + 3 * H)
  expect(view.tier).toBe('hut')
  expect(view.monsters).toEqual([
    { questId: 'open', kind: 'water-slime', name: 'Water Slime', size: 'L', scale: 1.6, claimed: false },
    { questId: 'claimed', kind: 'garbage-golem', name: 'Garbage Golem', size: 'M', scale: 1, claimed: true },
  ])
})
