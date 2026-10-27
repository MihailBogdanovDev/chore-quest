import { registerSW } from 'virtual:pwa-register'

export const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Registers the service worker. In autoUpdate mode the page reloads itself once a new
 * version has taken over, so a deploy shows on the next update check instead of one launch late.
 * An installed app resumed from the background never navigates, so check on resume and hourly.
 */
export function startUpdates() {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (navigator.onLine) void registration.update()
      }
      setInterval(check, UPDATE_CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })
}
