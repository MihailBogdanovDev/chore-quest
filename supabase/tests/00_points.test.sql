-- quest_points must agree with src/core/points.test.ts.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

\set due '''2026-01-01 00:00:00+00''::timestamptz'

select is(public.quest_points('M', :due, :due - interval '1 hour'), 25, 'full points before due');
select is(public.quest_points('M', :due, :due), 25, 'exactly at due is on time');
select is(public.quest_points('M', :due, :due + interval '1 millisecond'), 22, '1ms late drops one step');
select is(public.quest_points('M', :due, :due + interval '30 hours'), 17, '30h late: spec example');
select is(public.quest_points('L', :due, :due + interval '36 hours'), 42, 'integer math, no float drift');
select is(public.quest_points('S', :due, :due + interval '1000 hours'), 2, 'floor at 25%');

select * from finish();
rollback;
