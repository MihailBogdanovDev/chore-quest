# Chore Quest

Chores as a base-defense game. A parent posts a chore as a quest; it appears as a
monster in front of the kid's base and damages it until the chore is done. Slaying
the monster (doing the chore) earns points — fewer the later it is done. Points
grow the base from a tent to a castle and buy parent-defined rewards.

Design: [`docs/superpowers/specs/2026-10-27-chore-quest-design.md`](docs/superpowers/specs/2026-10-27-chore-quest-design.md)

## Stack

React + TypeScript + Vite (PWA), Phaser for the pixel scene, Supabase for auth,
realtime and storage, Vitest for tests.

## Local setup

Needs Node 22 and Docker running.

```bash
npm install
npm run db:start          # local Supabase (Postgres, Auth, Mailpit)
cp .env.example .env.local
npx supabase status       # paste the publishable key into .env.local
npm run dev
```

Confirmation and password-reset emails land in Mailpit at http://127.0.0.1:54324. To try a parent and a kid
at once, open the parent on `http://localhost:5173` and the kid on
`http://127.0.0.1:5173`: separate origins keep separate sessions.

## Deploy

- **Database:** hosted Supabase project. Apply migrations with `npx supabase link --project-ref <ref>`
  then `npx supabase db push`. In the dashboard: enable anonymous sign-ins, and set the site URL
  and redirect URLs to the Vercel production URL.
- **App:** Vercel project linked to this repo, framework Vite. Env vars `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_KEY` (publishable key) for Production and Preview. Every push to `main` deploys.
- **Phones:** open the production URL and use "Add to Home Screen" (iOS Safari: Share menu;
  Android Chrome: install prompt). The app works full-screen and shows the last loaded state offline.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript |
| `npm run lint` | oxlint |
| `npm run build` | Production build |
| `npm run db:start` | Start local Supabase |
| `npm run db:reset` | Re-apply migrations to the local database |
| `npm run db:test` | pgTAP tests for schema, RLS and RPCs |
| `npm run db:types` | Regenerate `src/data/database.types.ts` |

## Folders

- `src/core/` — pure rules engine (HP, points, tiers, monsters). Imports nothing
  from React, Phaser or Supabase. Timestamps are epoch milliseconds.
- `src/game/` — Phaser scene. Renders a `BaseView`; never talks to Supabase.
- `src/ui/` — React screens.
- `src/data/` — the only place that talks to Supabase.
- `supabase/migrations/` — schema, RLS and RPCs. Rule-bound writes (claiming, approving,
  awarding points) only happen inside `security definer` RPCs.
- `supabase/tests/` — pgTAP tests.
