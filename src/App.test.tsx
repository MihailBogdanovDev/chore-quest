import { act, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'
import * as data from './data'

vi.mock('./data', () => ({
  onAuthChange: vi.fn(),
  getMe: vi.fn(),
  createFamily: vi.fn(),
  signInAsKid: vi.fn(),
}))
vi.mock('./game/createGame', () => ({ createGame: vi.fn() }))

test('repeated auth events for the same user do not reload the screen', async () => {
  let emit: (s: data.Session | null) => void = () => {}
  vi.mocked(data.onAuthChange).mockImplementation((cb) => {
    emit = cb
    return () => {}
  })
  vi.mocked(data.getMe).mockResolvedValue(null)
  render(<App />)

  await act(async () => emit({ userId: 'u1', anonymous: false }))
  expect(await screen.findByRole('heading', { name: 'Start your family' })).toBeInTheDocument()

  // Token refresh: same user, new session object.
  await act(async () => emit({ userId: 'u1', anonymous: false }))
  expect(data.getMe).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('heading', { name: 'Start your family' })).toBeInTheDocument()
})
