import { useState } from 'react'
import { CHORE_TEMPLATES, type ChoreTemplate, type Repeat } from '../../core'
import { createQuest } from '../../data'
import { Gold, Icon, Panel, PixelButton, Sheet, sfx } from '../kit'
import { Hero, fmtDue, questIcon, type ParentData } from './shared'

const GOLD_PRESETS = [5, 10, 25, 50]
const REPEATS: [Repeat, string][] = [['none', 'Once'], ['daily', 'Daily'], ['weekly', 'Weekly']]

function at20(daysAhead: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(20, 0, 0, 0)
  return d.getTime()
}
const defaultDue = () => (at20(0) > Date.now() ? 0 : 1)

export function Quests({ data, now }: { data: ParentData; now: number }) {
  const [open, setOpen] = useState(false)
  const live = data.quests.filter((q) => q.status !== 'done')

  return (
    <div className="plist">
      <PixelButton variant="gold" block onClick={() => setOpen(true)}>
        + New quest
      </PixelButton>
      {data.kids.length === 0 && <Panel>Add a kid in the Family tab first.</Panel>}
      {data.kids.map((k) => {
        const qs = live.filter((q) => q.kidId === k.id)
        return (
          <section key={k.id}>
            <h3 className="sec kidhead"><Hero avatar={k.avatar} size={32} /> {k.displayName}</h3>
            {qs.length === 0 && <p className="muted">No quests posted.</p>}
            {qs.map((q) => (
              <Panel key={q.id} className="prow">
                <div className="prow__main">
                  <Icon name={questIcon(q.title, q.category)} size={32} />
                  <div className="prow__text">
                    <b>{q.title}</b>
                    <span className={q.status === 'open' && q.dueAt < now ? 'late' : ''}>
                      {q.status === 'claimed' ? 'Waiting for approval' : fmtDue(q.dueAt, now)}
                      {q.repeat !== 'none' && <em className="tag"> ↻ {q.repeat}</em>}
                    </span>
                  </div>
                  <Gold amount={q.gold} />
                </div>
              </Panel>
            ))}
          </section>
        )
      })}
      {open && <NewQuest data={data} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewQuest({ data, onClose }: { data: ParentData; onClose: () => void }) {
  const [tpl, setTpl] = useState<ChoreTemplate | null>(null)
  const [title, setTitle] = useState('')
  const [kidId, setKidId] = useState(data.kids.length === 1 ? data.kids[0].id : '')
  const [gold, setGold] = useState(10)
  const [repeat, setRepeat] = useState<Repeat>('none')
  const [due, setDue] = useState(defaultDue())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = (t: ChoreTemplate) => {
    setTpl(t)
    setTitle(t.title)
    setGold(t.gold)
  }

  const post = async () => {
    if (!tpl) return
    if (!title.trim()) return setError('Give the quest a name')
    if (!kidId) return setError('Pick a hero')
    if (!(gold > 0)) return setError('Set the gold reward')
    setBusy(true)
    setError(null)
    try {
      await createQuest({ kidId, title: title.trim(), category: tpl.category, gold, repeat, dueAt: at20(due) })
      sfx.coin()
      await data.reload()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open onClose={onClose} title={tpl ? 'Post a quest' : 'Choose a chore'}>
      {!tpl ? (
        <div className="grid3">
          {CHORE_TEMPLATES.map((t) => (
            <button key={t.id} className="tile" onClick={() => pick(t)}>
              <Icon name={t.icon} size={40} />
              <span>{t.title || 'Custom'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="form">
          <label>
            Quest
            <input className="px-input" value={title} maxLength={60} autoFocus={!tpl.title} placeholder="What needs doing?" onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div>
            <span className="lbl">Hero</span>
            <div className="chips">
              {data.kids.map((k) => (
                <button key={k.id} className={`tile tile--sm${kidId === k.id ? ' on' : ''}`} onClick={() => setKidId(k.id)}>
                  <Hero avatar={k.avatar} size={40} />
                  <span>{k.displayName}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="lbl">Reward</span>
            <div className="chips">
              {GOLD_PRESETS.map((g) => (
                <button key={g} className={`chip${gold === g ? ' on' : ''}`} onClick={() => setGold(g)}>
                  <Gold amount={g} size={16} />
                </button>
              ))}
              <input className="px-input gold-in" type="number" inputMode="numeric" min={1} max={999} value={gold || ''} onChange={(e) => setGold(Math.max(0, Math.floor(+e.target.value)))} aria-label="Custom gold" />
            </div>
          </div>
          <div>
            <span className="lbl">Repeat</span>
            <div className="chips">
              {REPEATS.map(([v, l]) => (
                <button key={v} className={`chip${repeat === v ? ' on' : ''}`} onClick={() => setRepeat(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="lbl">Due</span>
            <div className="chips">
              {[[0, 'Today 20:00'], [1, 'Tomorrow'], [3, 'In 3 days']].map(([d, l]) => (
                <button key={d} disabled={d === 0 && at20(0) <= Date.now()} className={`chip${due === d ? ' on' : ''}`} onClick={() => setDue(d as number)}>{l}</button>
              ))}
            </div>
          </div>
          {error && <p role="alert" className="err">{error}</p>}
          <div className="row2">
            <PixelButton variant="ghost" onClick={() => setTpl(null)}>Back</PixelButton>
            <PixelButton variant="gold" disabled={busy} onClick={post}>Post quest</PixelButton>
          </div>
        </div>
      )}
    </Sheet>
  )
}
