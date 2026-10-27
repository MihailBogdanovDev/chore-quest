-- Quest posting, claiming and reviewing (FR-3, FR-6, FR-7, NFR-2, NFR-4).
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, is_anonymous) values
  ('11111111-1111-1111-1111-111111111111', 'parent-x@example.com', false),
  ('22222222-2222-2222-2222-222222222222', 'parent-y@example.com', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, true);

\set as_parent_x 'set local role authenticated; set local request.jwt.claims = ''{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","is_anonymous":false}'';'
\set as_parent_y 'set local role authenticated; set local request.jwt.claims = ''{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","is_anonymous":false}'';'
\set as_ana 'set local role authenticated; set local request.jwt.claims = ''{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":true}'';'
\set as_ben 'set local role authenticated; set local request.jwt.claims = ''{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated","is_anonymous":true}'';'

-- Family X: parent, Ana and Ben (both joined). Family Y: one parent.
:as_parent_x
select public.create_family('The Xs', 'Mum');
select public.add_kid('Ana', 'wizard');
select public.add_kid('Ben', 'knight');
select invite_code as code, id as fam from public.families \gset
select id as ana_id from public.members where display_name = 'Ana' \gset
select id as ben_id from public.members where display_name = 'Ben' \gset
:as_ana
select public.join_family(:'code', :'ana_id');
:as_ben
select public.join_family(:'code', :'ben_id');
:as_parent_y
select public.create_family('The Ys', 'Dad');

-- Posting
:as_parent_x
select lives_ok(
  format($$insert into public.quests (family_id, kid_id, title, category, size) values (%L, %L, 'Do the dishes', 'dishes', 'M')$$, :'fam', :'ana_id'),
  'parent posts a quest');
select id as quest_id from public.quests \gset
select ok((select due_at - created_at = interval '24 hours' from public.quests), 'due defaults to 24h');

:as_ana
select throws_ok(
  format($$insert into public.quests (family_id, kid_id, title, category, size) values (%L, %L, 'Free points', 'other', 'S')$$, :'fam', :'ana_id'),
  '42501', null, 'kid cannot post quests');
select throws_ok(format($$update public.quests set status = 'done' where id = %L$$, :'quest_id'), '42501', null,
  'kid cannot update a quest directly');

:as_parent_x
select throws_ok(format($$update public.quests set points_awarded = 999 where id = %L$$, :'quest_id'), '42501', null,
  'parent cannot write points directly');

:as_parent_y
select is_empty($$select * from public.quests$$, 'other family sees no quests');
select throws_ok(
  format($$insert into public.quests (family_id, kid_id, title, category, size) values (%L, %L, 'Hijack', 'other', 'S')$$, :'fam', :'ana_id'),
  '42501', null, 'other family cannot post into this family');

-- Claiming
:as_ben
select throws_ok(format($$select public.claim_quest(%L)$$, :'quest_id'), 'P0001', 'not your quest', 'sibling cannot claim');
:as_ana
select is((select status::text from public.claim_quest(:'quest_id')), 'claimed', 'assigned kid claims');
select throws_ok(format($$select public.claim_quest(%L)$$, :'quest_id'), 'P0001', 'quest not open', 'cannot claim twice');
select throws_ok(format($$select public.review_claim(%L, true)$$, :'quest_id'), 'P0001', 'not a parent', 'kid cannot approve own claim');

-- Reviewing
:as_parent_y
select throws_ok(format($$select public.review_claim(%L, true)$$, :'quest_id'), 'P0001', 'not a parent', 'other family parent cannot review');
:as_parent_x
select is((select status::text from public.review_claim(:'quest_id', false)), 'open', 'reject sends it back');
:as_ana
select public.claim_quest(:'quest_id');
:as_parent_x
select is((select points_awarded from public.review_claim(:'quest_id', true)), 25, 'approve on time awards full points');
select results_eq(format($$select lifetime_points, wallet_points from public.members where id = %L$$, :'ana_id'),
  $$values (25, 25)$$, 'points land on the kid');
select throws_ok(format($$select public.review_claim(%L, true)$$, :'quest_id'), 'P0001', 'quest not claimed', 'no double approve');
select results_eq(format($$select lifetime_points from public.members where id = %L$$, :'ana_id'),
  $$values (25)$$, 'points awarded once');

select * from finish();
rollback;
