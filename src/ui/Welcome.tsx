import { useState, type FormEvent } from 'react'
import { sendMagicLink } from '../data'
import './screens.css'
import { useAction } from './useAction'

export function Welcome({ onKid }: { onKid: () => void }) {
  const [mode, setMode] = useState<'pick' | 'parent' | 'sent'>('pick')
  const [email, setEmail] = useState('')
  const { run, busy, error } = useAction()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await sendMagicLink(email)
      setMode('sent')
    })
  }

  return (
    <main className="screen">
      <h1 className="logo">Chore Quest</h1>
      {mode === 'pick' && (
        <div className="stack">
          <button className="big" onClick={() => setMode('parent')}>
            I'm a parent
          </button>
          <button className="big alt" onClick={onKid}>
            I'm a kid
          </button>
        </div>
      )}
      {mode === 'parent' && (
        <form className="stack" onSubmit={submit}>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="big" disabled={busy}>
            Send magic link
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      {mode === 'sent' && <p>Check your email for a sign-in link.</p>}
    </main>
  )
}
