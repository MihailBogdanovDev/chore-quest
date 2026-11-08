import { useState } from 'react'
import { Gold, Icon, PixelButton, Panel, sfx, buzz } from '../kit'
import { deliverPurchase, reviewClaim } from '../../data'
import { Hero, questIcon, type ParentData } from './shared'

export function Approvals({ data }: { data: ParentData }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const kid = (id: string) => data.kids.find((k) => k.id === id)
  const claimed = data.quests.filter((q) => q.status === 'claimed')
  const pending = data.purchases.filter((p) => p.status === 'pending')

  const act = async (id: string, fn: () => Promise<void>, ok?: () => void) => {
    setBusy(id)
    setError(null)
    try {
      await fn()
      ok?.()
      await data.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  if (!claimed.length && !pending.length)
    return (
      <Panel className="empty">
        <Icon name="keep" size={64} />
        <h2>All quiet in the kingdom</h2>
        <p>Nothing waiting for you. Heroes will report here when they slay a monster.</p>
      </Panel>
    )

  return (
    <div className="plist">
      {error && <p role="alert" className="err">{error}</p>}
      {claimed.length > 0 && <h3 className="sec">Quests to check</h3>}
      {claimed.map((q) => (
        <Panel key={q.id} className="prow">
          <div className="prow__main">
            <Hero avatar={kid(q.kidId)?.avatar ?? ''} />
            <Icon name={questIcon(q.title, q.category)} size={32} />
            <div className="prow__text">
              <b>{q.title}</b>
              <span>{kid(q.kidId)?.displayName ?? 'Hero'}</span>
            </div>
            <Gold amount={q.gold} />
          </div>
          <div className="prow__actions">
            <PixelButton variant="green" disabled={busy === q.id} silent onClick={() => act(q.id, () => reviewClaim(q.id, true), () => { sfx.coin(); buzz() })}>
              ✓ Approve
            </PixelButton>
            <PixelButton variant="red" disabled={busy === q.id} onClick={() => act(q.id, () => reviewClaim(q.id, false))}>
              ✗ Not yet
            </PixelButton>
          </div>
        </Panel>
      ))}
      {pending.length > 0 && <h3 className="sec">Rewards to hand over</h3>}
      {pending.map((p) => (
        <Panel key={p.id} className="prow">
          <div className="prow__main">
            <Hero avatar={kid(p.kidId)?.avatar ?? ''} />
            <Icon name={p.icon} size={32} />
            <div className="prow__text">
              <b>{p.name}</b>
              <span>{kid(p.kidId)?.displayName ?? 'Hero'} bought this</span>
            </div>
            <Gold amount={p.price} />
          </div>
          <div className="prow__actions">
            <PixelButton variant="gold" disabled={busy === p.id} onClick={() => act(p.id, () => deliverPurchase(p.id))}>
              Delivered
            </PixelButton>
          </div>
        </Panel>
      ))}
    </div>
  )
}
