# Chore Quest — Design Spec

Date: 2026-10-27 · Status: draft for review

## 1. Intent

A chore app for **our own family**. Chores are framed as a base-defense game:
each chore a parent posts becomes a monster standing in front of the kid's base,
damaging it until the chore is done. Finishing a chore slays the monster and
earns points; finishing late earns fewer points.

**Success:** the kids actually do their chores, and want to open the app.

Parents and kids use **separate phones**, kept in sync.

Inspiration sketch: home screen with a house in the mountains, a monster next to
it, a quest (`!`) button top-right and a points counter (`20P`); points tick down
over time (`-10min → 19P`); a second screen lists achievements.

## 2. Roles

- **Parent** — creates the family, posts quests, approves or rejects claims,
  manages rewards.
- **Kid** — has their own base, sees the monsters attacking it, claims quests
  as done, spends points.

A family has one or more parents and one or more kids. Kids join with the
family invite code.

## 3. Game rules

All numbers are defaults; v0.3 lets parents tune them (FR-18).

### 3.1 Quest → monster

| Quest field | Effect |
|---|---|
| Category | Monster element and sprite (table below) |
| Size `S` / `M` / `L` | Tiny / normal / buff boss |
| Due time (default: 24h after creation) | Points decay starts after it |
| Assigned kid | Monster appears at that kid's base |
| Repeat `none` / `daily` / `weekly` (v0.2) | Monster respawns on schedule |

| Category | Monster |
|---|---|
| `dishes` | Water slime |
| `trash` | Garbage golem |
| `room` | Dust beast |
| `laundry` | Sock ghost |
| `pets` | Mud critter |
| `homework` | Paper imp |
| `other` | Goblin |

| Size | Damage to base | Base points |
|---|---|---|
| `S` | 2 HP / hour | 10 |
| `M` | 5 HP / hour | 25 |
| `L` | 10 HP / hour | 60 |

### 3.2 Points and decay

- Full base points up to the due time.
- After due: −10% of base points per started 12 hours late.
- Floor: 25% of base points (always worth something).
- Points are fixed at the moment the kid **claims** the quest, so a slow parent
  approval never costs the kid points.
- Points are rounded down to whole numbers.

Example: an `M` quest (25P) claimed 30 hours late → 3 started 12h periods →
25 × (1 − 0.30) = 17.5 → **17P**.

### 3.3 Base HP

- Max HP 100, never below 0.
- Every open or claimed monster at a base drains HP at its damage rate from
  quest creation until the quest is approved. (A claimed monster still
  attacks until the parent approves — "staggered" but alive.)
- Each approved quest restores +5 HP.
- Passive regen +1 HP per hour while no monster is alive at the base.
- HP is computed from quest timestamps, not stored, so no scheduled jobs are
  needed. The computation lives in the pure `core/` engine.

| HP | Base look |
|---|---|
| 76–100 | Clean |
| 51–75 | Dirty |
| 26–50 | Cracked |
| 1–25 | Wrecked |
| 0 | Ruined — reward shop locked until a quest is approved |

There is no point loss at 0 HP.

### 3.4 Base tier

Tier depends on **lifetime points** (never decreases):

| Lifetime points | Tier |
|---|---|
| 0 | Tent |
| 100 | Hut |
| 300 | Cottage |
| 700 | House |
| 1500 | Fort |
| 3000 | Castle |

Tier and HP state combine: a "Cottage, dirty" sprite, a "Castle, wrecked"
sprite, and so on.

### 3.5 Spending

Awarded points go to both `lifetime_points` and `wallet_points`. Spending only
reduces the wallet.

- **Reward shop (v0.2)** — parent defines rewards ("30 min screen time = 50P");
  kid redeems; parent marks it fulfilled.
- **Base cosmetics (v0.3)** — flags, gardens, towers. Look only, no gameplay
  effect.
- **Achievements (v0.2)** — first slay, 7-day streak, 10 bosses slain, a week
  without the base ruined, …
- **Sibling leaderboard (v0.3)** — weekly points.

## 4. Functional requirements

### v0.1 — MVP

- **FR-1** Parent signs up with an email magic link, creates a family and gets
  an invite code.
- **FR-2** Parent creates kid profiles. A kid device signs in anonymously,
  enters the invite code and picks its kid profile. Kids need no email.
- **FR-3** Parent creates a quest: title, category, size, assigned kid, due
  time.
- **FR-4** Kid home screen: pixel-art scene with the kid's base and a monster
  per open quest, HP bar, wallet points, quest button.
- **FR-5** Base HP follows §3.3 and the base sprite reflects the HP band.
- **FR-6** Kid taps a monster → quest detail → "Slay!" claims it, with an
  optional photo as proof.
- **FR-7** Parent sees pending claims. Approve → monster death animation,
  points awarded per §3.2. Reject → quest back to open, monster stays, decay
  clock keeps running.
- **FR-8** Quest detail shows current worth and the next drop
  ("25P → 22P in 3h").
- **FR-9** Changes sync live between parent and kid devices.
- **FR-10** Base tier follows §3.4.
- **FR-11** Installable PWA, mobile-first layout.

### v0.2

- **FR-12** Reward shop (§3.5).
- **FR-13** Achievements screen.
- **FR-14** Recurring quests (daily / weekly).
- **FR-15** Web push: new quest (kid), claim pending (parent), base below
  25 HP (kid).

### v0.3

- **FR-16** Sibling weekly leaderboard.
- **FR-17** Base cosmetics shop.
- **FR-18** Parent can tune damage, points and decay numbers.
- **FR-19** Per-kid history and stats.

### Non-functional

- **NFR-1** Runs on free tiers (Supabase free, Vercel/Netlify free).
- **NFR-2** Family data isolated by Postgres row-level security.
- **NFR-3** Minimal kid data: display name and avatar only — no email, no
  location.
- **NFR-4** Points are calculated server-side; a kid client cannot award itself
  points.
- **NFR-5** The rules engine (`core/`) is pure TypeScript with unit tests for
  every rule in §3.
- **NFR-6** All art is CC0 or license-compatible and listed in `CREDITS.md`
  before the asset lands.
- **NFR-7** App shell loads offline and shows the last known state read-only.

## 5. Tech stack

| Concern | Choice | Why |
|---|---|---|
| App | React + TypeScript + Vite, PWA (vite-plugin-pwa) | Installable on any phone, no app store, fast iteration |
| Game scene | Phaser 3 | Mature 2D engine, pixel-art friendly, sprite animations |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, RPC) | Auth incl. anonymous, live sync, photo storage, free tier |
| Tests | Vitest (core, UI), Playwright (smoke) | Fast, TS-native |
| Hosting | Vercel | Free, preview deploys per PR |
| CI | GitHub Actions: typecheck, lint, test, build | |

Rejected: Expo/React Native (needs Apple developer account, harder pixel
layer), Godot + Firebase (painful forms UI, more work).

## 6. Architecture

```
┌──────────── PWA (React + TS + Vite) ────────────┐
│ src/ui/    React screens (parent + kid)         │
│ src/game/  Phaser scene: base, monsters, FX     │
│ src/core/  pure rules engine, no I/O            │
│ src/data/  Supabase client, queries, realtime   │
└───────────────────────┬─────────────────────────┘
                        │ supabase-js
┌───────────────────────▼─────────────────────────┐
│ Supabase: Postgres + RLS + Realtime + Storage   │
│ RPC: claim_quest, review_claim                  │
└─────────────────────────────────────────────────┘
```

Boundaries:

- `core/` exports pure functions: `baseHp(quests, now)`, `hpBand(hp)`,
  `pointsAt(quest, at)`, `nextDrop(quest, now)`, `tierFor(lifetimePoints)`,
  `monsterFor(category, size)`. No React, Phaser or Supabase imports.
- `game/` receives a plain view model (`{ tier, hpBand, monsters[] }`) and
  renders it. It never talks to Supabase.
- `ui/` owns screens and passes the view model to `game/`.
- `data/` is the only module that imports supabase-js.

### 6.1 Data model (v0.1)

```
families  (id, name, invite_code, created_at)
members   (id, family_id, user_id null, role parent|kid, display_name,
           avatar, lifetime_points, wallet_points, created_at)
quests    (id, family_id, kid_id, title, category, size,
           created_at, due_at, status open|claimed|done,
           claimed_at null, approved_at null, proof_path null,
           points_awarded null)
```

A rejected claim sets `status` back to `open` and clears `claimed_at`.

Later: `rewards`, `redemptions`, `achievements`, `member_achievements`,
`quest_templates` (recurring).

### 6.2 Key flows

- **Parent auth** — email magic link.
- **Kid auth** — anonymous sign-in on the kid device; `join_family(code,
  member_id)` RPC binds `user_id` to the kid profile.
- **Claim** — `claim_quest(quest_id)` RPC: caller must be the assigned kid;
  sets `status = claimed`, `claimed_at = now()`.
- **Review** — `review_claim(quest_id, approve)` RPC (security definer): caller
  must be a parent of the family. Approve computes points with the §3.2
  formula from `claimed_at`, sets `status = done`, `approved_at`,
  `points_awarded`, and adds points to the kid atomically.
- **Realtime** — client subscribes to `quests` and `members` for its family;
  the game scene spawns or kills monsters as rows change.
- **HP** — computed client-side by `core/baseHp`. Only used for display and the
  shop lock in v0.1.

### 6.3 Error handling

- Network failures: show last known state, retry with backoff, banner
  "offline".
- RPC rejections (not your quest, already reviewed): toast and refetch.
- Double approve: `review_claim` only acts on `status = claimed`.

## 7. Testing

- `core/`: TDD, a unit test per rule and boundary in §3 (decay steps, floor,
  HP clamp, regen, bands, tiers).
- SQL: RPC and RLS tests against local Supabase (`supabase start`).
- Playwright smoke: parent posts quest → kid sees monster → kid claims →
  parent approves → points shown.

## 8. Assets

Start with CC0 pixel packs (e.g. Kenney Tiny Town / Tiny Dungeon, OpenGameArt
slimes). Colored placeholder shapes are fine for the first slice. Each asset
gets a `CREDITS.md` row (file, source, author, license) in the same or an
earlier PR.

## 9. Delivery

GitHub repo `MihailBogdanovDev/chore-quest` (public). One issue per FR plus
infra issues (scaffold, CI, Supabase schema, deploy, assets). Labels:
`milestone:v0.1|v0.2|v0.3`, `area:core|game|ui|data|infra`.

**First implementation slice:** scaffold, `core/` engine with tests, kid home
scene rendering base and monsters from local mock data. Supabase wiring comes
next.

## 10. Out of scope (for now)

Native app store builds, multiple families per user, monetisation, chat,
parent-vs-parent permissions, localisation.
