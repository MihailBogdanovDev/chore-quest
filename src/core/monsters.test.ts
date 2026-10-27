import { expect, test } from 'vitest'
import { monsterFor } from './monsters'
import type { Category } from './types'

test('dishes boss is a big water slime', () =>
  expect(monsterFor('dishes', 'L')).toEqual({ kind: 'water-slime', name: 'Water Slime', scale: 1.6 }))

test('size sets scale', () => {
  expect(monsterFor('trash', 'S').scale).toBe(0.6)
  expect(monsterFor('trash', 'M').scale).toBe(1)
})

test('every category has its own monster', () => {
  const cats: Category[] = ['dishes', 'trash', 'room', 'laundry', 'pets', 'homework', 'other']
  expect(new Set(cats.map((c) => monsterFor(c, 'M').kind)).size).toBe(cats.length)
})
