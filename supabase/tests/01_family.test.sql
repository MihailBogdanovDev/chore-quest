-- Families, kid join and cross-family isolation (FR-1, FR-2, NFR-2).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, is_anonymous) values
  ('11111111-1111-1111-1111-111111111111', 'parent-x@example.com', false),
  ('22222222-2222-2222-2222-222222222222', 'parent-y@example.com', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, true);

\set as_parent_x 'set local role authenticated; set local request.jwt.claims = ''{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","is_anonymous":false}'';'
\set as_parent_y 'set local role authenticated; set local request.jwt.claims = ''{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","is_anonymous":false}'';'
\set as_device_1 'set local role authenticated; set local request.jwt.claims = ''{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated","is_anonymous":true}'';'
\set as_device_2 'set local role authenticated; set local request.jwt.claims = ''{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated","is_anonymous":true}'';'

-- Anonymous kid devices cannot start a family.
:as_device_1
select throws_ok($$select public.create_family('Nope', 'Nope')$$, 'P0001', 'parents must sign in with email',
  'anonymous user cannot create a family');

:as_parent_x
select lives_ok($$select public.create_family('The Xs', 'Mum')$$, 'parent creates a family');
select matches((select invite_code from public.families), '^[A-HJ-NP-Z2-9]{6}$', 'invite code is 6 unambiguous chars');
select is((select role::text from public.members), 'parent', 'creator is a parent member');
select throws_ok($$select public.create_family('Again', 'Mum')$$, 'P0001', 'already in a family',
  'one family per user');

select public.add_kid('Ana', 'wizard');
select public.add_kid('Ben', 'knight');
select invite_code as code from public.families \gset
select id as ana_id from public.members where display_name = 'Ana' \gset

:as_device_1
select throws_ok($$select public.add_kid('Sneaky', 'knight')$$, 'P0001', 'not a parent', 'non-member cannot add kids');
select is_empty($$select * from public.family_kids('WRONG1')$$, 'wrong code lists no kids');
select is((select count(*)::int from public.family_kids(lower(:'code'))), 2, 'code is case-insensitive and lists unbound kids');
select is_empty($$select * from public.members$$, 'device sees no members before joining');
select lives_ok(format($$select public.join_family(%L, %L)$$, :'code', :'ana_id'), 'device joins as Ana');
select is((select count(*)::int from public.members), 3, 'joined kid sees own family');

:as_device_2
select throws_ok(format($$select public.join_family(%L, %L)$$, :'code', :'ana_id'), 'P0001', 'invalid code or kid',
  'second device cannot take a bound kid');

:as_parent_y
select public.create_family('The Ys', 'Dad');
select is((select count(*)::int from public.members), 1, 'other family sees only its own members');

reset role;
select is((select user_id from public.members where id = :'ana_id'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Ana stays bound to the first device');

select * from finish();
rollback;
