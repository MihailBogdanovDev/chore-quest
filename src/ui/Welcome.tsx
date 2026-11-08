import { useState } from 'react'
import { ParentAuth } from './ParentAuth'
import { Panel, PixelButton } from './kit'
import './screens.css'
import { useAction } from './useAction'

export function Welcome({ onKid }: { onKid: () => Promise<void> }) {
  const [mode, setMode] = useState<'pick' | 'parent'>('pick')
  const { run, busy, error } = useAction()

  return (
    <main className="screen title" style={{ backgroundImage: 'url(/art/bg-village.png)' }}>
      <div className="title__top">
        <img className="title__logo" src="/art/logo.png" alt="" draggable={false} />
        <h1 className="logo">CHORE QUEST</h1>
        <p className="tagline">Slay chores. Earn gold. Win rewards.</p>
      </div>
      {mode === 'pick' && (
        <div className="title__btns">
          <PixelButton variant="gold" block disabled={busy} onClick={() => run(onKid)}>
            I'm a Hero
          </PixelButton>
          <PixelButton variant="wood" block onClick={() => setMode('parent')}>
            I'm the Quest Giver
          </PixelButton>
          {error && <p role="alert" className="err on-dark">{error}</p>}
        </div>
      )}
      {mode === 'parent' && (
        <Panel className="title__panel">
          <ParentAuth />
          <button className="link" onClick={() => setMode('pick')}>
            Back
          </button>
        </Panel>
      )}
      <p className="version">version {__APP_VERSION__}</p>
    </main>
  )
}
