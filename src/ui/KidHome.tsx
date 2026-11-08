import { useEffect, useMemo, useRef, useState } from 'react'
import { buildBaseView, monsterFor, type Quest } from '../core'
import { createGame, type GameHandle } from '../game/createGame'
import './KidHome.css'

interface Props {
  quests: Quest[]
  xp: number
  gold: number
  now: number
  onClaim: (questId: string) => void
}

type Panel = { type: 'list' } | { type: 'quest'; id: string } | null

export function KidHome({ quests, xp, gold, now, onClaim }: Props) {
  const view = useMemo(() => buildBaseView(quests, xp, now), [quests, xp, now])
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
        <span className="points">{gold}G</span>
        <span className="tier">{view.tier}</span>
        <button className="quest-button" aria-label={`Quests (${openCount})`} onClick={() => setPanel({ type: 'list' })}>
          !<span className="badge">{openCount}</span>
        </button>
      </header>

      <div className="scene" ref={sceneEl} />

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
                        {q.title} <small>{monsterFor(q.category, q.gold).name}</small>
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
                  {monsterFor(selected.category, selected.gold).name}
                </p>
                <p className="worth">{selected.gold}G</p>
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
