import { describe, expect, test } from 'vitest'
import { nextDrop, pointsAt } from './points'
import { HOUR as H } from './rules'

const due = 1_000_000_000_000
const S = { size: 'S' as const, dueAt: due }
const M = { size: 'M' as const, dueAt: due }
const L = { size: 'L' as const, dueAt: due }

describe('pointsAt', () => {
  test('full points before due', () => expect(pointsAt(M, due - H)).toBe(25))
  test('exactly at due is on time', () => expect(pointsAt(M, due)).toBe(25))
  test('1ms late drops one step', () => expect(pointsAt(M, due + 1)).toBe(22))
  test('30h late: spec example', () => expect(pointsAt(M, due + 30 * H)).toBe(17))
  test('integer math, no float drift', () => expect(pointsAt(L, due + 36 * H)).toBe(42))
  test('floor at 25%', () => expect(pointsAt(S, due + 1000 * H)).toBe(2))
})

describe('nextDrop', () => {
  test('before due: drops right after due', () =>
    expect(nextDrop(M, due - 3 * H)).toEqual({ at: due, points: 22 }))
  test('while late: next 12h boundary', () =>
    expect(nextDrop(M, due + 5 * H)).toEqual({ at: due + 12 * H, points: 20 }))
  test('at floor: no more drops', () => expect(nextDrop(M, due + 1000 * H)).toBeNull())
})
