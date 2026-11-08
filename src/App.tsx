import { useCallback, useEffect, useState } from 'react'
import type { Purchase, Quest, Reward } from './core'
import {
  buyReward,
  claimQuest,
  getMe,
  listPurchases,
  listQuests,
  listRewards,
  onAuthChange,
  signInAsKid,
  subscribeFamily,
  type Member,
  type Session,
} from './data'
import { KidHome } from './ui/KidHome'
import { KidJoin } from './ui/KidJoin'
import { PasswordForm } from './ui/PasswordForm'
import { ParentHome } from './ui/ParentHome'
import { ParentSetup } from './ui/ParentSetup'
import { Welcome } from './ui/Welcome'

const TICK_MS = 30_000

/** Picks the screen from who is signed in and whether they belong to a family yet. */
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [me, setMe] = useState<Member | null | undefined>(undefined)
  // Kept apart from the session: later auth events for the same user must not hide the form.
  const [recovering, setRecovering] = useState(false)

  const loadMe = useCallback(() => {
    getMe().then(setMe, () => setMe(null))
  }, [])

  useEffect(
    () =>
      onAuthChange((s) => {
        setSession(s)
        if (s?.recovery) setRecovering(true)
      }),
    [],
  )

  // Keyed on the user id: token refreshes emit a new session object for the same user,
  // and reloading on those would remount the screen and wipe half-typed forms.
  const userId = session?.userId
  useEffect(() => {
    setMe(undefined)
    if (userId) loadMe()
  }, [userId, loadMe])

  if (session === undefined) return null
  if (session === null) return <Welcome onKid={signInAsKid} />
  if (recovering) {
    return (
      <main className="screen">
        <h1>Set a new password</h1>
        <PasswordForm onSaved={() => setRecovering(false)} />
      </main>
    )
  }
  if (me === undefined) return null
  if (me === null) return session.anonymous ? <KidJoin onJoined={loadMe} /> : <ParentSetup onDone={loadMe} />
  return me.role === 'parent' ? <ParentHome /> : <KidRoot me={me} />
}

function KidRoot({ me: initial }: { me: Member }) {
  const [me, setMe] = useState(initial)
  const [now, setNow] = useState(() => Date.now())
  const [quests, setQuests] = useState<Quest[] | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const { id, familyId } = initial

  // Gold and XP live on the member row, so reload everything after any family change.
  const load = useCallback(() => {
    return Promise.all([getMe(), listQuests(id), listRewards(), listPurchases(id)]).then(([m, q, r, p]) => {
      if (m) setMe(m)
      setQuests(q)
      setRewards(r)
      setPurchases(p)
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

  if (!quests) return null
  return (
    <KidHome
      me={me}
      quests={quests}
      rewards={rewards}
      purchases={purchases}
      now={now}
      onClaim={(questId) => claimQuest(questId).then(load)}
      onBuy={(rewardId) => buyReward(rewardId).then(load)}
    />
  )
}
