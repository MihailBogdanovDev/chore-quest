import { useState } from 'react'
import { REWARD_ICONS, type Reward } from '../../core'
import { saveReward } from '../../data'
import { Gold, Icon, Panel, PixelButton, Sheet } from '../kit'
import type { ParentData } from './shared'

export function Merchant({ data }: { data: ParentData }) {
  const [edit, setEdit] = useState<Partial<Reward> | null>(null)
  return (
    <div className="plist">
      <PixelButton variant="gold" block onClick={() => setEdit({ icon: REWARD_ICONS[0], active: true })}>
        + Add reward
      </PixelButton>
      {data.rewards.length === 0 && <Panel>The shelves are empty. Add something your heroes can buy.</Panel>}
      {data.rewards.map((r) => (
        <button key={r.id} className={`rowbtn${r.active ? '' : ' off'}`} onClick={() => setEdit(r)}>
          <Panel className="prow">
            <div className="prow__main">
              <Icon name={r.icon} size={36} />
              <div className="prow__text">
                <b>{r.name}</b>
                <span>{r.active ? 'On the shelf' : 'Hidden'}</span>
              </div>
              <Gold amount={r.price} />
            </div>
          </Panel>
        </button>
      ))}
      {edit && <RewardSheet key={edit.id ?? 'new'} initial={edit} data={data} onClose={() => setEdit(null)} />}
    </div>
  )
}

function RewardSheet({ initial, data, onClose }: { initial: Partial<Reward>; data: ParentData; onClose: () => void }) {
  const [name, setName] = useState(initial.name ?? '')
  const [price, setPrice] = useState(initial.price ?? 20)
  const [icon, setIcon] = useState(initial.icon ?? REWARD_ICONS[0])
  const [active, setActive] = useState(initial.active ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!name.trim()) return setError('Give the reward a name')
    if (!(price > 0)) return setError('Set a price')
    setBusy(true)
    setError(null)
    try {
      await saveReward({ id: initial.id, name: name.trim(), icon, price, active })
      await data.reload()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet open onClose={onClose} title={initial.id ? 'Edit reward' : 'New reward'}>
      <div className="form">
        <label>
          Name
          <input className="px-input" value={name} maxLength={40} placeholder="Stay up 30 min" onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Price (gold)
          <input className="px-input" type="number" inputMode="numeric" min={1} value={price || ''} onChange={(e) => setPrice(Math.max(0, Math.floor(+e.target.value)))} />
        </label>
        <div>
          <span className="lbl">Icon</span>
          <div className="grid5">
            {REWARD_ICONS.map((i) => (
              <button key={i} className={`tile tile--sm${icon === i ? ' on' : ''}`} onClick={() => setIcon(i)} aria-label={i}>
                <Icon name={i} size={36} />
              </button>
            ))}
          </div>
        </div>
        <label className="check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> On the shelf (kids can buy it)
        </label>
        {error && <p role="alert" className="err">{error}</p>}
        <div className="row2">
          <PixelButton variant="ghost" onClick={onClose}>Cancel</PixelButton>
          <PixelButton variant="gold" disabled={busy} onClick={save}>Save</PixelButton>
        </div>
      </div>
    </Sheet>
  )
}
