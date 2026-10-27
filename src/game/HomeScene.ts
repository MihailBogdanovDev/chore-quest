import * as Phaser from 'phaser'
import type { BaseView, MonsterView } from '../core'
import { BAND_TINT, MONSTER_COLOR, TIER_ORDER, TIER_WIDTH } from './palette'

export const WIDTH = 320
export const HEIGHT = 240
const GROUND_Y = 190
const BASE_X = 100
const MONSTER_RADIUS = 14

/** Draws one kid's base with the monsters attacking it. Knows nothing about data loading. */
export class HomeScene extends Phaser.Scene {
  private view: BaseView
  private readonly onMonsterTap: (questId: string) => void
  private layer?: Phaser.GameObjects.Container

  constructor(view: BaseView, onMonsterTap: (questId: string) => void) {
    super('home')
    this.view = view
    this.onMonsterTap = onMonsterTap
  }

  create() {
    this.drawBackdrop()
    this.redraw()
  }

  setView(view: BaseView) {
    this.view = view
    if (this.sys.isActive()) this.redraw()
  }

  private redraw() {
    this.tweens.killAll()
    this.layer?.destroy()
    this.layer = this.add.container(0, 0)
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

  private drawBase(): Phaser.GameObjects.Graphics {
    const { tier, band } = this.view
    const level = TIER_ORDER.indexOf(tier)
    const w = TIER_WIDTH[tier]
    const ruined = band === 'ruined'
    const h = (ruined ? 0.4 : 1) * (24 + level * 8)
    const left = BASE_X - w / 2
    const top = GROUND_Y - h
    const g = this.add.graphics()

    if (tier === 'tent') {
      g.fillStyle(BAND_TINT[band]).fillTriangle(left, GROUND_Y, BASE_X, GROUND_Y - (ruined ? 12 : 34), left + w, GROUND_Y)
      g.fillStyle(0x3e2f22).fillTriangle(BASE_X - 6, GROUND_Y, BASE_X, GROUND_Y - 14, BASE_X + 6, GROUND_Y)
    } else {
      g.fillStyle(BAND_TINT[band]).fillRect(left, top, w, h)
      if (!ruined) g.fillStyle(0xa23b2a).fillTriangle(left - 6, top, BASE_X, top - 18 - level * 3, left + w + 6, top)
      if (level >= 4) {
        // Fort and castle get towers with battlements.
        for (const tx of [left - 6, left + w - 10]) {
          g.fillStyle(BAND_TINT[band]).fillRect(tx, top - 16, 16, h + 16)
          for (let i = 0; i < 3; i++) g.fillRect(tx + i * 6, top - 22, 4, 6)
        }
      }
      g.fillStyle(0x3e2f22).fillRect(BASE_X - 6, GROUND_Y - 16, 12, 16)
      if (level >= 2 && !ruined) g.fillStyle(0xfff3b0).fillRect(left + 8, top + 8, 8, 8).fillRect(left + w - 16, top + 8, 8, 8)
    }

    this.drawDamage(g, left, top, w, h)
    return g
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

  private drawMonster(m: MonsterView, index: number): Phaser.GameObjects.Container {
    const r = MONSTER_RADIUS * m.scale
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = 190 + col * 44 + row * 18
    const y = GROUND_Y - r + row * 14
    const c = this.add.container(x, y)

    const body = this.add.graphics()
    body.fillStyle(MONSTER_COLOR[m.kind]).fillEllipse(0, 0, r * 2, r * 1.8)
    body.fillStyle(0xffffff).fillCircle(-r * 0.35, -r * 0.2, r * 0.25).fillCircle(r * 0.35, -r * 0.2, r * 0.25)
    body.fillStyle(0x000000).fillCircle(-r * 0.4, -r * 0.2, r * 0.12).fillCircle(r * 0.3, -r * 0.2, r * 0.12)
    body.fillStyle(0x7a1f1f).fillRect(-r * 0.3, r * 0.3, r * 0.6, r * 0.15)
    if (m.size === 'L') body.fillStyle(0xffffff).fillTriangle(-r * 0.7, -r * 0.7, -r * 0.5, -r * 1.2, -r * 0.3, -r * 0.8)
    c.add(body)

    c.setSize(r * 2, r * 2).setInteractive({ useHandCursor: true })
    c.on('pointerdown', () => this.onMonsterTap(m.questId))
    if (m.claimed) c.setAlpha(0.5)
    else this.tweens.add({ targets: c, y: y - 3, duration: 500 + index * 70, yoyo: true, repeat: -1 })
    return c
  }
}
