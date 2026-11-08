import { useState } from 'react'
import { levelFor } from '../../core'
import { addKid } from '../../data'
import { Gold, Icon, Panel, PixelButton, Sheet } from '../kit'
import { PasswordForm } from '../PasswordForm'
import { HEROES, Hero, type ParentData } from './shared'

export function Family({ data }: { data: ParentData }) {
  const [add, setAdd] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pw, setPw] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable: the code is shown anyway */
    }
  }

  const weekAgo = Date.now() - 7 * 86_400_000
  const stats = data.kids.map((k) => {
    const done = data.done.filter((q) => q.kidId === k.id)
    const week = done.filter((q) => (q.approvedAt ?? 0) >= weekAgo).length
    const times = done.filter((q) => q.claimedAt).map((q) => q.claimedAt! - q.createdAt)
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 3_600_000 : null
    return { k, week, avg }
  })

  return (
    <div className="plist">
      <Panel className="invite">
        <span className="lbl">Invite code</span>
        <div className="invite__code">{data.inviteCode}</div>
        <PixelButton variant="gold" onClick={copy}>{copied ? 'Copied!' : 'Copy code'}</PixelButton>
        <p className="muted">Kid opens the app, taps "I'm a Hero", and enters this code.</p>
      </Panel>

      <h3 className="sec">Heroes</h3>
      {data.kids.map((k) => {
        const lv = levelFor(k.xp)
        return (
          <Panel key={k.id} className="prow">
            <div className="prow__main">
              <Hero avatar={k.avatar} size={48} />
              <div className="prow__text">
                <b>{k.displayName}</b>
                <span>Lv {lv.level} {lv.title}{k.joined ? '' : ' · not joined yet'}</span>
              </div>
              <div className="kidstat">
                <Gold amount={k.gold} />
                <span className="streak"><Icon name="torch" size={20} /> {k.streak}</span>
              </div>
            </div>
          </Panel>
        )
      })}
      <PixelButton variant="green" block onClick={() => setAdd(true)}>+ Add kid</PixelButton>

      <h3 className="sec">This week</h3>
      <Panel>
        {stats.length === 0 && <p className="muted">No heroes yet.</p>}
        <table className="stats">
          <thead>
            <tr><th></th><th>Done 7d</th><th>Avg hrs</th><th>Streak</th></tr>
          </thead>
          <tbody>
            {stats.map(({ k, week, avg }) => (
              <tr key={k.id}>
                <td><Hero avatar={k.avatar} size={24} /> {k.displayName}</td>
                <td>{week}</td>
                <td>{avg === null ? '-' : avg < 10 ? avg.toFixed(1) : Math.round(avg)}</td>
                <td>{k.streak}/{k.bestStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Avg hrs = time from posting a quest to the kid finishing it. Streak = current / best.</p>
      </Panel>

      <PixelButton variant="ghost" block onClick={() => setPw(!pw)}>{pw ? 'Hide password' : 'Change password'}</PixelButton>
      {pw && <Panel><PasswordForm onSaved={() => setPw(false)} /></Panel>}

      {add && <AddKid data={data} onClose={() => setAdd(false)} />}
    </div>
  )
}

function AddKid({ data, onClose }: { data: ParentData; onClose: () => void }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(HEROES[data.kids.length % 4])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!name.trim()) return setError('Enter a name')
    setBusy(true)
    setError(null)
    try {
      await addKid(name.trim(), avatar)
      await data.reload()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet open onClose={onClose} title="Add a hero">
      <div className="form">
        <label>
          Name
          <input className="px-input" value={name} maxLength={30} autoFocus onChange={(e) => setName(e.target.value)} />
        </label>
        <div>
          <span className="lbl">Pick a hero</span>
          <div className="grid4">
            {HEROES.map((h) => (
              <button key={h} className={`tile tile--sm${avatar === h ? ' on' : ''}`} onClick={() => setAvatar(h)} aria-label={h}>
                <Hero avatar={h} size={56} />
              </button>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="err">{error}</p>}
        <div className="row2">
          <PixelButton variant="ghost" onClick={onClose}>Cancel</PixelButton>
          <PixelButton variant="gold" disabled={busy} onClick={save}>Add</PixelButton>
        </div>
      </div>
    </Sheet>
  )
}
