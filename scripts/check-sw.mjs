// Fails the build check if the generated service worker would wait instead of taking over.
// Without skipWaiting/clientsClaim a deploy only reaches phones after every app window closes.
import { readFileSync } from 'node:fs'

const sw = readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8')
const withoutMessageHandler = sw.replace(/addEventListener\("message"[^}]*\}/g, '')
const problems = []
if (!/self\.skipWaiting\(\)/.test(withoutMessageHandler)) problems.push('no unconditional self.skipWaiting()')
if (!/clientsClaim\(\)/.test(sw)) problems.push('no clientsClaim()')

if (problems.length) {
  console.error(`dist/sw.js: ${problems.join(', ')}`)
  process.exit(1)
}
console.log('dist/sw.js takes over immediately')
