import { useCallback, useMemo, useRef, useState } from 'react'
import { buildBaseView, isOverdue, type Purchase, type Quest, type Reward } from '../core'
import type { Member } from '../data'
import type { GameHandle, KeepView } from '../game/createGame'
import { buzz, FloatText, Panel, PixelButton, sfx, TabBar } from './kit'
import { Bag } from './kid/Bag'
import { BountyBoard } from './kid/BountyBoard'
import { BountySheet, type SlayPhase } from './kid/BountySheet'
import { Hud } from './kid/Hud'
import { Keep } from './kid/Keep'
import { Merchant } from './kid/Merchant'
import { Reveal, useApprovalReveal } from './kid/Reveal'
import { wait } from './kid/util'
import './kid/kid.css'

type Tab = 'keep' | 'bounties' | 'merchant' | 'bag'

interface Props {
  me: Member
  quests: Quest[]
  rewards: Reward[]
  purchases: Purchase[]
  now: number
  onClaim: (questId: string) => Promise<void>
  onBuy: (rewardId: string) => Promise<void>
}

export function KidHome({ me, quests, rewards, purchases, now, onClaim, onBuy }: Props) {
  const [tab, setTab] = useState<Tab>('keep')
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [phase, setPhase] = useState<SlayPhase>(null)
  const [slaying, setSlaying] = useState(false)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [float, setFloat] = useState<number | null>(null)
  const game = useRef<GameHandle | null>(null)
  const { steps, clear } = useApprovalReveal(me, quests)

  const live = useMemo(() => quests.filter((q) => q.status !== 'done' && q.createdAt <= now), [quests, now])
  const open = live.filter((q) => q.status === 'open').sort((a, b) => a.dueAt - b.dueAt)
  const claimed = live.filter((q) => q.status === 'claimed')
  const view: KeepView = useMemo(() => {
    const base = buildBaseView(quests, me.xp, now)
    const overdue = new Set(live.filter((q) => isOverdue(q, now)).map((q) => q.id))
    return { ...base, hero: me.avatar, monsters: base.monsters.map((m) => ({ ...m, overdue: overdue.has(m.questId) })) }
  }, [quests, me.xp, me.avatar, now, live])

  const say = useCallback((text: string) => {
    const id = Date.now()
    setToast({ id, text })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3200)
  }, [])

  const selected = quests.find((q) => q.id === sheetId)

  const slay = async (q: Quest) => {
    if (slaying) return
    setSlaying(true)
    sfx.slash()
    buzz([20, 30, 60])
    if (tab === 'keep' && game.current) {
      setSheetId(null)
      await game.current.slay(q.id)
    } else {
      setPhase('hit')
      await wait(350)
      setPhase('poof')
      await wait(650)
    }
    setSheetId(null)
    setPhase(null)
    setFloat(Date.now())
    say(`Monster stunned! +${q.gold} gold when approved`)
    try {
      await onClaim(q.id)
    } catch {
      sfx.error()
      say('Hmm, that did not work. Try again!')
    }
    setSlaying(false)
  }

  return (
    <main className="kid-app">
      <Hud me={me} />
      <div className="kid-page">
        {tab === 'keep' && (
          <>
            <Keep view={view} onTap={setSheetId} handle={game} />
            <Panel variant="wood" className="kid-keepinfo">
              {open.length > 0 ? (
                <p><b>{open.length}</b> monster{open.length > 1 ? 's' : ''} lurking! Tap one to fight.</p>
              ) : claimed.length > 0 ? (
                <p>All stunned! Waiting for the Quest Giver.</p>
              ) : (
                <p>No monsters! The kingdom is safe.</p>
              )}
              <PixelButton variant="gold" onClick={() => setTab('bounties')}>Bounty Board</PixelButton>
            </Panel>
          </>
        )}
        {tab === 'bounties' && <BountyBoard open={open} claimed={claimed} now={now} hero={me.avatar} onOpen={setSheetId} />}
        {tab === 'merchant' && <Merchant rewards={rewards} gold={me.gold} onBuy={onBuy} toast={say} />}
        {tab === 'bag' && <Bag me={me} purchases={purchases} />}
      </div>

      <BountySheet
        quest={selected}
        now={now}
        phase={phase}
        busy={slaying}
        onClose={() => setSheetId(null)}
        onSlay={() => selected && slay(selected)}
      />
      {float !== null && <FloatText key={float} text="STUNNED!" y={Math.round(window.innerHeight * 0.35)} color="#fff" onDone={() => setFloat(null)} />}
      {toast && <div className="kid-toast" role="status" key={toast.id}>{toast.text}</div>}
      <TabBar
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        items={[
          { id: 'keep', label: 'Keep', icon: 'keep' },
          { id: 'bounties', label: 'Bounties', icon: 'scroll', badge: open.length },
          { id: 'merchant', label: 'Merchant', icon: 'shop' },
          { id: 'bag', label: 'Bag', icon: 'bag' },
        ]}
      />
      {steps.length > 0 && <Reveal steps={steps} hero={me.avatar} onDone={clear} />}
    </main>
  )
}
