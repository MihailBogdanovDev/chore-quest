import { expect, test } from 'vitest'
import { toMember, toQuest } from './mappers'

test('quest row → core Quest with epoch ms timestamps', () => {
  const quest = toQuest({
    id: 'q1',
    family_id: 'f1',
    kid_id: 'k1',
    title: 'Do the dishes',
    category: 'dishes',
    size: 'M',
    created_at: '2026-10-27T10:00:00+00:00',
    due_at: '2026-10-28T10:00:00+00:00',
    status: 'claimed',
    claimed_at: '2026-10-27T12:30:00+00:00',
    approved_at: null,
    proof_path: null,
    points_awarded: null,
  })
  expect(quest).toEqual({
    id: 'q1',
    title: 'Do the dishes',
    category: 'dishes',
    size: 'M',
    createdAt: Date.parse('2026-10-27T10:00:00Z'),
    dueAt: Date.parse('2026-10-28T10:00:00Z'),
    status: 'claimed',
    claimedAt: Date.parse('2026-10-27T12:30:00Z'),
    approvedAt: null,
  })
})

test('member row → Member, unbound kid is not joined', () => {
  expect(
    toMember({
      id: 'k1',
      family_id: 'f1',
      user_id: null,
      role: 'kid',
      display_name: 'Ana',
      avatar: 'wizard',
      lifetime_points: 120,
      wallet_points: 20,
      created_at: '2026-10-27T10:00:00+00:00',
    }),
  ).toEqual({
    id: 'k1',
    familyId: 'f1',
    role: 'kid',
    displayName: 'Ana',
    avatar: 'wizard',
    lifetimePoints: 120,
    walletPoints: 20,
    joined: false,
  })
})
