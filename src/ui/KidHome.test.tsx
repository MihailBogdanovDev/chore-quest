import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { buildBaseView, HOUR } from '../core'
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

test('shows wallet, hp and open quest count', () => {
  render(<KidHome quests={quests} lifetimePoints={120} walletPoints={20} now={now} onClaim={vi.fn()} />)
  expect(screen.getByText('20P')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Base HP' })).toHaveAttribute(
    'aria-valuenow',
    String(buildBaseView(quests, 120, now).hp),
  )
  expect(screen.getByRole('button', { name: 'Quests (2)' })).toBeInTheDocument()
})

test('tapping a monster shows the quest and its decaying worth', async () => {
  const onClaim = vi.fn()
  render(<KidHome quests={quests} lifetimePoints={0} walletPoints={0} now={now} onClaim={onClaim} />)
  act(() => tap('dishes'))
  expect(screen.getByRole('heading', { name: 'Do the dishes' })).toBeInTheDocument()
  expect(screen.getByText('10P → 9P in 3h')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Slay!' }))
  expect(onClaim).toHaveBeenCalledWith('dishes')
})

test('quest list opens the same detail', async () => {
  render(<KidHome quests={quests} lifetimePoints={0} walletPoints={0} now={now} onClaim={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Quests (2)' }))
  await userEvent.click(screen.getByRole('button', { name: /Clean your room/ }))
  expect(screen.getByRole('heading', { name: 'Clean your room' })).toBeInTheDocument()
})

test('mock dishes quest is due in 3 hours', () => {
  expect(quests.find((q) => q.id === 'dishes')?.dueAt).toBe(now + 3 * HOUR)
})
