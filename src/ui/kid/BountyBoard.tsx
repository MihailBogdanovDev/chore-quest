import type { Quest } from '../../core'
import { monsterFor } from '../../core'
import { Gold, Icon, Panel } from '../kit'
import { heroSrc, monsterSrc, REPEAT_LABEL, tilt, timeLeft } from './util'

function Note({ q, now, onOpen }: { q: Quest; now: number; onOpen: () => void }) {
  const m = monsterFor(q.category, q.gold)
  const t = timeLeft(q.dueAt, now)
  const claimed = q.status === 'claimed'
  return (
    <Panel
      variant="paper"
      className={`kid-note${claimed ? ' is-claimed' : ''}`}
      style={{ transform: `rotate(${tilt(q.id)}deg)` }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <img className="kid-note__monster" src={monsterSrc(m.kind)} alt={m.name} style={{ height: 40 * Math.max(m.scale, 0.8) }} />
      <div className="kid-note__title">{q.title}</div>
      <div className="kid-note__row">
        <Gold amount={q.gold} size={18} className="kid-gold-ink" />
        {q.repeat !== 'none' && <span className="kid-tag">{REPEAT_LABEL[q.repeat]}</span>}
      </div>
      <div className={`kid-note__time${t.late && !claimed ? ' is-late' : ''}`}>{claimed ? 'Stunned!' : t.text}</div>
    </Panel>
  )
}

export function BountyBoard({ open, claimed, now, hero, onOpen }: { open: Quest[]; claimed: Quest[]; now: number; hero: string; onOpen: (id: string) => void }) {
  return (
    <section className="kid-board">
      <h2 className="kid-h">Bounty Board</h2>
      {open.length === 0 && claimed.length === 0 && (
        <div className="kid-empty">
          <img src={heroSrc(hero)} alt="" width={96} height={96} className="kid-bob" />
          <p>No monsters!<br />The kingdom is safe.</p>
        </div>
      )}
      {open.length > 0 && (
        <>
          <h3 className="kid-sub"><Icon name="scroll" size={22} /> Ready to slay</h3>
          <div className="kid-notes">{open.map((q) => <Note key={q.id} q={q} now={now} onOpen={() => onOpen(q.id)} />)}</div>
        </>
      )}
      {claimed.length > 0 && (
        <>
          <h3 className="kid-sub">Waiting for the Quest Giver</h3>
          <div className="kid-notes">{claimed.map((q) => <Note key={q.id} q={q} now={now} onOpen={() => onOpen(q.id)} />)}</div>
        </>
      )}
    </section>
  )
}
