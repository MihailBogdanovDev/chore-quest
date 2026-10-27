import { useState, type FormEvent } from 'react'
import { createFamily, signOut } from '../data'
import './screens.css'
import { useAction } from './useAction'

export function ParentSetup({ onDone }: { onDone: () => void }) {
  const [familyName, setFamilyName] = useState('')
  const [parentName, setParentName] = useState('')
  const { run, busy, error } = useAction()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await createFamily(familyName, parentName)
      onDone()
    })
  }

  return (
    <main className="screen">
      <h1>Start your family</h1>
      <form className="stack" onSubmit={submit}>
        <label>
          Family name
          <input required maxLength={60} value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
        </label>
        <label>
          Your name
          <input required maxLength={30} value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </label>
        <button className="big" disabled={busy}>
          Create family
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      <button className="link" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  )
}
