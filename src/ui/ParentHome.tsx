import { useCallback, useEffect, useState } from 'react'
import {
  getFamily,
  listDoneQuests,
  listFamilyQuests,
  listKids,
  listPurchases,
  listRewards,
  signOut,
  subscribeFamily,
} from '../data'
import { Panel, PixelButton, TabBar } from './kit'
import { Approvals } from './parent/Approvals'
import { Family } from './parent/Family'
import { Merchant } from './parent/Merchant'
import { Quests } from './parent/Quests'
import type { ParentData } from './parent/shared'
import './screens.css'

const TICK_MS = 30_000
type Tab = 'approvals' | 'quests' | 'merchant' | 'family'

/** "Quest Giver" shell: four tabs. */
export function ParentHome() {
  const [data, setData] = useState<Omit<ParentData, 'reload'> | null>(null)
  const [tab, setTab] = useState<Tab>('approvals')
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState('')

  const load = useCallback(async () => {
    const [f, kids, quests, rewards, purchases, done] = await Promise.all([
      getFamily(),
      listKids(),
      listFamilyQuests(),
      listRewards(),
      listPurchases(),
      listDoneQuests(Date.now() - 30 * 86_400_000),
    ])
    setFamilyName(f.name)
    setData({ familyId: f.id, inviteCode: f.inviteCode, kids, quests, rewards, purchases, done })
    setNow(Date.now())
  }, [])

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : String(e)))
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [load])

  const familyId = data?.familyId
  useEffect(() => {
    if (!familyId) return
    return subscribeFamily(familyId, () => void load().catch(console.error))
  }, [familyId, load])

  if (!data)
    return (
      <main className="screen night">
        {error ? <p role="alert" className="err">{error}</p> : <p>Loading the kingdom…</p>}
      </main>
    )

  const full: ParentData = { ...data, reload: load }
  const badge =
    data.quests.filter((q) => q.status === 'claimed').length + data.purchases.filter((p) => p.status === 'pending').length

  return (
    <main className="screen night parent">
      <header className="phead">
        <Panel variant="wood" className="phead__panel">
          <div>
            <small>Quest Giver</small>
            <h1>{familyName}</h1>
          </div>
          <PixelButton variant="ghost" className="phead__out" onClick={() => signOut()}>
            Sign out
          </PixelButton>
        </Panel>
      </header>
      {tab === 'approvals' && <Approvals data={full} />}
      {tab === 'quests' && <Quests data={full} now={now} />}
      {tab === 'merchant' && <Merchant data={full} />}
      {tab === 'family' && <Family data={full} />}
      <p className="version">version {__APP_VERSION__}</p>
      <TabBar
        active={tab}
        onChange={(t) => setTab(t as Tab)}
        items={[
          { id: 'approvals', label: 'Approvals', icon: 'check', badge },
          { id: 'quests', label: 'Quests', icon: 'scroll' },
          { id: 'merchant', label: 'Merchant', icon: 'shop' },
          { id: 'family', label: 'Family', icon: 'keep' },
        ]}
      />
    </main>
  )
}
