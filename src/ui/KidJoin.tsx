import { useState, type FormEvent } from 'react'
import { findKids, joinFamily, signOut, type KidOption } from '../data'
import { AVATARS } from './avatars'
import './screens.css'
import { useAction } from './useAction'

export function KidJoin({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState('')
  const [kids, setKids] = useState<KidOption[] | null>(null)
  const { run, busy, error } = useAction()

  const find = (e: FormEvent) => {
    e.preventDefault()
    run(async () => setKids(await findKids(code)))
  }

  const pick = (kid: KidOption) =>
    run(async () => {
      await joinFamily(code, kid.id)
      onJoined()
    })

  return (
    <main className="screen">
      <h1>Join your family</h1>
      <form className="stack" onSubmit={find}>
        <label>
          Family code
          <input
            required
            maxLength={6}
            autoCapitalize="characters"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setKids(null)
            }}
          />
        </label>
        <button className="big alt" disabled={busy}>
          Find my family
        </button>
      </form>

      {kids?.length === 0 && <p>No kids found for that code</p>}
      {kids && kids.length > 0 && (
        <section className="card">
          <h2>Who are you?</h2>
          <div className="stack">
            {kids.map((k) => (
              <button key={k.id} className="big" disabled={busy} onClick={() => pick(k)}>
                {AVATARS[k.avatar] ?? '🙂'} {k.displayName}
              </button>
            ))}
          </div>
        </section>
      )}
      {error && <p role="alert">{error}</p>}

      <button className="link" onClick={() => signOut()}>
        Back
      </button>
    </main>
  )
}
