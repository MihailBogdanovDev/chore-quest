import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { HOUR } from '../core'
import type { FamilyQuest, Member } from '../data'
import { ClaimList } from './ClaimList'
import { QuestBoard } from './QuestBoard'
import { QuestForm } from './QuestForm'

const now = 1_000_000_000_000
const kid = (id: string, name: string): Member => ({
  id, familyId: 'f1', role: 'kid', displayName: name, avatar: 'wizard',
  lifetimePoints: 0, walletPoints: 0, joined: true,
})
const kids = [kid('k1', 'Ana'), kid('k2', 'Ben')]
const quest = (over: Partial<FamilyQuest>): FamilyQuest => ({
  id: 'q1', kidId: 'k1', title: 'Do the dishes', category: 'dishes', size: 'M',
  createdAt: now - 2 * HOUR, dueAt: now + 22 * HOUR, status: 'open', claimedAt: null, approvedAt: null,
  ...over,
})

test('parent posts a quest', async () => {
  const onPost = vi.fn().mockResolvedValue(undefined)
  render(<QuestForm kids={kids} now={now} onPost={onPost} />)
  await userEvent.type(screen.getByLabelText('Quest'), 'Take out trash')
  await userEvent.selectOptions(screen.getByLabelText('Chore type'), 'trash')
  await userEvent.selectOptions(screen.getByLabelText('Size'), 'L')
  await userEvent.selectOptions(screen.getByLabelText('For'), 'k1')
  await userEvent.click(screen.getByRole('button', { name: 'Post quest' }))
  expect(onPost).toHaveBeenCalledWith({
    kidId: 'k1', title: 'Take out trash', category: 'trash', size: 'L', dueAt: now + 24 * HOUR,
  })
  expect(screen.getByLabelText('Quest')).toHaveValue('')
})

test('no kids yet: ask to add one first', () => {
  render(<QuestForm kids={[]} now={now} onPost={vi.fn()} />)
  expect(screen.getByText('Add a kid first')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Post quest' })).not.toBeInTheDocument()
})

test('claims show who, what and the points to award', async () => {
  const onReview = vi.fn().mockResolvedValue(undefined)
  const claimed = quest({ status: 'claimed', claimedAt: now - HOUR })
  render(<ClaimList quests={[claimed, quest({ id: 'q2' })]} kids={kids} onReview={onReview} />)
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(1)
  expect(items[0]).toHaveTextContent('Ana')
  expect(items[0]).toHaveTextContent('Do the dishes')
  expect(items[0]).toHaveTextContent('25P')
  await userEvent.click(within(items[0]).getByRole('button', { name: 'Approve' }))
  expect(onReview).toHaveBeenCalledWith('q1', true)
  await userEvent.click(within(items[0]).getByRole('button', { name: 'Reject' }))
  expect(onReview).toHaveBeenCalledWith('q1', false)
})

test('no claims: say so', () => {
  render(<ClaimList quests={[quest({})]} kids={kids} onReview={vi.fn()} />)
  expect(screen.getByText('Nothing to check')).toBeInTheDocument()
})

test('quest board shows open quests as monsters with current worth', () => {
  render(<QuestBoard quests={[quest({ id: 'q3', kidId: 'k2', category: 'trash', size: 'S' })]} kids={kids} now={now} />)
  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('Garbage Golem')
  expect(item).toHaveTextContent('Ben')
  expect(item).toHaveTextContent('10P')
})
