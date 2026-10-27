# Quests, Approvals and Realtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parents post quests (FR-3) and approve/reject claims (FR-7); parent and kid screens update live (FR-9); a slain monster plays a death animation.

**Architecture:** RPCs from #6 already enforce the rules, so this slice is mostly app work. One migration adds `quests` and `members` to the `supabase_realtime` publication; realtime respects RLS, so each device only receives its family's rows. The app treats any change event as "reload": simple and always consistent with the database.

**Tech Stack:** supabase-js realtime (`postgres_changes`), React, Phaser, Vitest, pgTAP.

**Spec:** `docs/superpowers/specs/2026-10-27-chore-quest-design.md` (§3.1, §3.2, §6.2, FR-3, FR-7, FR-8, FR-9)

## Global Constraints

- Only `src/data/` imports supabase-js; components receive data and callbacks.
- Points shown to the parent before approving come from `core/pointsAt(quest, claimedAt)`; the awarded value still comes from `review_claim`.
- Due time defaults to 24h (`DEFAULT_DUE_MS`).
- Realtime callbacks only trigger reloads; they never patch local state from payloads.

## Review Focus

1. Parent approves while the kid's screen is open → monster dies, wallet updates without a refresh.
2. Parent posts a quest while the kid's screen is open → monster appears without a refresh.
3. Approve/reject double-tapped → second call fails with `quest not claimed`; UI shows the error, no crash.
4. Family with no kids → quest form explains to add a kid first instead of submitting an empty `kid_id`.
5. Realtime subscription is cleaned up on sign-out/unmount (no duplicate reloads after re-render).

---

### Task 1: Realtime publication

**Files:** Create `supabase/migrations/20261027150000_realtime.sql`, `supabase/tests/03_realtime.test.sql`

- [ ] **Step 1: Failing test:** `pg_publication_tables` for `supabase_realtime` contains `quests` and `members`.
- [ ] **Step 2:** `npx supabase test db` → FAIL. Migration: `alter publication supabase_realtime add table public.quests, public.members;` → reset → PASS. Commit `feat(db): publish quests and members to realtime (FR-9)`.

### Task 2: Data layer

**Files:** Modify `src/data/family.ts`; Create `src/data/realtime.ts`; Modify `src/data/index.ts`

**Interfaces — Produces:**
- `interface FamilyQuest extends Quest { kidId: string }`; `toQuest` gains `kidId` via a new `toFamilyQuest(row)` in `mappers.ts` (test it).
- `postQuest(input: { kidId: string; title: string; category: Category; size: Size; dueAt: number }): Promise<void>` — inserts with `family_id` from `getMe()`.
- `listFamilyQuests(): Promise<FamilyQuest[]>` — all quests not `done`, oldest first.
- `reviewClaim(questId: string, approve: boolean): Promise<void>`
- `subscribeFamily(familyId: string, onChange: () => void): () => void` — one channel, `postgres_changes` `*` on `quests` and `members` filtered `family_id=eq.<id>`; returns unsubscribe.

- [ ] **Step 1:** Failing mapper test for `toFamilyQuest` (has `kidId`). FAIL → implement → PASS. Typecheck. Commit `feat(data): post, review, family quests and realtime subscribe`.

### Task 3: Parent UI

**Files:** Create `src/ui/QuestForm.tsx`, `src/ui/ClaimList.tsx`, `src/ui/QuestBoard.tsx`, tests `src/ui/ParentQuests.test.tsx`; Modify `src/ui/ParentHome.tsx`, `src/ui/ParentFlow.test.tsx` (mock new data fns)

**Interfaces:**
- `QuestForm({ kids, onPost }: { kids: Member[]; onPost: (input) => Promise<void> })` — fields Title, Chore type (category), Size (S Small / M Medium / L Boss), For (kid), Due in (2, 6, 12, 24, 48 h; default 24). Empty kids → "Add a kid first".
- `ClaimList({ quests, kids, now, onReview })` — claimed quests: "Ana — Do the dishes — 25P" with Approve / Reject.
- `QuestBoard({ quests, kids, now })` — open quests: monster name, kid, worth now (`pointsAt`).
- ParentHome loads `listFamilyQuests` with family/kids and subscribes via `subscribeFamily` → reload all.

- [ ] **Step 1: Failing tests:** form submit calls `onPost({ kidId:'k1', title:'Take out trash', category:'trash', size:'L', dueAt: now + 24h })` (fake `now` via prop); no kids → "Add a kid first" and no form; ClaimList shows `25P` for an on-time M claim and Approve calls `onReview('q1', true)`, Reject `onReview('q1', false)`; QuestBoard lists "Garbage Golem" for a trash quest.
- [ ] **Step 2:** FAIL → implement → PASS. Commit `feat(ui): parent posts quests and reviews claims (FR-3, FR-7)`.

### Task 4: Kid realtime + death animation

**Files:** Modify `src/App.tsx` (KidRoot), `src/game/HomeScene.ts`; Create `src/game/diff.ts`, `src/game/diff.test.ts`

**Interfaces:** `slainMonsters(prev: MonsterView[], next: MonsterView[]): MonsterView[]` — monsters present before and missing now.

- [ ] **Step 1: Failing test** `diff.test.ts`: prev [a,b], next [b] → [a]; new monster not reported.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** HomeScene `setView`: for each slain monster, at its old position draw a burst (8 small squares flying out + fade, 500ms) before redraw. KidRoot: own `member` state (refresh with `getMe` + `listQuests` on every family change), subscribe with `subscribeFamily(me.familyId, load)`.
- [ ] **Step 4:** All checks green. Commit `feat: kid screen updates live, slain monsters burst (FR-9)`.

### Task 5: E2E + PR

- [ ] Two origins: parent posts quest → kid sees monster appear live; kid claims → parent sees claim live; parent approves → kid sees burst, wallet 25P, HP heals.
- [ ] Push `feat/quests-realtime`, PR closing #10 #14 #16 (FR-3, FR-7, FR-9), stacked on #28.
