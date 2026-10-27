# First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running PWA skeleton whose kid home screen renders a pixel scene (base + monsters + HP bar + points) from mock quests, driven by a fully tested pure rules engine. Covers issues #1, #2, #3.

**Architecture:** `src/core/` holds pure rule functions and a `buildBaseView` that turns quests into a plain view model. `src/game/` is a Phaser scene that only renders that view model. `src/ui/` is React: it builds the view from mock data and mounts the game. No Supabase yet.

**Tech Stack:** Vite, React 18, TypeScript (strict), Vitest + @testing-library/react + jsdom, Phaser 3, ESLint.

**Spec:** `docs/superpowers/specs/2026-10-27-chore-quest-design.md`

## Global Constraints

- `src/core/` imports nothing from React, Phaser or Supabase (NFR-5).
- `src/game/` never imports `src/data/` or supabase-js (spec §6).
- Timestamps in `core/` are epoch milliseconds (`number`), never `Date`.
- All §3 numbers live in one file, `src/core/rules.ts`, so FR-18 can make them configurable later.
- No downloaded art in this slice; placeholder shapes only (NFR-6 kicks in with issue #7).

## Review Focus

1. Claim exactly at `dueAt` → full points (late means strictly after due).
2. Float drift in decay (e.g. 60P × 70%) → use integer percent math, never `0.1 * n`.
3. Quest created after `now` (clock skew) → ignored by `baseHp` and `buildBaseView`.
4. HP never below 0 or above 100, including heal at full HP and regen with no quests.
5. No quests at all → HP 100, band `clean`, zero monsters, scene renders without errors.

---

### Task 1: Scaffold (#1)

**Files:**
- Create: Vite React-TS project at repo root (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`), `eslint.config.js`, `src/test/setup.ts`, `src/smoke.test.ts`, `README.md`, `.gitignore`
- Create folders with `.gitkeep`: `src/data/`

**Interfaces:**
- Produces: scripts `dev`, `build`, `test` (`vitest run`), `typecheck` (`tsc -b --noEmit` or `tsc --noEmit -p tsconfig.app.json`), `lint`.

- [ ] **Step 1:** `npm create vite@latest . -- --template react-ts`, install, add `vitest jsdom @testing-library/react @testing-library/jest-dom phaser`.
- [ ] **Step 2:** Configure Vitest in `vite.config.ts` (`environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`), setup imports `@testing-library/jest-dom/vitest`.
- [ ] **Step 3:** Write `src/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Run `npm test` → PASS.
- [ ] **Step 4:** README: one-paragraph pitch, scripts, folder boundaries (copy Global Constraints).
- [ ] **Step 5:** `npm run typecheck && npm run lint && npm run build` → all exit 0. Commit `chore: scaffold vite react ts app (#1)`.

### Task 2: Rules constants and types (#2)

**Files:**
- Create: `src/core/types.ts`, `src/core/rules.ts`

**Interfaces:**
- Produces:
  - `type Category = 'dishes'|'trash'|'room'|'laundry'|'pets'|'homework'|'other'`
  - `type Size = 'S'|'M'|'L'`
  - `type QuestStatus = 'open'|'claimed'|'done'`
  - `interface Quest { id: string; title: string; category: Category; size: Size; createdAt: number; dueAt: number; status: QuestStatus; claimedAt: number|null; approvedAt: number|null }`
  - `rules.ts`: `HOUR = 3_600_000`, `DAMAGE_PER_HOUR: Record<Size, number> = {S:2,M:5,L:10}`, `BASE_POINTS: Record<Size, number> = {S:10,M:25,L:60}`, `MAX_HP = 100`, `HEAL_ON_APPROVE = 5`, `REGEN_PER_HOUR = 1`, `DECAY_PERCENT_PER_STEP = 10`, `DECAY_STEP_MS = 12 * HOUR`, `FLOOR_PERCENT = 25`, `DEFAULT_DUE_MS = 24 * HOUR`.

- [ ] **Step 1:** Write files. `npm run typecheck` → 0. (No test: constants only; covered by Tasks 3–5.)
- [ ] **Step 2:** Commit `feat(core): rule constants and quest types (#2)`.

### Task 3: Points and decay (#2)

**Files:**
- Create: `src/core/points.ts`, `src/core/points.test.ts`

**Interfaces:**
- Consumes: `Quest`, rules constants.
- Produces: `pointsAt(q: Pick<Quest,'size'|'dueAt'>, at: number): number`, `nextDrop(q: Pick<Quest,'size'|'dueAt'>, now: number): { at: number; points: number } | null`.

- [ ] **Step 1: Failing tests** (`due = 1_000_000_000_000`, `H = HOUR`):
  - `pointsAt({size:'M',dueAt:due}, due - H)` → 25
  - `pointsAt(M, due)` → 25 (exactly at due = on time)
  - `pointsAt(M, due + 1)` → 22 (1 step: floor(25×90/100)=22)
  - `pointsAt(M, due + 30*H)` → 17 (spec example)
  - `pointsAt(L, due + 36*H)` → 42 (60×70/100)
  - `pointsAt(S, due + 1000*H)` → 2 (floor 25%: floor(10×25/100))
  - `nextDrop(M, due - 3*H)` → `{ at: due, points: 22 }`
  - `nextDrop(M, due + 5*H)` → `{ at: due + 12*H, points: 20 }`
  - `nextDrop(M, due + 1000*H)` → `null`
- [ ] **Step 2:** `npx vitest run src/core/points.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement.** `periods = late <= 0 ? 0 : ceil(late / DECAY_STEP_MS)`; `pct = max(FLOOR_PERCENT, 100 - DECAY_PERCENT_PER_STEP * periods)`; `floor(base * pct / 100)`. `nextDrop`: null when current pct is already floor; otherwise `at` = `dueAt + periods * DECAY_STEP_MS` (the instant after which the next step applies), `points = pointsAt(q, at + 1)`.
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit `feat(core): points decay and next drop (#2)`.

### Task 4: Base HP, bands, tiers, monsters (#2)

**Files:**
- Create: `src/core/base.ts`, `src/core/base.test.ts`, `src/core/monsters.ts`, `src/core/monsters.test.ts`

**Interfaces:**
- Produces:
  - `baseHp(quests: Quest[], now: number): number` (integer, `Math.round`)
  - `type HpBand = 'clean'|'dirty'|'cracked'|'wrecked'|'ruined'`; `hpBand(hp: number): HpBand`
  - `type Tier = 'tent'|'hut'|'cottage'|'house'|'fort'|'castle'`; `tierFor(lifetimePoints: number): Tier`
  - `type MonsterKind = 'water-slime'|'garbage-golem'|'dust-beast'|'sock-ghost'|'mud-critter'|'paper-imp'|'goblin'`; `monsterFor(category: Category, size: Size): { kind: MonsterKind; name: string; scale: number }` with scale S 0.6, M 1, L 1.6, name e.g. "Water Slime".

- [ ] **Step 1: Failing tests** (`t0` epoch, quest helper `q(size, createdAt, approvedAt?)`):
  - no quests → 100
  - one open `M` created `t0`, now `t0+4H` → 80
  - two open (`S`, `L`) for 5H → 40
  - open `L` for 20H → 0 (clamp), and never negative
  - `M` created t0, approved t0+4H (status done), now t0+4H → 85 (80 + 5)
  - same, now t0+10H → 91 (regen +1/h × 6h)
  - regen caps at 100: `S` 1H approved, now +100H → 100
  - claimed quest still damages: `M` claimed at 2H, now 4H → 80
  - quest with `createdAt > now` ignored → 100
  - `hpBand`: 100→clean, 76→clean, 75→dirty, 51→dirty, 50→cracked, 26→cracked, 25→wrecked, 1→wrecked, 0→ruined
  - `tierFor`: -5→tent, 0→tent, 99→tent, 100→hut, 300→cottage, 700→house, 1500→fort, 2999→fort, 3000→castle
  - `monsterFor('dishes','L')` → `{kind:'water-slime', name:'Water Slime', scale:1.6}`; every Category maps to a distinct kind.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement `baseHp`** as an event sweep (the signature doesn't determine it):
  ```
  ignore quests with createdAt > now
  events = createdAt (+rate) and approvedAt<=now (-rate, heal) of each quest, sorted by time
  hp = MAX_HP; t = earliest event time (or now); rate = 0
  for each event e: advance(t → e.time); apply e; t = e.time
  advance(t → now)
  advance(dt): hp = rate > 0 ? hp - rate*dt/H : hp + REGEN_PER_HOUR*dt/H; clamp 0..MAX_HP
  approval event: rate -= DAMAGE_PER_HOUR[size]; hp = min(MAX_HP, hp + HEAL_ON_APPROVE)
  at equal times, process creations before approvals
  ```
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(core): base hp, bands, tiers, monster table (#2)`.

### Task 5: Base view model (#2)

**Files:**
- Create: `src/core/view.ts`, `src/core/view.test.ts`, `src/core/index.ts` (re-exports)

**Interfaces:**
- Produces: `interface MonsterView { questId: string; kind: MonsterKind; name: string; size: Size; scale: number; claimed: boolean }`, `interface BaseView { tier: Tier; hp: number; band: HpBand; monsters: MonsterView[] }`, `buildBaseView(quests: Quest[], lifetimePoints: number, now: number): BaseView`.

- [ ] **Step 1: Failing tests:** empty → `{tier:'tent',hp:100,band:'clean',monsters:[]}`; open + claimed + done + future quest → 2 monsters (done and future excluded), claimed one has `claimed: true`, ordered by `createdAt`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(core): base view model (#2)`.

### Task 6: Phaser home scene (#3)

**Files:**
- Create: `src/game/palette.ts`, `src/game/palette.test.ts`, `src/game/HomeScene.ts`, `src/game/createGame.ts`

**Interfaces:**
- Consumes: `BaseView`, `MonsterKind`, `HpBand`, `Tier`.
- Produces:
  - `MONSTER_COLOR: Record<MonsterKind, number>`, `BAND_TINT: Record<HpBand, number>`, `TIER_WIDTH: Record<Tier, number>` (base grows per tier, 40 → 140 px)
  - `createGame(parent: HTMLElement, view: BaseView, onMonsterTap: (questId: string) => void): { setView(view: BaseView): void; destroy(): void }`

- [ ] **Step 1: Failing test** `palette.test.ts`: every MonsterKind/HpBand/Tier has an entry; `TIER_WIDTH` strictly increasing in tier order.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement palette → PASS.
- [ ] **Step 4:** Implement `HomeScene`: 320×240 logical canvas, `pixelArt: true`, `Scale.FIT`. Draw with `Graphics`: sky + mountain triangles, ground strip, base (rect + roof triangle, width `TIER_WIDTH[tier]`, tinted `BAND_TINT[band]`, cracks lines for cracked/wrecked, rubble for ruined), monsters as blobs with eyes to the right of the base, size × `scale`, idle bob tween, claimed ones semi-transparent. Interactive monster → `onMonsterTap(questId)`. `setView` redraws.
- [ ] **Step 5:** `npm run typecheck` → 0. Commit `feat(game): phaser home scene with placeholder art (#3)`.

### Task 7: Kid home screen (#3)

**Files:**
- Create: `src/ui/mockQuests.ts`, `src/ui/KidHome.tsx`, `src/ui/KidHome.test.tsx`, `src/ui/KidHome.css`
- Modify: `src/App.tsx` (render `KidHome`), remove Vite demo assets/CSS

**Interfaces:**
- Consumes: `buildBaseView`, `pointsAt`, `nextDrop`, `createGame`.
- Produces: `mockQuests(now: number): Quest[]` (dishes S open, room L open, trash M claimed, one done), `KidHome({ quests, lifetimePoints, walletPoints, now }: Props)`.

- [ ] **Step 1: Failing test** (mock `../game/createGame` with `vi.mock`): renders `"<wallet>P"`, an HP bar with `role="progressbar"` and `aria-valuenow` = `baseHp`, a quest button labelled `Quests (2)` for open quests; clicking a monster callback opens a panel showing quest title and "25P → 22P in 3h" style worth text.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (layout like inspo: points top-left, `!` quests button top-right, scene, HP bar, bottom bar). Worth text via `pointsAt`/`nextDrop`, hours rounded up. **Step 4:** PASS.
- [ ] **Step 5:** `npm test && npm run typecheck && npm run lint && npm run build` → all 0. Run `npm run dev`, open in browser pane at mobile size, screenshot: base, 3 monsters, HP bar visible. Commit `feat(ui): kid home screen on mock data (#3)`.

### Task 8: Ship

- [ ] Push branch `feat/first-slice`, open PR closing #1 #2 #3 with screenshot.
