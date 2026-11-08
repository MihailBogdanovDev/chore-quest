import type { Quest } from '../../core'
import { isOverdue, monsterFor } from '../../core'
import { Gold, PixelButton, Sheet } from '../kit'
import { monsterSrc, REPEAT_LABEL, timeLeft } from './util'

export type SlayPhase = null | 'hit' | 'poof'

export function BountySheet({ quest, now, phase, busy, onClose, onSlay }: {
  quest?: Quest; now: number; phase: SlayPhase; busy: boolean; onClose: () => void; onSlay: () => void
}) {
  if (!quest) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const m = monsterFor(quest.category, quest.gold)
  const t = timeLeft(quest.dueAt, now)
  const late = isOverdue(quest, now)
  return (
    <Sheet open onClose={busy ? () => {} : onClose} title={quest.title} className="kid-sheet">
      <div className="kid-stage">
        <div className={`kid-stage__monster${phase ? ` is-${phase}` : ''}${late ? ' is-late' : ''}${quest.status === 'claimed' ? ' is-stunned' : ''}`}>
          <img src={monsterSrc(m.kind)} alt={m.name} style={{ height: 70 * m.scale + 30 }} />
          {phase === 'poof' && Array.from({ length: 10 }, (_, i) => (
            <i key={i} className="kid-puff" style={{ ['--a' as string]: `${i * 36}deg`, ['--d' as string]: `${40 + (i % 3) * 14}px` }} />
          ))}
        </div>
        <div className="kid-stage__name">{m.name}{late ? ' (angry!)' : ''}</div>
      </div>
      <div className="kid-facts">
        <Gold amount={quest.gold} size={28} className="kid-gold-big" />
        <span className={`kid-note__time${late ? ' is-late' : ''}`}>{quest.status === 'open' ? t.text : 'Stunned!'}</span>
        {quest.repeat !== 'none' && <span className="kid-tag">{REPEAT_LABEL[quest.repeat]}</span>}
      </div>
      {quest.status === 'open' ? (
        <PixelButton variant="gold" block className="kid-slay" disabled={busy} silent onClick={onSlay}>
          SLAY!
        </PixelButton>
      ) : (
        <p className="kid-wait">Monster stunned! The Quest Giver will check your work, then the gold is yours.</p>
      )}
    </Sheet>
  )
}
