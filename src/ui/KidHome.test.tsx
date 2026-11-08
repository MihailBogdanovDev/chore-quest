import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { Member } from './../data'
import { KidHome } from './KidHome'
import { mockQuests } from './mockQuests'

vi.mock('../game/createGame', () => ({
  createGame: () => ({ setView: vi.fn(), slay: vi.fn().mockResolvedValue(undefined), destroy: vi.fn() }),
}))

const now = 1_000_000_000_000
const me: Member = {
  id: 'k1', familyId: 'f', displayName: 'Ana', avatar: 'hero-1', xp: 120, gold: 20, streak: 2, bestStreak: 4, approvalsCount: 5,
} as Member

test('kid shell shows HUD, bounties and opens a bounty sheet', async () => {
  render(<KidHome me={me} quests={mockQuests(now)} rewards={[]} purchases={[]} now={now} onClaim={vi.fn()} onBuy={vi.fn()} />)
  expect(screen.getByText('Ana')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Bounties/ }))
  await userEvent.click(screen.getByText('Do the dishes'))
  expect(screen.getByRole('button', { name: 'SLAY!' })).toBeInTheDocument()
})
