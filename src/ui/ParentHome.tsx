import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { addKid, getFamily, listKids, signOut, type Family, type Member } from '../data'
import { AVATARS } from './avatars'
import './screens.css'
import { useAction } from './useAction'

export function ParentHome() {
  const [family, setFamily] = useState<Family | null>(null)
  const [kids, setKids] = useState<Member[]>([])
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('knight')
  const { run, busy, error } = useAction()

  const load = useCallback(async () => {
    const [f, k] = await Promise.all([getFamily(), listKids()])
    setFamily(f)
    setKids(k)
  }, [])

  useEffect(() => {
    run(load)
  }, [load])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await addKid(name, avatar)
      setName('')
      setKids(await listKids())
    })
  }

  if (!family) return <main className="screen">{error ? <p role="alert">{error}</p> : <p>Loading…</p>}</main>

  return (
    <main className="screen">
      <h1>{family.name}</h1>
      <section className="card">
        <p>Kids join with this code:</p>
        <p className="invite-code">{family.inviteCode}</p>
      </section>

      <section className="card">
        <h2>Kids</h2>
        <ul className="kid-list">
          {kids.map((k) => (
            <li key={k.id}>
              {AVATARS[k.avatar] ?? '🙂'} {k.displayName} <span className="tag">{k.joined ? 'joined' : 'waiting'}</span>
            </li>
          ))}
        </ul>
        <form className="stack" onSubmit={submit}>
          <label>
            Kid name
            <input required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Avatar
            <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
              {Object.entries(AVATARS).map(([key, icon]) => (
                <option key={key} value={key}>
                  {icon} {key}
                </option>
              ))}
            </select>
          </label>
          <button className="big" disabled={busy}>
            Add kid
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
      </section>

      <button className="link" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  )
}
