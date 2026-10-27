import { useState, type FormEvent } from 'react'
import { sendPasswordReset, signInWithPassword, signUp } from '../data'
import { checkPassword } from './passwords'
import './screens.css'
import { useAction } from './useAction'

type Mode = 'login' | 'signup'

/** Parent log in / create account. Happens inside the app, so it works from the installed home-screen app. */
export function ParentAuth() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const { run, busy, error } = useAction()

  const switchTo = (next: Mode) => {
    setMode(next)
    setNotice(null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (mode === 'login') {
        await signInWithPassword(email, password)
        return
      }
      checkPassword(password)
      const { needsConfirmation } = await signUp(email, password)
      if (needsConfirmation) {
        setNotice('Check your email to confirm your account, then come back and log in.')
        setMode('login')
      }
    })
  }

  const forgot = () =>
    run(async () => {
      if (!email) throw new Error('Enter your email first')
      await sendPasswordReset(email)
      setNotice('We sent a reset link. Open it, choose a new password, then log in here.')
    })

  return (
    <div className="stack">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'login'} onClick={() => switchTo('login')}>
          Log in
        </button>
        <button role="tab" aria-selected={mode === 'signup'} onClick={() => switchTo('signup')}>
          Create account
        </button>
      </div>
      <form className="stack" onSubmit={submit}>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="big" disabled={busy}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
      {mode === 'login' && (
        <button className="link" disabled={busy} onClick={forgot}>
          Forgot password?
        </button>
      )}
      {notice && <p>{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
