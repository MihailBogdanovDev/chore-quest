import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  addKid,
  getFamily,
  listFamilyQuests,
  listKids,
  postQuest,
  reviewClaim,
  signOut,
  subscribeFamily,
  type Family,
  type FamilyQuest,
  type Member,
} from '../data'
import { AVATARS } from './avatars'
import { ClaimList } from './ClaimList'
import { QuestBoard } from './QuestBoard'
import { QuestForm } from './QuestForm'
import './screens.css'
import { useAction } from './useAction'

const TICK_MS = 30_000

export function ParentHome() {
  const [family, setFamily] = useState<Family | null>(null)
  const [kids, setKids] = useState<Member[]>([])
  const [quests, setQuests] = useState<FamilyQuest[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('knight')
  const { run, busy, error } = useAction()

  const load = useCallback(async () => {
    const [f, k, q] = await Promise.all([getFamily(), listKids(), listFamilyQuests()])
    setFamily(f)
    setKids(k)
    setQuests(q)
    setNow(Date.now())
  }, [])

  useEffect(() => {
    run(load)
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [load])

  const familyId = family?.id
  useEffect(() => {
    if (!familyId) return
    return subscribeFamily(familyId, () => void load().catch(console.error))
  }, [familyId, load])

  const submitKid = (e: FormEvent) => {
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
        <h2>Waiting for you</h2>
        <ClaimList quests={quests} kids={kids} onReview={async (id, approve) => {
          await reviewClaim(id, approve)
          await load()
        }} />
      </section>

      <section className="card">
        <h2>Post a quest</h2>
        <QuestForm kids={kids} now={now} onPost={async (quest) => {
          await postQuest(quest)
          await load()
        }} />
      </section>

      <section className="card">
        <h2>Monsters out there</h2>
        <QuestBoard quests={quests} kids={kids} now={now} />
      </section>

      <section className="card">
        <h2>Kids</h2>
        <p>
          Kids join with code <span className="invite-code inline">{family.inviteCode}</span>
        </p>
        <ul className="kid-list" aria-label="Kids">
          {kids.map((k) => (
            <li key={k.id}>
              {AVATARS[k.avatar] ?? '🙂'} {k.displayName} · {k.walletPoints}P{' '}
              <span className="tag">{k.joined ? 'joined' : 'waiting'}</span>
            </li>
          ))}
        </ul>
        <form className="stack" onSubmit={submitKid}>
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
