import { expect, test } from 'vitest'
import type { MonsterView } from '../core'
import { slainMonsters } from './diff'

const m = (questId: string): MonsterView => ({
  questId, kind: 'goblin', name: 'Goblin', size: 'M', scale: 1, claimed: false,
})

test('monster missing from the new view was slain', () => {
  expect(slainMonsters([m('a'), m('b')], [m('b')])).toEqual([m('a')])
})

test('new monsters are not slain', () => {
  expect(slainMonsters([m('a')], [m('a'), m('c')])).toEqual([])
})
