-- Live updates for quests and points (FR-9). Realtime applies RLS per subscriber,
-- so each device only receives its own family's rows.
alter publication supabase_realtime add table public.quests, public.members;
