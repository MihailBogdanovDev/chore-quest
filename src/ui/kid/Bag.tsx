import { levelFor, tierFor } from '../../core'
import type { Purchase } from '../../core'
import { signOut, type Member } from '../../data'
import { BASE_SPRITE } from '../../game/sprites'
import { Icon, Panel, PixelButton } from '../kit'
import { heroSrc, nextTier } from './util'

export function Bag({ me, purchases }: { me: Member; purchases: Purchase[] }) {
  const lv = levelFor(me.xp)
  const tier = tierFor(me.xp)
  const next = nextTier(me.xp)
  const pending = purchases.filter((p) => p.status === 'pending')
  const delivered = purchases.filter((p) => p.status === 'delivered')
  const leave = () => {
    if (window.confirm('Leave this device? You can join again with the family code.')) signOut().catch(console.error)
  }
  const item = (p: Purchase) => (
    <li key={p.id} className="kid-loot">
      <Icon name={p.icon} size={40} />
      <span>{p.name}</span>
      <b className={p.status === 'pending' ? 'is-wait' : 'is-ok'}>{p.status === 'pending' ? 'On its way' : 'Enjoyed ✓'}</b>
    </li>
  )
  return (
    <section>
      <h2 className="kid-h">Trophies</h2>
      <div className="kid-trophies">
        <Panel className="kid-trophy"><img src={heroSrc(me.avatar)} alt="" width={56} height={56} /><b>Level {lv.level}</b><span>{lv.title}</span></Panel>
        <Panel className="kid-trophy"><Icon name="torch" size={48} /><b>{me.bestStreak} days</b><span>Best streak</span></Panel>
        <Panel className="kid-trophy"><Icon name="check" size={48} /><b>{me.approvalsCount}</b><span>Monsters slain</span></Panel>
        <Panel className="kid-trophy">
          <img src={BASE_SPRITE[tier]} alt="" height={56} style={{ objectFit: 'contain' }} />
          <b>{tier[0].toUpperCase() + tier.slice(1)}</b>
          <span>{next ? `${next.tier} at ${next.xp} XP` : 'Top keep!'}</span>
        </Panel>
      </div>
      <h2 className="kid-h">Loot</h2>
      {purchases.length === 0 && <p className="kid-hint">Your bag is empty. Visit the Merchant!</p>}
      {pending.length > 0 && <><h3 className="kid-sub">Waiting to be delivered</h3><Panel><ul className="kid-lootlist">{pending.map(item)}</ul></Panel></>}
      {delivered.length > 0 && <><h3 className="kid-sub">Enjoyed</h3><Panel><ul className="kid-lootlist">{delivered.map(item)}</ul></Panel></>}
      <PixelButton variant="ghost" block style={{ marginTop: 24 }} onClick={leave}>
        Leave this device
      </PixelButton>
      <p className="kid-hint">Your hero stays safe. Join again any time with the family code.</p>
    </section>
  )
}
