# Supabase + Auth Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real backend for families: schema, RLS and RPCs (#6) with pgTAP tests, plus parent sign-up / family creation (FR-1, #8) and kid device join (FR-2, #9) in the app.

**Architecture:** Supabase local stack via the CLI (npm dev dependency). One migration holds tables, enums, RLS, column grants and `security definer` RPCs; all writes that need rules go through RPCs. The app gets a thin `src/data/` layer (only place importing supabase-js) and an auth-driven screen switch in `App.tsx`.

**Tech Stack:** Supabase CLI 2.x (Docker), Postgres, pgTAP, @supabase/supabase-js 2.x, React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-chore-quest-design.md` (§3.2, §6.1, §6.2, FR-1, FR-2, NFR-2, NFR-3, NFR-4)

## Global Constraints

- Only `src/data/` imports supabase-js (spec §6).
- `anon` role gets no table or function access. Kid devices are anonymous *users*, i.e. role `authenticated`.
- One membership per auth user (`members.user_id` unique). Multiple families per user is out of scope (§10).
- Kid rows store `display_name` and `avatar` only (NFR-3).
- Points are only ever written by `review_claim` (NFR-4); `quest_points` in SQL must return the same numbers as `core/pointsAt` for the same inputs.
- RPCs: `security definer`, `set search_path = ''`, fully-qualified names, `execute` revoked from `public`/`anon`.
- Keys never committed: `.env.local` is gitignored, `.env.example` holds placeholders.

## Review Focus

1. Kid A's device reads or claims kid B's quest in the same family → claim refused (only assigned kid).
2. Parent of family X reads family Y's quests/members via table select → empty.
3. Anonymous user with no membership calls `create_family` → refused (parents must be email users).
4. Second device tries to join an already-bound kid profile → refused, first binding intact.
5. `review_claim` called twice → second call refused, points awarded once.

---

### Task 1: Supabase project + schema migration

**Files:**
- Create: `supabase/config.toml` (via `npx supabase init`), `supabase/migrations/20261027120000_init.sql`
- Modify: `package.json` (dev dep `supabase`, scripts `db:start`, `db:reset`, `db:test`, `db:types`)

**Interfaces — Produces (SQL):**
- Enums `member_role('parent','kid')`, `quest_category(dishes,trash,room,laundry,pets,homework,other)`, `quest_size('S','M','L')`, `quest_status('open','claimed','done')`
- Tables per spec §6.1. `members` unique `(id, family_id)`; `quests` FK `(kid_id, family_id) → members(id, family_id)` so a quest's kid is always in its family. `quests.due_at` default `now() + interval '24 hours'`. Name length checks 1–60 (family) / 1–30 (member). Points columns `>= 0`.
- `private.family_id() returns uuid`, `private.is_parent() returns boolean` (stable, security definer; read caller's `members` row).
- `public.quest_points(size quest_size, due_at timestamptz, at timestamptz) returns int` (immutable): same integer math as `core/points.ts` — steps = `ceil(late / 12h)` when late > 0, pct = `greatest(25, 100 - 10*steps)`, `floor(base*pct/100)`.
- RLS on all three tables. Select: same family. Quests: parent may insert (columns `family_id, kid_id, title, category, size, due_at` only, via column grant) and delete within own family. No direct update for anyone. Families/members: no direct writes.

- [ ] **Step 1:** `npx supabase init`; set `[auth] enable_anonymous_sign_ins = true`, `site_url = "http://localhost:5173"`. `npx supabase start` → services up.
- [ ] **Step 2:** Write migration (tables, enums, helpers, `quest_points`, RLS, grants). `npx supabase db reset` → applies with no error.
- [ ] **Step 3:** Commit `feat(db): schema, rls and points function (#6)`.

### Task 2: RPCs

**Files:** Modify migration (same file; nothing deployed yet).

**Interfaces — Produces (all `returns` a row of the named table unless stated):**
- `create_family(family_name text, parent_name text) returns families` — caller signed in, not anonymous (`auth.jwt()->>'is_anonymous'`), not already a member. Invite code: 6 chars from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, retry on collision.
- `add_kid(kid_name text, kid_avatar text) returns members` — caller is parent.
- `family_kids(code text) returns table(id uuid, display_name text, avatar text)` — unbound kids of the family with that code (case-insensitive); empty for wrong code.
- `join_family(code text, kid_id uuid) returns members` — caller not a member; kid belongs to that family, role kid, `user_id is null`; binds `user_id = auth.uid()`.
- `claim_quest(quest_id uuid) returns quests` — caller is the assigned kid; status open → claimed, `claimed_at = now()`.
- `review_claim(quest_id uuid, approve boolean) returns quests` — caller is parent of the quest's family; status must be claimed. Approve: `points_awarded = quest_points(size, due_at, claimed_at)`, status done, `approved_at = now()`, kid `lifetime_points` and `wallet_points` += points. Reject: status open, `claimed_at = null`.
- Errors: `raise exception` with stable messages: `not signed in`, `parents must sign in with email`, `already in a family`, `not a parent`, `invalid code or kid`, `not your quest`, `quest not open`, `quest not claimed`.

- [ ] **Step 1:** Write RPCs. `npx supabase db reset` → no error. Commit `feat(db): family, join, claim and review rpcs (#6)`.

### Task 3: pgTAP tests

**Files:** Create `supabase/tests/00_points.test.sql`, `supabase/tests/01_family.test.sql`, `supabase/tests/02_quests.test.sql`

Tests run as real roles: `set local role authenticated; set local request.jwt.claims = '{"sub":"…","is_anonymous":…}'`.

- [ ] **Step 1:** `00_points`: `quest_points` matches the TS cases (M before due 25, at due 25, +1ms 22, +30h 17, L +36h 42, S +1000h 2).
- [ ] **Step 2:** `01_family`: parent creates family (6-char code, parent member); anonymous user `create_family` throws `parents must sign in with email`; second `create_family` throws `already in a family`; non-parent `add_kid` throws; `family_kids` wrong code empty, right code lists unbound kid; kid device joins; second device joining same kid throws `invalid code or kid`; family Y parent selects no family X members/families.
- [ ] **Step 3:** `02_quests`: parent inserts quest; kid insert throws 42501; kid direct update affects 0 rows; other kid `claim_quest` throws `not your quest`; assigned kid claims; parent reject → open; claim again; approve → done, points 25, kid lifetime/wallet 25; second review throws `quest not claimed`; family Y parent sees no quests.
- [ ] **Step 4:** `npx supabase test db` → all pass. Commit `test(db): pgtap tests for rls and rpcs (#6)`.

### Task 4: Data layer

**Files:**
- Create: `src/data/database.types.ts` (generated, `npm run db:types`), `src/data/client.ts`, `src/data/auth.ts`, `src/data/family.ts`, `src/data/mappers.ts`, `src/data/mappers.test.ts`, `src/data/index.ts`, `.env.example`
- Modify: `.gitignore` (`.env.local`), remove `src/data/.gitkeep`

**Interfaces — Produces:**
- `interface Member { id: string; familyId: string; role: 'parent'|'kid'; displayName: string; avatar: string; lifetimePoints: number; walletPoints: number; joined: boolean }`
- `interface Family { id: string; name: string; inviteCode: string }`
- `interface KidOption { id: string; displayName: string; avatar: string }`
- `toQuest(row): Quest` (ISO strings → epoch ms), `toMember(row): Member`
- auth: `sendMagicLink(email: string): Promise<void>`, `signInAsKid(): Promise<void>` (anonymous), `signOut()`, `onAuthChange(cb: (s: { userId: string; anonymous: boolean } | null) => void): () => void`
- family: `getMe(): Promise<Member|null>`, `getFamily(): Promise<Family>`, `listKids(): Promise<Member[]>`, `createFamily(name, parentName): Promise<void>`, `addKid(name, avatar): Promise<void>`, `findKids(code): Promise<KidOption[]>`, `joinFamily(code, kidId): Promise<void>`, `listQuests(kidId): Promise<Quest[]>`
- Every function throws `Error(message)` from Postgres/Auth errors.

- [ ] **Step 1: Failing test** `mappers.test.ts`: quest row with `created_at '2026-10-27T10:00:00+00:00'` → `createdAt === Date.parse(…)`, null `claimed_at` → `null`; member row `user_id null` → `joined: false`.
- [ ] **Step 2:** FAIL → implement → PASS. Typecheck clean.
- [ ] **Step 3:** Commit `feat(data): supabase client, auth and family api (#6)`.

### Task 5: Parent flow (FR-1)

**Files:** Create `src/ui/Welcome.tsx`, `src/ui/ParentSetup.tsx`, `src/ui/ParentHome.tsx`, `src/ui/screens.css`, tests `src/ui/Welcome.test.tsx`, `src/ui/ParentHome.test.tsx`

- [ ] **Step 1: Failing tests** (mock `../data`): Welcome — "I'm a parent" → email field → submit calls `sendMagicLink('mum@example.com')` and shows "Check your email"; "I'm a kid" calls `onKid`. ParentSetup — submit calls `createFamily('The Bogdanovs','Mihail')` then `onDone`. ParentHome — shows family name and invite code, lists kids with "joined"/"waiting", add-kid form calls `addKid('Ana','wizard')` and reloads list.
- [ ] **Step 2:** FAIL → implement → PASS. Commit `feat(ui): parent sign-up, family setup and kids list (FR-1)`.

### Task 6: Kid join (FR-2) and app routing

**Files:** Create `src/ui/KidJoin.tsx`, `src/ui/KidJoin.test.tsx`; Modify `src/App.tsx`

App states: loading → no session: `Welcome` → parent session (non-anonymous) without member: `ParentSetup` → parent member: `ParentHome` → anonymous session without member: `KidJoin` → kid member: `KidHome` with `listQuests(me.id)` and real points.

- [ ] **Step 1: Failing test** KidJoin: type code `abc234` → `findKids('ABC234')` → kid buttons → pick → `joinFamily('ABC234', id)` → `onJoined`; empty result shows "No kids found for that code".
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Wire `App.tsx`. Full checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx supabase test db`.
- [ ] **Step 4: Manual E2E** on local stack: parent magic link via Mailpit (`http://127.0.0.1:54324`) → create family → add kid → second browser tab (other origin, `127.0.0.1:5173`) as kid → enter code → pick kid → kid home renders with 0P and 100 HP.
- [ ] **Step 5:** Commit `feat(ui): kid join flow and auth routing (FR-2)`.

### Task 7: CI database job + PR

- [ ] Add `db` job to `.github/workflows/ci.yml`: `supabase/setup-cli@v1`, `supabase db start`, `supabase test db`.
- [ ] README: local setup (Docker, `npm run db:start`, copy keys from `npx supabase status` into `.env.local`).
- [ ] Push `feat/supabase-auth`, PR closing #6 #8 #9.
