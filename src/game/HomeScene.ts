import * as Phaser from 'phaser'
import type { BaseView, MonsterView } from '../core'
import { slainMonsters } from './diff'
import { BAND_TINT, MONSTER_COLOR, TIER_ORDER, TIER_WIDTH } from './palette'
import { BASE_SPRITE, baseKey, MONSTER_SPRITE, monsterKey } from './sprites'

export const WIDTH = 320
export const HEIGHT = 240
const GROUND_Y = 190
const BASE_X = 100
/** Drawn height of a medium monster; S and L scale from it. */
const MONSTER_PX = 34
/** Tallest a base may be drawn, so a castle stays under the sky. */
const MAX_BASE_H = 150
const MIN_TAP = 36

/** Draws one kid's base with the monsters attacking it. Knows nothing about data loading. */
export class HomeScene extends Phaser.Scene {
  private view: BaseView
  private readonly onMonsterTap: (questId: string) => void
  private layer?: Phaser.GameObjects.Container
  /** Where each monster was last drawn, so a slain one can burst in place. */
  private positions = new Map<string, { x: number; y: number }>()

  constructor(view: BaseView, onMonsterTap: (questId: string) => void) {
    super('home')
    this.view = view
    this.onMonsterTap = onMonsterTap
  }

  preload() {
    for (const tier of TIER_ORDER) this.load.image(baseKey(tier), BASE_SPRITE[tier])
    for (const [kind, path] of Object.entries(MONSTER_SPRITE)) this.load.image(monsterKey(kind as MonsterView['kind']), path)
  }

  create() {
    this.drawBackdrop()
    this.redraw()
  }

  setView(view: BaseView) {
    const slain = slainMonsters(this.view.monsters, view.monsters)
    const lastSeen = new Map(this.positions)
    this.view = view
    if (!this.sys.isActive()) return
    this.redraw()
    for (const m of slain) this.burst(m, lastSeen.get(m.questId))
  }

  private redraw() {
    // Only stop the idle bobbing of monsters being replaced; a running burst keeps going.
    this.layer?.list.forEach((o) => this.tweens.killTweensOf(o))
    this.layer?.destroy()
    this.layer = this.add.container(0, 0)
    this.positions.clear()
    this.layer.add(this.drawBase())
    this.view.monsters.forEach((m, i) => this.layer!.add(this.drawMonster(m, i)))
  }

  private drawBackdrop() {
    const g = this.add.graphics()
    g.fillStyle(0x8ecae6).fillRect(0, 0, WIDTH, GROUND_Y)
    g.fillStyle(0x6c7a89).fillTriangle(-20, GROUND_Y, 70, 70, 160, GROUND_Y)
    g.fillStyle(0x5b6776).fillTriangle(110, GROUND_Y, 220, 50, 340, GROUND_Y)
    g.fillStyle(0xffffff).fillTriangle(56, 84, 70, 70, 84, 84).fillTriangle(204, 66, 220, 50, 236, 66)
    g.fillStyle(0x7cb342).fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y)
  }

  private drawBase(): Phaser.GameObjects.Container {
    const { tier, band } = this.view
    const img = this.add.image(BASE_X, GROUND_Y, baseKey(tier)).setOrigin(0.5, 1).setTint(BAND_TINT[band])
    let w = TIER_WIDTH[tier]
    let h = (w * img.height) / img.width
    if (h > MAX_BASE_H) [w, h] = [(w * MAX_BASE_H) / h, MAX_BASE_H]
    img.setDisplaySize(w, h)
    if (band === 'ruined') {
      // Only the bottom of the walls is left standing.
      img.setCrop(0, img.height * 0.6, img.width, img.height * 0.4)
      h *= 0.4
    }
    const g = this.add.graphics()
    // Keep the grime on the walls, not the transparent margin around the sprite.
    this.drawDamage(g, BASE_X - w * 0.35, GROUND_Y - h * 0.75, w * 0.7, h * 0.75)
    return this.add.container(0, 0, [img, g])
  }

  private drawDamage(g: Phaser.GameObjects.Graphics, left: number, top: number, w: number, h: number) {
    const { band } = this.view
    if (band === 'clean') return
    // Grime spots for every damaged band.
    g.fillStyle(0x4e3b2a, 0.5)
    for (let i = 0; i < 4; i++) g.fillCircle(left + ((i * 37) % w), top + h * 0.3 + ((i * 13) % (h * 0.6)), 3)
    if (band === 'cracked' || band === 'wrecked') {
      g.lineStyle(1, 0x2b2118)
      g.lineBetween(left + w * 0.2, top + 4, left + w * 0.3, top + h * 0.6)
      g.lineBetween(left + w * 0.7, top + h * 0.2, left + w * 0.62, top + h * 0.8)
    }
    if (band === 'wrecked') {
      g.fillStyle(0x1f1a14).fillRect(left + w * 0.6, top + 2, 10, 8)
    }
    if (band === 'ruined') {
      g.fillStyle(0x6e6259)
      for (let i = 0; i < 6; i++) g.fillRect(left - 8 + i * (w / 5), GROUND_Y - 5, 8, 5)
    }
  }

  /** Death animation: the monster pops into pixels that fly out and fade. */
  private burst(m: MonsterView, at = { x: 220, y: GROUND_Y - 14 }) {
    const pixels = 10
    for (let i = 0; i < pixels; i++) {
      const angle = (i / pixels) * Math.PI * 2
      const dist = 24 + (MONSTER_PX / 2) * m.scale
      const px = this.add.rectangle(at.x, at.y, 4, 4, MONSTER_COLOR[m.kind])
      this.tweens.add({
        targets: px,
        x: at.x + Math.cos(angle) * dist,
        y: at.y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => px.destroy(),
      })
    }
  }

  private drawMonster(m: MonsterView, index: number): Phaser.GameObjects.Container {
    const h = MONSTER_PX * m.scale
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = 190 + col * 44 + row * 18
    const y = GROUND_Y - h / 2 + row * 14
    const c = this.add.container(x, y)
    this.positions.set(m.questId, { x, y })

    const body = this.add.image(0, 0, monsterKey(m.kind))
    body.setScale(h / body.height)
    c.add(body)

    // Small monsters still get a finger-sized tap target.
    const hit = Math.max(body.displayWidth, h, MIN_TAP)
    c.setSize(hit, hit).setInteractive({ useHandCursor: true })
    c.on('pointerdown', () => this.onMonsterTap(m.questId))
    if (m.claimed) c.setAlpha(0.5)
    else this.tweens.add({ targets: c, y: y - 3, duration: 500 + index * 70, yoyo: true, repeat: -1 })
    return c
  }
}
