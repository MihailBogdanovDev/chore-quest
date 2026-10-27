import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import * as data from '../data'
import { ParentAuth } from './ParentAuth'
import { PasswordForm } from './PasswordForm'

vi.mock('../data', () => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  sendPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function fill(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
}

test('parent logs in with email and password', async () => {
  vi.mocked(data.signInWithPassword).mockResolvedValue()
  render(<ParentAuth />)
  await fill('mum@example.com', 'secret123')
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
  expect(data.signInWithPassword).toHaveBeenCalledWith('mum@example.com', 'secret123')
})

test('wrong password shows the error', async () => {
  vi.mocked(data.signInWithPassword).mockRejectedValue(new Error('Invalid login credentials'))
  render(<ParentAuth />)
  await fill('mum@example.com', 'nope12345')
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
})

test('new parent creates an account and is told to confirm the email', async () => {
  vi.mocked(data.signUp).mockResolvedValue({ needsConfirmation: true })
  render(<ParentAuth />)
  await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
  await fill('dad@example.com', 'longenough')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(data.signUp).toHaveBeenCalledWith('dad@example.com', 'longenough')
  expect(await screen.findByText(/Check your email to confirm/)).toBeInTheDocument()
})

test('passwords shorter than 8 characters are refused before calling the server', async () => {
  render(<ParentAuth />)
  await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
  await fill('dad@example.com', 'short')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(data.signUp).not.toHaveBeenCalled()
  expect(await screen.findByRole('alert')).toHaveTextContent('at least 8 characters')
})

test('forgot password sends a reset email', async () => {
  vi.mocked(data.sendPasswordReset).mockResolvedValue()
  render(<ParentAuth />)
  await userEvent.type(screen.getByLabelText('Email'), 'mum@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
  expect(data.sendPasswordReset).toHaveBeenCalledWith('mum@example.com')
  expect(await screen.findByText(/reset link/)).toBeInTheDocument()
})

test('forgot password needs an email first', async () => {
  render(<ParentAuth />)
  await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
  expect(data.sendPasswordReset).not.toHaveBeenCalled()
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter your email')
})

test('password form saves a matching new password', async () => {
  vi.mocked(data.updatePassword).mockResolvedValue()
  const onSaved = vi.fn()
  render(<PasswordForm onSaved={onSaved} />)
  await userEvent.type(screen.getByLabelText('New password'), 'brandnew99')
  await userEvent.type(screen.getByLabelText('Repeat password'), 'brandnew99')
  await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
  expect(data.updatePassword).toHaveBeenCalledWith('brandnew99')
  expect(onSaved).toHaveBeenCalled()
})

test('password form refuses mismatched passwords', async () => {
  render(<PasswordForm onSaved={vi.fn()} />)
  await userEvent.type(screen.getByLabelText('New password'), 'brandnew99')
  await userEvent.type(screen.getByLabelText('Repeat password'), 'brandnew98')
  await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
  expect(data.updatePassword).not.toHaveBeenCalled()
  expect(await screen.findByRole('alert')).toHaveTextContent("Passwords don't match")
})
