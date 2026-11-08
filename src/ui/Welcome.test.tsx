import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Welcome } from './Welcome'

vi.mock('../data', () => ({ signInWithPassword: vi.fn(), signUp: vi.fn(), sendPasswordReset: vi.fn() }))

it('shows both entry points and calls onKid', async () => {
  const onKid = vi.fn().mockResolvedValue(undefined)
  render(<Welcome onKid={onKid} />)
  expect(screen.getByRole('button', { name: /quest giver/i })).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: /hero/i }))
  expect(onKid).toHaveBeenCalled()
})
