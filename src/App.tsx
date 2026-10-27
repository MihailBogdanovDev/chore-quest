import { useEffect, useState } from 'react'
import { KidHome } from './ui/KidHome'
import { mockQuests } from './ui/mockQuests'

const TICK_MS = 30_000

/** Runs the kid screen on local mock data until Supabase lands. */
export default function App() {
  const [now, setNow] = useState(() => Date.now())
  const [quests, setQuests] = useState(() => mockQuests(now))

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const claim = (questId: string) => {
    const at = Date.now()
    setNow(at)
    setQuests((qs) => qs.map((q) => (q.id === questId ? { ...q, status: 'claimed', claimedAt: at } : q)))
  }

  return <KidHome quests={quests} lifetimePoints={120} walletPoints={20} now={now} onClaim={claim} />
}
