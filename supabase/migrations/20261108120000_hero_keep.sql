-- Hero of the Keep: gold per quest, repeats, streaks, loot chests, merchant (rewards + purchases).
-- members.lifetime_points is XP, members.wallet_points is gold (columns keep their names).

create type public.quest_repeat as enum ('none', 'daily', 'weekly');
create type public.purchase_status as enum ('pending', 'delivered');

alter table public.quests
  add column gold integer not null default 10 check (gold between 1 and 1000),
  add column repeat public.quest_repeat not null default 'none',
  add column chest_gold integer;
-- Size is no longer chosen; the monster size is derived from gold on the client.
alter table public.quests alter column size set default 'M';

alter table public.members
  add column streak integer not null default 0,
  add column best_streak integer not null default 0,
  add column last_done_on date,
  add column approvals_count integer not null default 0;

grant insert (gold, repeat) on public.quests to authenticated;

-- ---------------------------------------------------------------------------
-- Merchant

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  icon text not null default 'gift',
  price integer not null check (price > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index rewards_family_idx on public.rewards (family_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  kid_id uuid not null,
  reward_id uuid references public.rewards (id) on delete set null,
  -- Snapshot of the reward at purchase time.
  name text not null,
  icon text not null,
  price integer not null,
  status public.purchase_status not null default 'pending',
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  foreign key (kid_id, family_id) references public.members (id, family_id) on delete cascade
);
create index purchases_family_idx on public.purchases (family_id);
create index purchases_kid_idx on public.purchases (kid_id);

alter table public.rewards enable row level security;
alter table public.purchases enable row level security;

revoke all on public.rewards, public.purchases from anon, authenticated;
grant select on public.rewards, public.purchases to authenticated;
grant insert (family_id, name, icon, price, active) on public.rewards to authenticated;
grant update (name, icon, price, active) on public.rewards to authenticated;

create policy "family reads own rewards" on public.rewards
  for select to authenticated using (family_id = (select private.family_id()));

create policy "parents add rewards" on public.rewards
  for insert to authenticated
  with check (family_id = (select private.family_id()) and (select private.is_parent()));

create policy "parents edit rewards" on public.rewards
  for update to authenticated
  using (family_id = (select private.family_id()) and (select private.is_parent()))
  with check (family_id = (select private.family_id()) and (select private.is_parent()));

create policy "family reads own purchases" on public.purchases
  for select to authenticated using (family_id = (select private.family_id()));

alter publication supabase_realtime add table public.rewards, public.purchases;

-- ---------------------------------------------------------------------------
-- RPCs

drop function public.quest_points(public.quest_size, timestamptz, timestamptz);

create or replace function public.claim_quest(quest_id uuid)
returns public.quests
language plpgsql security definer set search_path = ''
as $$
declare
  q public.quests;
begin
  select * into q from public.quests where id = quest_id for update;
  if q.id is null or q.kid_id is distinct from private.member_id() then
    raise exception 'not your quest';
  end if;
  if q.status <> 'open' then
    raise exception 'quest not open';
  end if;
  update public.quests set status = 'claimed', claimed_at = now()
   where id = quest_id returning * into q;
  return q;
end;
$$;

create or replace function public.review_claim(quest_id uuid, approve boolean)
returns public.quests
language plpgsql security definer set search_path = ''
as $$
declare
  q public.quests;
  m public.members;
  chest integer := null;
  total integer;
  d date;
  new_streak integer;
  step interval;
  next_due timestamptz;
begin
  select * into q from public.quests where id = quest_id for update;
  if q.id is null or q.family_id is distinct from private.family_id() or not private.is_parent() then
    raise exception 'not a parent';
  end if;
  if q.status <> 'claimed' then
    raise exception 'quest not claimed';
  end if;

  if not approve then
    update public.quests set status = 'open', claimed_at = null
     where id = quest_id returning * into q;
    return q;
  end if;

  select * into m from public.members where id = q.kid_id for update;

  -- Every 3rd approved quest drops a chest with 5-20 bonus gold.
  if (m.approvals_count + 1) % 3 = 0 then
    chest := 5 + floor(random() * 16)::integer;
  end if;
  total := q.gold + coalesce(chest, 0);

  -- Streak counts days (Amsterdam time) with at least one approved quest, by claim date.
  d := (q.claimed_at at time zone 'Europe/Amsterdam')::date;
  if m.last_done_on = d then
    new_streak := m.streak;
  elsif m.last_done_on = d - 1 then
    new_streak := m.streak + 1;
  else
    new_streak := 1;
  end if;

  update public.quests
     set status = 'done', approved_at = now(), points_awarded = q.gold, chest_gold = chest
   where id = quest_id returning * into q;

  update public.members
     set lifetime_points = lifetime_points + total,
         wallet_points = wallet_points + total,
         approvals_count = approvals_count + 1,
         streak = new_streak,
         best_streak = greatest(best_streak, new_streak),
         last_done_on = greatest(coalesce(last_done_on, d), d)
   where id = q.kid_id;

  if q.repeat <> 'none' then
    step := case q.repeat when 'daily' then interval '1 day' else interval '7 days' end;
    next_due := q.due_at + step;
    while next_due <= now() loop
      next_due := next_due + step;
    end loop;
    insert into public.quests (family_id, kid_id, title, category, size, gold, repeat, created_at, due_at)
      values (q.family_id, q.kid_id, q.title, q.category, q.size, q.gold, q.repeat, now(), next_due);
  end if;

  return q;
end;
$$;

create function public.buy_reward(reward_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  r public.rewards;
  m public.members;
  pid uuid;
begin
  select * into m from public.members where user_id = auth.uid() for update;
  if m.id is null or m.role <> 'kid' then
    raise exception 'not a kid';
  end if;
  select * into r from public.rewards where id = reward_id;
  if r.id is null or r.family_id <> m.family_id or not r.active then
    raise exception 'reward not available';
  end if;
  if m.wallet_points < r.price then
    raise exception 'not enough gold';
  end if;

  update public.members set wallet_points = wallet_points - r.price where id = m.id;
  insert into public.purchases (family_id, kid_id, reward_id, name, icon, price)
    values (m.family_id, m.id, r.id, r.name, r.icon, r.price)
    returning id into pid;
  return pid;
end;
$$;

create function public.deliver_purchase(purchase_id uuid)
returns public.purchases
language plpgsql security definer set search_path = ''
as $$
declare
  p public.purchases;
begin
  select * into p from public.purchases where id = purchase_id for update;
  if p.id is null or p.family_id is distinct from private.family_id() or not private.is_parent() then
    raise exception 'not a parent';
  end if;
  update public.purchases set status = 'delivered', delivered_at = coalesce(delivered_at, now())
   where id = purchase_id returning * into p;
  return p;
end;
$$;

create or replace function public.create_family(family_name text, parent_name text)
returns public.families
language plpgsql security definer set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  fam public.families;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'parents must sign in with email';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'already in a family';
  end if;

  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.families where invite_code = code);
  end loop;

  insert into public.families (name, invite_code) values (family_name, code) returning * into fam;
  insert into public.members (family_id, user_id, role, display_name)
    values (fam.id, auth.uid(), 'parent', parent_name);
  insert into public.rewards (family_id, name, icon, price) values
    (fam.id, 'Stay up 30 min', 'moon', 50),
    (fam.id, 'Pick dinner', 'pizza', 40),
    (fam.id, '30 min gaming', 'gamepad', 30),
    (fam.id, 'Ice cream', 'ice-cream', 25);
  return fam;
end;
$$;

revoke execute on function public.buy_reward(uuid), public.deliver_purchase(uuid) from public, anon;
grant execute on function public.buy_reward(uuid), public.deliver_purchase(uuid) to authenticated;
