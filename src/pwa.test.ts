import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { registerSW } from 'virtual:pwa-register'
import { startUpdates, UPDATE_CHECK_MS } from './pwa'

vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }))

const update = vi.fn().mockResolvedValue(undefined)

function registered() {
  startUpdates()
  const options = vi.mocked(registerSW).mock.calls[0][0]!
  options.onRegisteredSW?.('/sw.js', { update } as unknown as ServiceWorkerRegistration)
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

test('registers the service worker straight away', () => {
  startUpdates()
  expect(registerSW).toHaveBeenCalledWith(expect.objectContaining({ immediate: true }))
})

test('checks for a new version when the app comes back to the foreground', () => {
  registered()
  setVisibility('hidden')
  expect(update).not.toHaveBeenCalled()
  setVisibility('visible')
  expect(update).toHaveBeenCalledTimes(1)
})

test('checks for a new version every hour while open', () => {
  registered()
  vi.advanceTimersByTime(UPDATE_CHECK_MS)
  expect(update).toHaveBeenCalledTimes(1)
})
