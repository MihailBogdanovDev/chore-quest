import { useState } from 'react'
import { levelFor } from '../../core'
import type { Member } from '../../data'
import { Gold, Icon, isMuted, setMuted, XpBar } from '../kit'
import { heroSrc } from './util'

export function Hud({ me }: { me: Member }) {
  const lv = levelFor(me.xp)
  const [muted, setM] = useState(isMuted())
  return (
    <header className="kid-hud">
      <div className="kid-hud__face">
        <img src={heroSrc(me.avatar)} alt="" />
      </div>
      <div className="kid-hud__mid">
        <div className="kid-hud__name">
          <span>{me.displayName}</span>
          <button
            type="button"
            className={`kid-mute${muted ? ' is-off' : ''}`}
            aria-label={muted ? 'Sound off' : 'Sound on'}
            onClick={() => {
              setMuted(!muted)
              setM(!muted)
            }}
          >
            ♪
          </button>
        </div>
        <XpBar level={lv.level} title={lv.title} current={lv.xpIntoLevel} needed={lv.xpForLevel} />
      </div>
      <div className="kid-hud__side">
        <span data-purse>
          <Gold amount={me.gold} size={22} />
        </span>
        <span className={`kid-streak${me.streak > 0 ? '' : ' is-dim'}`} title="Day streak">
          <Icon name="torch" size={22} style={{ transform: `scale(${1 + Math.min(me.streak, 10) * 0.04})` }} />
          <b>{me.streak}</b>
        </span>
      </div>
    </header>
  )
}
