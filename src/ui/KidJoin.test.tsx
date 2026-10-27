import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import * as data from '../data'
import { KidJoin } from './KidJoin'

vi.mock('../data', () => ({
  findKids: vi.fn(),
  joinFamily: vi.fn(),
  signOut: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('kid enters code, picks themselves and joins', async () => {
  vi.mocked(data.findKids).mockResolvedValue([
    { id: 'k1', displayName: 'Ana', avatar: 'wizard' },
    { id: 'k2', displayName: 'Ben', avatar: 'knight' },
  ])
  vi.mocked(data.joinFamily).mockResolvedValue()
  const onJoined = vi.fn()
  render(<KidJoin onJoined={onJoined} />)

  await userEvent.type(screen.getByLabelText('Family code'), 'abc234')
  await userEvent.click(screen.getByRole('button', { name: 'Find my family' }))
  expect(data.findKids).toHaveBeenCalledWith('ABC234')

  await userEvent.click(await screen.findByRole('button', { name: /Ana/ }))
  expect(data.joinFamily).toHaveBeenCalledWith('ABC234', 'k1')
  expect(onJoined).toHaveBeenCalled()
})

test('unknown code says so', async () => {
  vi.mocked(data.findKids).mockResolvedValue([])
  render(<KidJoin onJoined={vi.fn()} />)
  await userEvent.type(screen.getByLabelText('Family code'), 'ZZZZZZ')
  await userEvent.click(screen.getByRole('button', { name: 'Find my family' }))
  expect(await screen.findByText('No kids found for that code')).toBeInTheDocument()
})
