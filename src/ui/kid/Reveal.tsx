import { useEffect, useMemo, useRef, useState } from 'react'
import { levelFor, monsterFor, type Quest } from '../../core'
import type { Member } from '../../data'
import { Icon, XpBar, buzz, sfx } from '../kit'
import { heroSrc, monsterSrc, readStore, reducedMotion, writeStore } from './util'

export type Step =
  | { kind: 'quest'; q: Quest; xpFrom: number; xpTo: number }
  | { kind: 'chest'; q: Quest }
  | { kind: 'level'; level: number; title: string; prevTitle: string }

/** Finds approvals the kid has not seen yet and turns them into a queue of reveal steps. */
export function useApprovalReveal(me: Member, quests: Quest[]) {
  const [steps, setSteps] = useState<Step[]>([])
  const seen = useRef<{ t: number; xp: number } | null>(null)
  useEffect(() => {
    const kT = `cq-seen-approval-${me.id}`
    const kX = `cq-seen-xp-${me.id}`
    const approved = quests.filter((q) => q.status === 'done' && q.approvedAt !== null)
    let s = seen.current
    if (!s) {
      const t = readStore(kT)
      const x = readStore(kX)
      s = seen.current = {
        t: t !== null ? Number(t) : Math.max(0, ...approved.map((q) => q.approvedAt!)),
        xp: x !== null ? Number(x) : me.xp,
      }
    }
    const fresh = approved.filter((q) => q.approvedAt! > s.t).sort((a, b) => a.approvedAt! - b.approvedAt!)
    const before = levelFor(s.xp)
    const after = levelFor(me.xp)
    const next: Step[] = []
    fresh.forEach((q, i) => {
      const span = me.xp - s!.xp
      next.push({ kind: 'quest', q, xpFrom: s!.xp + (span * i) / fresh.length, xpTo: s!.xp + (span * (i + 1)) / fresh.length })
      if (q.chestGold) next.push({ kind: 'chest', q })
    })
    if (after.level > before.level) next.push({ kind: 'level', level: after.level, title: after.title, prevTitle: before.title })
    seen.current = { t: Math.max(s.t, ...fresh.map((q) => q.approvedAt!)), xp: me.xp }
    writeStore(kT, String(seen.current.t))
    writeStore(kX, String(seen.current.xp))
    if (next.length) setSteps((p) => [...p, ...next])
  }, [quests, me.xp, me.id])
  return { steps, clear: () => setSteps([]) }
}

function useCountUp(to: number, ms = 700, start = 0) {
  const [v, setV] = useState(start)
  useEffect(() => {
    if (reducedMotion()) { setV(to); return }
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(start + (to - start) * p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, start])
  return v
}

function useReady(ms: number) {
  const [r, setR] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setR(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return r
}

function Rain({ n = 16 }: { n?: number }) {
  const coins = useMemo(() => Array.from({ length: n }, (_, i) => ({ i, x: Math.random() * 100, d: Math.random() * 600 })), [n])
  return (
    <div className="kid-rain" aria-hidden>
      {coins.map((c) => (
        <span key={c.i} style={{ left: `${c.x}%`, animationDelay: `${c.d}ms` }}><Icon name="coin" size={22} /></span>
      ))}
    </div>
  )
}

function QuestStep({ step, onNext }: { step: Extract<Step, { kind: 'quest' }>; onNext: () => void }) {
  const { q } = step
  const m = monsterFor(q.category, q.gold)
  const ready = useReady(1000)
  const gold = useCountUp(q.gold)
  const from = levelFor(step.xpFrom)
  const to = levelFor(step.xpTo)
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    sfx.coin()
    buzz([20, 40, 20])
    const a = setTimeout(() => { setFilled(true); sfx.coin() }, 450)
    const b = setTimeout(() => sfx.coin(), 250)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  const lvl = filled ? to : from
  const levelUp = to.level > from.level
  const current = filled ? (levelUp ? from.xpForLevel : to.xpIntoLevel) : from.xpIntoLevel
  const needed = from.xpForLevel
  return (
    <div className="kid-reveal__card" onClick={() => ready && onNext()}>
      <Rain />
      <h2 className="kid-reveal__title">QUEST COMPLETE!</h2>
      <img className="kid-reveal__monster" src={monsterSrc(m.kind)} alt="" style={{ height: 70 * m.scale + 20 }} />
      <p className="kid-reveal__what">{q.title}</p>
      <div className="kid-reveal__gold"><Icon name="coin" size={32} /> +{gold}</div>
      <div className="kid-reveal__xp">
        <XpBar level={levelUp && filled ? from.level : lvl.level} title={lvl.title} current={current} needed={needed} />
      </div>
      <p className={`kid-reveal__tap${ready ? ' is-ready' : ''}`}>Tap to continue</p>
    </div>
  )
}

function ChestStep({ step, onNext }: { step: Extract<Step, { kind: 'chest' }>; onNext: () => void }) {
  const [open, setOpen] = useState(false)
  const ready = useReady(open ? 900 : 300)
  const bonus = useCountUp(open ? step.q.chestGold ?? 0 : 0, 600)
  useEffect(() => { buzz(30) }, [])
  return (
    <div
      className="kid-reveal__card"
      onClick={() => {
        if (!open) { setOpen(true); sfx.chest(); buzz([30, 30, 80]) } else if (ready) onNext()
      }}
    >
      <h2 className="kid-reveal__title">{open ? 'TREASURE!' : 'A loot chest!'}</h2>
      <div className={`kid-chest${open ? ' is-open' : ''}`}>
        <Icon name={open ? 'chest-open' : 'chest-closed'} size={128} />
        {open && Array.from({ length: 6 }, (_, i) => <Icon key={i} name="sparkle" size={24} className="kid-spark" style={{ ['--a' as string]: `${i * 60}deg` }} />)}
      </div>
      {open ? <div className="kid-reveal__gold"><Icon name="coin" size={32} /> +{bonus} bonus gold!</div> : <p className="kid-reveal__what">Tap to open!</p>}
      <p className={`kid-reveal__tap${open && ready ? ' is-ready' : ''}`}>Tap to continue</p>
    </div>
  )
}

function LevelStep({ step, hero, onNext }: { step: Extract<Step, { kind: 'level' }>; hero: string; onNext: () => void }) {
  const ready = useReady(1200)
  useEffect(() => { sfx.levelUp(); buzz([40, 40, 40, 40, 120]) }, [])
  return (
    <div className="kid-reveal__card" onClick={() => ready && onNext()}>
      <h2 className="kid-reveal__title kid-reveal__title--big">LEVEL UP!</h2>
      <div className="kid-levelhero">
        <img src={heroSrc(hero)} alt="" width={128} height={128} />
        {Array.from({ length: 8 }, (_, i) => <Icon key={i} name="sparkle" size={22} className="kid-spark" style={{ ['--a' as string]: `${i * 45}deg` }} />)}
      </div>
      <div className="kid-reveal__gold">Level {step.level}</div>
      <p className="kid-reveal__what">{step.title !== step.prevTitle ? `You are now a ${step.title}!` : `Keep it up, ${step.title}!`}</p>
      <p className={`kid-reveal__tap${ready ? ' is-ready' : ''}`}>Tap to continue</p>
    </div>
  )
}

export function Reveal({ steps, hero, onDone }: { steps: Step[]; hero: string; onDone: () => void }) {
  const [i, setI] = useState(0)
  const step = steps[i]
  if (!step) return null
  const next = () => (i + 1 >= steps.length ? onDone() : setI(i + 1))
  return (
    <div className="kid-reveal" role="dialog" aria-modal="true">
      {step.kind === 'quest' && <QuestStep key={i} step={step} onNext={next} />}
      {step.kind === 'chest' && <ChestStep key={i} step={step} onNext={next} />}
      {step.kind === 'level' && <LevelStep key={i} step={step} hero={hero} onNext={next} />}
    </div>
  )
}
