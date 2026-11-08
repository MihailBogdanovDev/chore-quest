import { useState, type FormEvent } from 'react'
import { findKids, joinFamily, signOut, type KidOption } from '../data'
import { PixelButton, Panel } from './kit'
import { heroSrc } from './kid/util'
import './kid/kid.css'
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
    <main className="kid-join">
      <img className="kid-join__logo" src="/art/logo.png" alt="Chore Quest" />
      <Panel>
        <form onSubmit={find}>
          <label className="kid-join__label" htmlFor="family-code">Family code</label>
          <input
            id="family-code"
            className="px-input kid-join__code"
            required
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABC123"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setKids(null)
            }}
          />
          <PixelButton variant="gold" block type="submit" disabled={busy}>Find my family</PixelButton>
        </form>
      </Panel>

      {kids?.length === 0 && <p className="kid-hint">No kids found for that code</p>}
      {kids && kids.length > 0 && (
        <Panel>
          <h2 className="kid-join__who">Who are you?</h2>
          <div className="kid-join__kids">
            {kids.map((k) => (
              <button key={k.id} type="button" className="kid-join__kid" disabled={busy} onClick={() => pick(k)}>
                <img src={heroSrc(k.avatar)} alt="" width={72} height={72} />
                <span>{k.displayName}</span>
              </button>
            ))}
          </div>
        </Panel>
      )}
      {error && <p role="alert" className="kid-join__err">{error}</p>}

      <PixelButton variant="ghost" onClick={() => signOut()}>Back</PixelButton>
    </main>
  )
}
