import * as Phaser from 'phaser'
import type { BaseView } from '../core'
import { HEIGHT, HomeScene, WIDTH } from './HomeScene'

export interface GameHandle {
  setView(view: BaseView): void
  destroy(): void
}

/** Mounts the base scene into `parent`. The only entry point React uses. */
export function createGame(
  parent: HTMLElement,
  view: BaseView,
  onMonsterTap: (questId: string) => void,
): GameHandle {
  const scene = new HomeScene(view, onMonsterTap)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    pixelArt: true,
    backgroundColor: '#8ecae6',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene,
  })
  return {
    setView: (v) => scene.setView(v),
    destroy: () => game.destroy(true),
  }
}
