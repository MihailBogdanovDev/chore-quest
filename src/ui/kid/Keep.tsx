import { useEffect, useRef, type MutableRefObject } from 'react'
import { createGame, type GameHandle, type KeepView } from '../../game/createGame'

/** Mounts the Phaser keep while this tab is shown. */
export function Keep({ view, onTap, handle }: { view: KeepView; onTap: (id: string) => void; handle: MutableRefObject<GameHandle | null> }) {
  const el = useRef<HTMLDivElement>(null)
  const first = useRef(view)
  const tap = useRef(onTap)
  tap.current = onTap
  useEffect(() => {
    if (!el.current) return
    const g = createGame(el.current, first.current, (id) => tap.current(id))
    handle.current = g
    return () => {
      g.destroy()
      handle.current = null
    }
  }, [handle])
  useEffect(() => {
    handle.current?.setView(view)
  }, [view, handle])
  return <div className="kid-scene" ref={el} />
}
