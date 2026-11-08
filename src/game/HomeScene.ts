import * as Phaser from 'phaser'
import type { BaseView, MonsterView } from '../core'
import { MONSTER_COLOR, TIER_ORDER, TIER_WIDTH } from './palette'
import {
  BASE_SPRITE, baseKey, BG_SPRITE, HERO_IDS, heroKey, heroSrc, MONSTER_SPRITE, monsterKey,
} from './sprites'

export interface KeepMonster extends MonsterView {
  overdue: boolean
}
export interface KeepView extends BaseView {
  monsters: KeepMonster[]
  /** Avatar id, hero-1..4. */
  hero: string
}

export const WIDTH = 320
export const HEIGHT = 240
const HORIZON = 180
const KEEP_X = 160
const KEEP_FEET = 200
const HERO_HOME = { x: 160, y: 232 }
const HERO_PX = 46
const MONSTER_PX = 34
const MAX_KEEP_H = 120
const MIN_TAP = 40
/** Feet positions around the keep, nearest-the-gate first. */
const SLOTS: [number, number][] = [
  [78, 214], [242, 214], [40, 236], [280, 236], [116, 236], [204, 236], [30, 196], [290, 196], [100, 196], [220, 196],
]

type Sky = 'day' | 'dusk' | 'night'
const skyAt = (h: number): Sky => (h >= 7 && h < 17 ? 'day' : (h >= 17 && h < 20) || (h >= 5 && h < 7) ? 'dusk' : 'night')
const SKY_TINT: Record<Sky, [number, number]> = { day: [0, 0], dusk: [0xe8845a, 0.3], night: [0x0d1040, 0.5] }

/** Draws one kid's keep, hero and the monsters around it. Knows nothing about data loading. */
export class HomeScene extends Phaser.Scene {
  private view: KeepView
  private readonly onMonsterTap: (questId: string) => void
  private layer?: Phaser.GameObjects.Container
  private monsters = new Map<string, { c: Phaser.GameObjects.Container; m: KeepMonster; w: number; h: number }>()
  private bobbers: Phaser.GameObjects.GameObject[] = []
  private hero?: Phaser.GameObjects.Container
  private heroImg?: Phaser.GameObjects.Image
  private tint?: Phaser.GameObjects.Rectangle
  private stars: Phaser.GameObjects.GameObject[] = []
  private sky?: Sky
  private shown = ''
  private busy = false

  constructor(view: KeepView, onMonsterTap: (questId: string) => void) {
    super('home')
    this.view = view
    this.onMonsterTap = onMonsterTap
  }

  preload() {
    this.load.image('bg', BG_SPRITE)
    for (const tier of TIER_ORDER) this.load.image(baseKey(tier), BASE_SPRITE[tier])
    for (const [kind, path] of Object.entries(MONSTER_SPRITE)) this.load.image(monsterKey(kind as MonsterView['kind']), path)
    for (const id of HERO_IDS) this.load.image(heroKey(id), heroSrc(id))
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0).setDepth(0)
    const g = this.add.graphics().setDepth(0)
    g.fillStyle(0x4f8a3c).fillRect(0, HORIZON, WIDTH, HEIGHT - HORIZON)
    g.fillStyle(0x5d9d46)
    for (let y = HORIZON + 6; y < HEIGHT; y += 12) for (let x = (y / 12) % 2 ? 0 : 8; x < WIDTH; x += 16) g.fillRect(x, y, 4, 2)
    this.tint = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0, 0).setOrigin(0).setDepth(1)

    this.heroImg = this.add.image(0, 0, heroKey(this.view.hero)).setOrigin(0.5, 1)
    this.heroImg.setScale(HERO_PX / this.heroImg.height)
    const shadow = this.add.ellipse(0, 0, 22, 6, 0, 0.3)
    this.hero = this.add.container(HERO_HOME.x, HERO_HOME.y, [shadow, this.heroImg]).setDepth(HERO_HOME.y + 100)
    this.idleHero()
    this.applySky()
    this.redraw()
  }

  setView(view: KeepView) {
    const key = JSON.stringify(view)
    this.view = view
    if (!this.sys.isActive() || this.busy || key === this.shown) return
    this.redraw()
  }

  private idleHero() {
    if (!this.heroImg) return
    this.tweens.killTweensOf(this.heroImg)
    this.heroImg.y = 0
    this.tweens.add({ targets: this.heroImg, y: -2, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }

  private applySky() {
    const sky = skyAt(new Date().getHours())
    if (sky === this.sky) return
    this.sky = sky
    const [color, alpha] = SKY_TINT[sky]
    this.tint?.setFillStyle(color, alpha)
    this.stars.forEach((s) => s.destroy())
    this.stars = []
    if (sky !== 'night') return
    for (let i = 0; i < 28; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(4, WIDTH - 4), Phaser.Math.Between(4, 130), 2, 2, 0xffffff).setDepth(2)
      this.tweens.add({ targets: s, alpha: 0.2, duration: Phaser.Math.Between(500, 1500), yoyo: true, repeat: -1, delay: i * 70 })
      this.stars.push(s)
    }
    this.stars.push(this.add.circle(268, 34, 9, 0xfff3c4).setDepth(2), this.add.circle(272, 31, 8, 0x1d2150).setDepth(2))
  }

  private redraw() {
    this.shown = JSON.stringify(this.view)
    this.applySky()
    this.bobbers.forEach((o) => this.tweens.killTweensOf(o))
    this.bobbers = []
    this.layer?.destroy()
    this.monsters.clear()
    this.layer = this.add.container(0, 0).setDepth(10)
    const { tier, hero } = this.view

    const img = this.add.image(KEEP_X, KEEP_FEET, baseKey(tier)).setOrigin(0.5, 1)
    let w = TIER_WIDTH[tier] * 1.25
    let h = (w * img.height) / img.width
    if (h > MAX_KEEP_H) [w, h] = [(w * MAX_KEEP_H) / h, MAX_KEEP_H]
    img.setDisplaySize(w, h)
    this.layer.add(this.add.ellipse(KEEP_X, KEEP_FEET, w * 0.9, 8, 0, 0.25))
    this.layer.add(img)

    if (this.heroImg && this.heroImg.texture.key !== heroKey(hero)) this.heroImg.setTexture(heroKey(hero))
    this.view.monsters.forEach((m, i) => this.drawMonster(m, i))
  }

  private drawMonster(m: KeepMonster, i: number) {
    const [sx, sy] = SLOTS[i % SLOTS.length]
    const x = sx + Math.floor(i / SLOTS.length) * 12
    const h = MONSTER_PX * m.scale
    const c = this.add.container(x, sy).setDepth(sy)
    const body = this.add.image(0, 0, monsterKey(m.kind)).setOrigin(0.5, 1)
    body.setScale(h / body.height)
    const w = body.displayWidth
    c.add([this.add.ellipse(0, 0, w * 0.8, 5, 0, 0.3), body])
    this.bobbers.push(body)

    if (m.claimed) {
      body.setTint(0x8a8fa8).setAlpha(0.85)
      c.add(this.add.rectangle(0, -h * 0.5, w + 6, 3, 0xb9bfcc).setAngle(18).setStrokeStyle(1, 0x333344))
      c.add(this.add.rectangle(0, -h * 0.4, w + 6, 3, 0xb9bfcc).setAngle(-18).setStrokeStyle(1, 0x333344))
      const z = this.add.text(w / 2 - 2, -h - 4, 'Zzz', { fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#cfd8ff' }).setOrigin(0.5)
      c.add(z)
      this.bobbers.push(z)
      this.tweens.add({ targets: z, y: z.y - 5, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 })
    } else if (m.overdue) {
      body.setTint(0xff7060)
      const bang = this.add.text(0, -h - 6, '!', { fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ff4030', stroke: '#2a1a10', strokeThickness: 3 }).setOrigin(0.5)
      c.add(bang)
      this.bobbers.push(bang)
      this.tweens.add({ targets: body, x: 1.5, duration: 55, yoyo: true, repeat: -1 })
      this.tweens.add({ targets: bang, y: bang.y - 3, duration: 300, yoyo: true, repeat: -1 })
    } else {
      this.tweens.add({ targets: body, y: -3, duration: 480 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }

    const hw = Math.max(w, MIN_TAP)
    const hh = Math.max(h, MIN_TAP)
    const zone = this.add.rectangle(0, -hh / 2, hw, hh, 0xffffff, 0.001).setInteractive({ useHandCursor: true })
    zone.on('pointerdown', () => this.onMonsterTap(m.questId))
    c.add(zone)
    this.layer!.add(c)
    this.monsters.set(m.questId, { c, m, w, h })
  }

  /** Hero dashes in, slashes, the monster pops into smoke. */
  slay(questId: string): Promise<void> {
    const t = this.monsters.get(questId)
    const hero = this.hero
    if (!t || !hero || !this.heroImg || !this.sys.isActive()) return Promise.resolve()
    this.busy = true
    return new Promise((resolve) => {
      const { c, m, w, h } = t
      const left = c.x < HERO_HOME.x
      this.heroImg!.setFlipX(left)
      const stand = { x: c.x + (left ? 1 : -1) * (w / 2 + 12), y: c.y }
      this.tweens.add({
        targets: hero, x: stand.x, y: stand.y, duration: 220, ease: 'Quad.easeIn',
        onComplete: () => {
          const cx = c.x
          const cy = c.y - h / 2
          // slash streak
          const streak = this.add.rectangle(cx, cy, 4, h + 26, 0xffffff).setAngle(40).setDepth(900).setScale(1, 0.1)
          this.tweens.add({ targets: streak, scaleY: 1, duration: 70, onComplete: () => this.tweens.add({ targets: streak, alpha: 0, duration: 120, onComplete: () => streak.destroy() }) })
          const flash = this.add.rectangle(cx, cy, w + 8, h + 8, 0xffffff).setDepth(901)
          this.tweens.add({ targets: flash, alpha: 0, duration: 160, onComplete: () => flash.destroy() })
          this.cameras.main.shake(180, 0.012)
          this.tweens.add({ targets: this.heroImg, x: (left ? -1 : 1) * -6, duration: 70, yoyo: true })
          this.time.delayedCall(140, () => {
            this.poof(cx, cy, m)
            this.tweens.add({ targets: c, scale: 0, alpha: 0, duration: 140, onComplete: () => c.setVisible(false) })
            this.tweens.add({
              targets: hero, x: HERO_HOME.x, y: HERO_HOME.y, duration: 280, delay: 180, ease: 'Quad.easeOut',
              onComplete: () => { this.heroImg?.setFlipX(false); this.busy = false; this.idleHero(); this.setView(this.view) },
            })
            this.time.delayedCall(260, () => resolve())
          })
        },
      })
    })
  }

  private poof(x: number, y: number, m: MonsterView) {
    const colors = [0xffffff, 0xd9dde6, 0xaab0bf, MONSTER_COLOR[m.kind]]
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4
      const d = 22 + Math.random() * 26
      const size = Phaser.Math.Between(4, 9)
      const p = this.add.rectangle(x, y, size, size, colors[i % colors.length]).setDepth(900)
      this.tweens.add({
        targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 10, alpha: 0, scale: 1.8,
        duration: 650, ease: 'Quad.easeOut', onComplete: () => p.destroy(),
      })
    }
    const pow = this.add.text(x, y - 18, 'POW!', { fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: '#f4c542', stroke: '#2a1a10', strokeThickness: 4 }).setOrigin(0.5).setDepth(902)
    this.tweens.add({ targets: pow, y: pow.y - 18, scale: 1.4, alpha: 0, duration: 650, onComplete: () => pow.destroy() })
  }
}
