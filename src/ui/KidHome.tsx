import { useEffect, useMemo, useRef, useState } from 'react'
import { buildBaseView, HOUR, monsterFor, nextDrop, pointsAt, type Quest } from '../core'
import { createGame, type GameHandle } from '../game/createGame'
import './KidHome.css'

interface Props {
  quests: Quest[]
  lifetimePoints: number
  walletPoints: number
  now: number
  onClaim: (questId: string) => void
}

type Panel = { type: 'list' } | { type: 'quest'; id: string } | null

/** "25P → 22P in 3h": what the quest is worth now and when that drops. */
function worthText(q: Quest, now: number): string {
  if (q.status === 'done' && q.claimedAt !== null) return `Slain! +${pointsAt(q, q.claimedAt)}P`
  if (q.status === 'claimed' && q.claimedAt !== null) return `${pointsAt(q, q.claimedAt)}P locked in`
  const points = pointsAt(q, now)
  const drop = nextDrop(q, now)
  if (!drop) return `${points}P`
  return `${points}P → ${drop.points}P in ${Math.ceil((drop.at - now) / HOUR)}h`
}

export function KidHome({ quests, lifetimePoints, walletPoints, now, onClaim }: Props) {
  const view = useMemo(() => buildBaseView(quests, lifetimePoints, now), [quests, lifetimePoints, now])
  const [panel, setPanel] = useState<Panel>(null)
  const sceneEl = useRef<HTMLDivElement>(null)
  const game = useRef<GameHandle | null>(null)
  const firstView = useRef(view)

  useEffect(() => {
    if (!sceneEl.current) return
    game.current = createGame(sceneEl.current, firstView.current, (id) => setPanel({ type: 'quest', id }))
    return () => {
      game.current?.destroy()
      game.current = null
    }
  }, [])

  useEffect(() => {
    game.current?.setView(view)
  }, [view])

  const live = quests.filter((q) => q.status !== 'done' && q.createdAt <= now)
  const openCount = live.filter((q) => q.status === 'open').length
  const selected = panel?.type === 'quest' ? quests.find((q) => q.id === panel.id) : undefined

  return (
    <main className="kid-home">
      <header className="top-bar">
        <span className="points">{walletPoints}P</span>
        <span className="tier">{view.tier}</span>
        <button className="quest-button" aria-label={`Quests (${openCount})`} onClick={() => setPanel({ type: 'list' })}>
          !<span className="badge">{openCount}</span>
        </button>
      </header>

      <div className="scene" ref={sceneEl} />

      <div className="hp">
        <div
          className={`hp-bar band-${view.band}`}
          role="progressbar"
          aria-label="Base HP"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={view.hp}
        >
          <div className="hp-fill" style={{ width: `${view.hp}%` }} />
        </div>
        <span className="hp-label">
          {view.hp} HP · {view.band}
        </span>
      </div>

      <nav className="bottom-bar">
        <button className="home-button" aria-label="Home" onClick={() => setPanel(null)} />
      </nav>

      {panel && (
        <div className="sheet-backdrop" onClick={() => setPanel(null)}>
          <section className="sheet" onClick={(e) => e.stopPropagation()}>
            {panel.type === 'list' && (
              <>
                <h2>Quests</h2>
                <ul className="quest-list">
                  {live.map((q) => (
                    <li key={q.id}>
                      <button onClick={() => setPanel({ type: 'quest', id: q.id })}>
                        {q.title} <small>{monsterFor(q.category, q.size).name}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {selected && (
              <>
                <h2>{selected.title}</h2>
                <p className="monster-name">
                  {monsterFor(selected.category, selected.size).name} · size {selected.size}
                </p>
                <p className="worth">{worthText(selected, now)}</p>
                {selected.status === 'open' ? (
                  <button className="slay" onClick={() => onClaim(selected.id)}>
                    Slay!
                  </button>
                ) : selected.status === 'claimed' ? (
                  <p className="waiting">Waiting for a parent to check</p>
                ) : null}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
