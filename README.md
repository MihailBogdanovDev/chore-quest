# Chore Quest

Chores as a base-defense game. A parent posts a chore as a quest; it appears as a
monster in front of the kid's base and damages it until the chore is done. Slaying
the monster (doing the chore) earns points — fewer the later it is done. Points
grow the base from a tent to a castle and buy parent-defined rewards.

Design: [`docs/superpowers/specs/2026-10-27-chore-quest-design.md`](docs/superpowers/specs/2026-10-27-chore-quest-design.md)

## Stack

React + TypeScript + Vite (PWA), Phaser for the pixel scene, Supabase for auth,
realtime and storage, Vitest for tests.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript |
| `npm run lint` | oxlint |
| `npm run build` | Production build |

## Folders

- `src/core/` — pure rules engine (HP, points, tiers, monsters). Imports nothing
  from React, Phaser or Supabase. Timestamps are epoch milliseconds.
- `src/game/` — Phaser scene. Renders a `BaseView`; never talks to Supabase.
- `src/ui/` — React screens.
- `src/data/` — the only place that talks to Supabase.
