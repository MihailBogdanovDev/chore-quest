-- Devices get live updates for quests and points (FR-9). Realtime applies RLS per subscriber.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

select set_eq(
  $$select tablename::text from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'$$,
  array['quests', 'members'],
  'quests and members are published to realtime'
);

select * from finish();
rollback;
