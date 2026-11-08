import { describe, expect, it } from 'vitest'
import { levelFor, monsterFor } from '.'

describe('levelFor', () => {
  it('follows the curve', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, title: 'Squire', xpIntoLevel: 0, xpForLevel: 50, progress: 0 })
    expect(levelFor(50).level).toBe(2)
    expect(levelFor(149).level).toBe(2)
    expect(levelFor(150)).toMatchObject({ level: 3, title: 'Knight' })
    expect(levelFor(300).level).toBe(4)
    expect(levelFor(100).progress).toBe(1 / 2)
  })
})

describe('monsterFor', () => {
  it('derives size from gold', () => {
    expect(monsterFor('dishes', 14).size).toBe('S')
    expect(monsterFor('dishes', 15).size).toBe('M')
    expect(monsterFor('dishes', 39).size).toBe('M')
    expect(monsterFor('dishes', 40).size).toBe('L')
    expect(monsterFor('dishes', 10).kind).toBe('water-slime')
  })
})
