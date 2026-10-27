import { useState, type FormEvent } from 'react'
import { updatePassword } from '../data'
import { checkPassword } from './passwords'
import { useAction } from './useAction'

/** Sets a new password for the signed-in parent (after a reset link, or from parent home). */
export function PasswordForm({ onSaved }: { onSaved: () => void }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const { run, busy, error } = useAction()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      checkPassword(password)
      if (password !== repeat) throw new Error("Passwords don't match")
      await updatePassword(password)
      setPassword('')
      setRepeat('')
      onSaved()
    })
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label>
        New password
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        Repeat password
        <input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </label>
      <button className="big" disabled={busy}>
        Save password
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
