import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { HOUR } from '../core'
import { KidHome } from './KidHome'
import { mockQuests } from './mockQuests'

let tap: (questId: string) => void = () => {}
vi.mock('../game/createGame', () => ({
  createGame: (_el: HTMLElement, _view: unknown, onTap: (id: string) => void) => {
    tap = onTap
    return { setView: vi.fn(), destroy: vi.fn() }
  },
}))

const now = 1_000_000_000_000
const quests = mockQuests(now)

beforeEach(() => {
  tap = () => {}
})

test('shows gold and open quest count', () => {
  render(<KidHome quests={quests} xp={120} gold={20} now={now} onClaim={vi.fn()} />)
  expect(screen.getByText('20G')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Quests (2)' })).toBeInTheDocument()
})

test('tapping a monster shows the quest and its gold', async () => {
  const onClaim = vi.fn()
  render(<KidHome quests={quests} xp={0} gold={0} now={now} onClaim={onClaim} />)
  act(() => tap('dishes'))
  expect(screen.getByRole('heading', { name: 'Do the dishes' })).toBeInTheDocument()
  expect(screen.getByText('10G')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Slay!' }))
  expect(onClaim).toHaveBeenCalledWith('dishes')
})

test('quest approved while its sheet is open shows it slain', () => {
  const props = { xp: 0, gold: 0, now, onClaim: vi.fn() }
  const { rerender } = render(<KidHome quests={quests} {...props} />)
  act(() => tap('trash'))
  const slain = quests.map((q) =>
    q.id === 'trash' ? { ...q, status: 'done' as const, approvedAt: now } : q,
  )
  rerender(<KidHome quests={slain} {...props} />)
  expect(screen.queryByText('Waiting for a parent to check')).not.toBeInTheDocument()
})

test('quest list opens the same detail', async () => {
  render(<KidHome quests={quests} xp={0} gold={0} now={now} onClaim={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Quests (2)' }))
  await userEvent.click(screen.getByRole('button', { name: /Clean your room/ }))
  expect(screen.getByRole('heading', { name: 'Clean your room' })).toBeInTheDocument()
})

test('mock dishes quest is due in 3 hours', () => {
  expect(quests.find((q) => q.id === 'dishes')?.dueAt).toBe(now + 3 * HOUR)
})
