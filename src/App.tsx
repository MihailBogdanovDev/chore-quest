import { useCallback, useEffect, useState } from 'react'
import type { Quest } from './core'
import {
  claimQuest,
  getMe,
  listQuests,
  onAuthChange,
  signInAsKid,
  subscribeFamily,
  type Member,
  type Session,
} from './data'
import { KidHome } from './ui/KidHome'
import { KidJoin } from './ui/KidJoin'
import { ParentHome } from './ui/ParentHome'
import { ParentSetup } from './ui/ParentSetup'
import { Welcome } from './ui/Welcome'

const TICK_MS = 30_000

/** Picks the screen from who is signed in and whether they belong to a family yet. */
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [me, setMe] = useState<Member | null | undefined>(undefined)

  const loadMe = useCallback(() => {
    getMe().then(setMe, () => setMe(null))
  }, [])

  useEffect(() => onAuthChange(setSession), [])

  // Keyed on the user id: token refreshes emit a new session object for the same user,
  // and reloading on those would remount the screen and wipe half-typed forms.
  const userId = session?.userId
  useEffect(() => {
    setMe(undefined)
    if (userId) loadMe()
  }, [userId, loadMe])

  if (session === undefined) return null
  if (session === null) return <Welcome onKid={signInAsKid} />
  if (me === undefined) return null
  if (me === null) return session.anonymous ? <KidJoin onJoined={loadMe} /> : <ParentSetup onDone={loadMe} />
  return me.role === 'parent' ? <ParentHome /> : <KidRoot me={me} />
}

function KidRoot({ me: initial }: { me: Member }) {
  const [me, setMe] = useState(initial)
  const [now, setNow] = useState(() => Date.now())
  const [quests, setQuests] = useState<Quest[]>([])
  const { id, familyId } = initial

  // Points live on the member row, so reload both after any family change.
  const load = useCallback(() => {
    Promise.all([getMe(), listQuests(id)]).then(([m, q]) => {
      if (m) setMe(m)
      setQuests(q)
      setNow(Date.now())
    }, console.error)
  }, [id])

  useEffect(() => {
    load()
    const tick = setInterval(() => setNow(Date.now()), TICK_MS)
    const unsubscribe = subscribeFamily(familyId, load)
    return () => {
      clearInterval(tick)
      unsubscribe()
    }
  }, [familyId, load])

  const claim = (questId: string) => {
    claimQuest(questId).then(load, console.error)
  }

  return (
    <KidHome
      quests={quests}
      lifetimePoints={me.lifetimePoints}
      walletPoints={me.walletPoints}
      now={now}
      onClaim={claim}
    />
  )
}
