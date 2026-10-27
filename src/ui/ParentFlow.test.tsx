import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import * as data from '../data'
import { ParentHome } from './ParentHome'
import { ParentSetup } from './ParentSetup'
import { Welcome } from './Welcome'

vi.mock('../data', () => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  sendPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  createFamily: vi.fn(),
  getFamily: vi.fn(),
  listKids: vi.fn(),
  addKid: vi.fn(),
  signOut: vi.fn(),
  listFamilyQuests: vi.fn().mockResolvedValue([]),
  postQuest: vi.fn(),
  reviewClaim: vi.fn(),
  subscribeFamily: vi.fn(() => () => {}),
}))

const kid = (name: string, joined: boolean): data.Member => ({
  id: name, familyId: 'f1', role: 'kid', displayName: name, avatar: 'knight',
  lifetimePoints: 0, walletPoints: 0, joined,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(data.listFamilyQuests).mockResolvedValue([])
  vi.mocked(data.subscribeFamily).mockReturnValue(() => {})
})

test('parent button opens the login screen', async () => {
  render(<Welcome onKid={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: "I'm a parent" }))
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
})

test('welcome screen shows the app version', () => {
  render(<Welcome onKid={vi.fn()} />)
  expect(screen.getByText(`version ${__APP_VERSION__}`)).toBeInTheDocument()
})

test('kid button hands off to the kid flow', async () => {
  const onKid = vi.fn()
  render(<Welcome onKid={onKid} />)
  await userEvent.click(screen.getByRole('button', { name: "I'm a kid" }))
  expect(onKid).toHaveBeenCalled()
})

test('kid sign-in errors are shown', async () => {
  const onKid = vi.fn().mockRejectedValue(new Error('Anonymous sign-ins are disabled'))
  render(<Welcome onKid={onKid} />)
  await userEvent.click(screen.getByRole('button', { name: "I'm a kid" }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Anonymous sign-ins are disabled')
})

test('parent creates a family', async () => {
  vi.mocked(data.createFamily).mockResolvedValue()
  const onDone = vi.fn()
  render(<ParentSetup onDone={onDone} />)
  await userEvent.type(screen.getByLabelText('Family name'), 'The Bogdanovs')
  await userEvent.type(screen.getByLabelText('Your name'), 'Mihail')
  await userEvent.click(screen.getByRole('button', { name: 'Create family' }))
  expect(data.createFamily).toHaveBeenCalledWith('The Bogdanovs', 'Mihail')
  expect(onDone).toHaveBeenCalled()
})

test('setup screen lets a parent sign out of the wrong account', async () => {
  render(<ParentSetup onDone={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(data.signOut).toHaveBeenCalled()
})

test('parent home shows invite code and kids, and adds a kid', async () => {
  vi.mocked(data.getFamily).mockResolvedValue({ id: 'f1', name: 'The Bogdanovs', inviteCode: 'ABC234' })
  vi.mocked(data.listKids).mockResolvedValueOnce([kid('Ben', true)]).mockResolvedValueOnce([kid('Ben', true), kid('Ana', false)])
  vi.mocked(data.addKid).mockResolvedValue()
  render(<ParentHome />)

  expect(await screen.findByRole('heading', { name: 'The Bogdanovs' })).toBeInTheDocument()
  expect(screen.getByText('ABC234')).toBeInTheDocument()
  const kidList = () => within(screen.getByRole('list', { name: 'Kids' }))
  expect(kidList().getByText(/Ben/)).toHaveTextContent('joined')
  expect(data.subscribeFamily).toHaveBeenCalledWith('f1', expect.any(Function))

  await userEvent.type(screen.getByLabelText('Kid name'), 'Ana')
  await userEvent.selectOptions(screen.getByLabelText('Avatar'), 'wizard')
  await userEvent.click(screen.getByRole('button', { name: 'Add kid' }))
  expect(data.addKid).toHaveBeenCalledWith('Ana', 'wizard')
  expect(await kidList().findByText(/Ana/)).toHaveTextContent('waiting')
})
