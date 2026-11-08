import { useState } from 'react'
import type { Reward } from '../../core'
import { Gold, Icon, Panel, PixelButton, Sheet, sfx, buzz } from '../kit'
import { CoinFly } from './CoinFly'

export function Merchant({ rewards, gold, onBuy, toast }: {
  rewards: Reward[]; gold: number; onBuy: (id: string) => Promise<void>; toast: (t: string) => void
}) {
  const [confirm, setConfirm] = useState<Reward | null>(null)
  const [busy, setBusy] = useState(false)
  const [fly, setFly] = useState(false)
  const shelf = rewards.filter((r) => r.active).sort((a, b) => a.price - b.price)

  const buy = async (r: Reward) => {
    setBusy(true)
    try {
      await onBuy(r.id)
      setConfirm(null)
      setFly(true)
      sfx.coin()
      buzz([20, 30, 20])
      toast('Bought! Show it to your Quest Giver')
    } catch {
      sfx.error()
      toast('Oh no, that did not work. Try again!')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <Panel variant="wood" className="kid-stall">
        <Icon name="shop" size={56} className="kid-bob" />
        <div>
          <h2 className="kid-h">The Merchant</h2>
          <p>Spend your gold on treats!</p>
        </div>
      </Panel>
      {shelf.length === 0 && <p className="kid-hint">The shelves are empty. Ask your Quest Giver to stock them!</p>}
      <div className="kid-shelf">
        {shelf.map((r) => {
          const can = gold >= r.price
          return (
            <Panel key={r.id} className={`kid-ware${can ? '' : ' is-locked'}`}>
              <Icon name={r.icon} size={48} />
              <div className="kid-ware__name">{r.name}</div>
              <Gold amount={r.price} size={18} className="kid-gold-ink" />
              {can ? (
                <PixelButton variant="gold" block onClick={() => setConfirm(r)}>Buy</PixelButton>
              ) : (
                <>
                  <div className="kid-ware__need">Need {r.price - gold} more gold</div>
                  <div className="px-bar px-bar--green kid-ware__bar"><div className="px-bar__fill" style={{ width: `${Math.round((gold / r.price) * 100)}%` }} /></div>
                </>
              )}
            </Panel>
          )
        })}
      </div>
      <Sheet open={!!confirm} onClose={() => !busy && setConfirm(null)} title="Buy this?">
        {confirm && (
          <div className="kid-confirm">
            <Icon name={confirm.icon} size={72} />
            <h3>{confirm.name}</h3>
            <Gold amount={confirm.price} size={26} className="kid-gold-big" />
            <PixelButton variant="green" block disabled={busy} onClick={() => buy(confirm)}>Yes, buy it!</PixelButton>
            <PixelButton variant="ghost" block disabled={busy} onClick={() => setConfirm(null)} className="kid-ghost-ink">Not now</PixelButton>
          </div>
        )}
      </Sheet>
      {fly && <CoinFly onDone={() => setFly(false)} />}
    </section>
  )
}
