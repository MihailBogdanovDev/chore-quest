import { useEffect, useMemo } from 'react'
import { Icon } from '../kit'

/** Coins that arc from the middle of the screen into the HUD purse. */
export function CoinFly({ count = 8, onDone }: { count?: number; onDone: () => void }) {
  const coins = useMemo(() => {
    const purse = document.querySelector('[data-purse]')?.getBoundingClientRect()
    const tx = purse ? purse.left + purse.width / 2 - window.innerWidth / 2 : 100
    const ty = purse ? purse.top + purse.height / 2 - window.innerHeight * 0.6 : -300
    return Array.from({ length: count }, (_, i) => ({ i, tx: tx + (Math.random() - 0.5) * 20, ty, sx: (Math.random() - 0.5) * 120 }))
  }, [count])
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="kid-coinfly" aria-hidden>
      {coins.map((c) => (
        <span key={c.i} style={{ ['--tx' as string]: `${c.tx}px`, ['--ty' as string]: `${c.ty}px`, ['--sx' as string]: `${c.sx}px`, animationDelay: `${c.i * 70}ms` }}>
          <Icon name="coin" size={24} />
        </span>
      ))}
    </div>
  )
}
