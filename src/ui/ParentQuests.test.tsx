import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { HOUR, type Quest } from '../core'
import type { Member } from '../data'
import { ClaimList } from './ClaimList'
import { QuestBoard } from './QuestBoard'
import { QuestForm } from './QuestForm'

const now = 1_000_000_000_000
const kid = (id: string, name: string): Member => ({
  id, familyId: 'f1', role: 'kid', displayName: name, avatar: 'wizard',
  xp: 0, gold: 0, streak: 0, bestStreak: 0, approvalsCount: 0, joined: true,
})
const kids = [kid('k1', 'Ana'), kid('k2', 'Ben')]
const quest = (over: Partial<Quest>): Quest => ({
  id: 'q1', kidId: 'k1', title: 'Do the dishes', category: 'dishes', gold: 25, repeat: 'none', chestGold: null,
  createdAt: now - 2 * HOUR, dueAt: now + 22 * HOUR, status: 'open', claimedAt: null, approvedAt: null,
  ...over,
})

test('parent posts a quest', async () => {
  const onPost = vi.fn().mockResolvedValue(undefined)
  render(<QuestForm kids={kids} now={now} onPost={onPost} />)
  await userEvent.type(screen.getByLabelText('Quest'), 'Take out trash')
  await userEvent.selectOptions(screen.getByLabelText('Chore type'), 'trash')
  await userEvent.clear(screen.getByLabelText('Gold'))
  await userEvent.type(screen.getByLabelText('Gold'), '40')
  await userEvent.selectOptions(screen.getByLabelText('For'), 'k1')
  await userEvent.click(screen.getByRole('button', { name: 'Post quest' }))
  expect(onPost).toHaveBeenCalledWith({
    kidId: 'k1', title: 'Take out trash', category: 'trash', gold: 40, repeat: 'none', dueAt: now + 24 * HOUR,
  })
  expect(screen.getByLabelText('Quest')).toHaveValue('')
})

test('no kids yet: ask to add one first', () => {
  render(<QuestForm kids={[]} now={now} onPost={vi.fn()} />)
  expect(screen.getByText('Add a kid first')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Post quest' })).not.toBeInTheDocument()
})

test('claims show who, what and the gold to award', async () => {
  const onReview = vi.fn().mockResolvedValue(undefined)
  const claimed = quest({ status: 'claimed', claimedAt: now - HOUR })
  render(<ClaimList quests={[claimed, quest({ id: 'q2' })]} kids={kids} onReview={onReview} />)
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(1)
  expect(items[0]).toHaveTextContent('Ana')
  expect(items[0]).toHaveTextContent('Do the dishes')
  expect(items[0]).toHaveTextContent('25G')
  await userEvent.click(within(items[0]).getByRole('button', { name: 'Approve' }))
  expect(onReview).toHaveBeenCalledWith('q1', true)
  await userEvent.click(within(items[0]).getByRole('button', { name: 'Reject' }))
  expect(onReview).toHaveBeenCalledWith('q1', false)
})

test('no claims: say so', () => {
  render(<ClaimList quests={[quest({})]} kids={kids} onReview={vi.fn()} />)
  expect(screen.getByText('Nothing to check')).toBeInTheDocument()
})

test('quest board shows open quests as monsters with gold', () => {
  render(<QuestBoard quests={[quest({ id: 'q3', kidId: 'k2', category: 'trash', gold: 10 })]} kids={kids} now={now} />)
  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('Garbage Golem')
  expect(item).toHaveTextContent('Ben')
  expect(item).toHaveTextContent('10G')
})
