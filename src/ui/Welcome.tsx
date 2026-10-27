import { useState } from 'react'
import { ParentAuth } from './ParentAuth'
import './screens.css'
import { useAction } from './useAction'

export function Welcome({ onKid }: { onKid: () => Promise<void> }) {
  const [mode, setMode] = useState<'pick' | 'parent'>('pick')
  const { run, busy, error } = useAction()

  return (
    <main className="screen">
      <h1 className="logo">Chore Quest</h1>
      {mode === 'pick' && (
        <div className="stack">
          <button className="big" onClick={() => setMode('parent')}>
            I'm a parent
          </button>
          <button className="big alt" disabled={busy} onClick={() => run(onKid)}>
            I'm a kid
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
      {mode === 'parent' && (
        <>
          <ParentAuth />
          <button className="link" onClick={() => setMode('pick')}>
            Back
          </button>
        </>
      )}
      <p className="version">version {__APP_VERSION__}</p>
    </main>
  )
}
