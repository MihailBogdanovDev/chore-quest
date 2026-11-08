import * as Phaser from 'phaser'
import { HEIGHT, HomeScene, WIDTH, type KeepView } from './HomeScene'

export type { KeepView, KeepMonster } from './HomeScene'

export interface GameHandle {
  setView(view: KeepView): void
  /** Plays the dash, slash and poof on a monster. Resolves when it is gone. */
  slay(questId: string): Promise<void>
  destroy(): void
}

/** Mounts the keep scene into `parent`. The only entry point React uses. */
export function createGame(
  parent: HTMLElement,
  view: KeepView,
  onMonsterTap: (questId: string) => void,
): GameHandle {
  const scene = new HomeScene(view, onMonsterTap)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    pixelArt: true,
    backgroundColor: '#1b1426',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene,
  })
  return {
    setView: (v) => scene.setView(v),
    slay: (id) => scene.slay(id),
    destroy: () => game.destroy(true),
  }
}
