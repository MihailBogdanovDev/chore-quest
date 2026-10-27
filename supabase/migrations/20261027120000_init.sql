-- Chore Quest v0.1 schema. Spec: docs/superpowers/specs/2026-10-27-chore-quest-design.md §6.
-- Reads go through RLS; every write with rules goes through a security definer RPC below.

create type public.member_role as enum ('parent', 'kid');
create type public.quest_category as enum ('dishes', 'trash', 'room', 'laundry', 'pets', 'homework', 'other');
create type public.quest_size as enum ('S', 'M', 'L');
create type public.quest_status as enum ('open', 'claimed', 'done');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  -- One membership per auth user; null until a kid device joins.
  user_id uuid unique references auth.users (id) on delete set null,
  role public.member_role not null,
  display_name text not null check (char_length(display_name) between 1 and 30),
  avatar text not null default 'knight',
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  wallet_points integer not null default 0 check (wallet_points >= 0),
  created_at timestamptz not null default now(),
  unique (id, family_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  kid_id uuid not null,
  title text not null check (char_length(title) between 1 and 80),
  category public.quest_category not null,
  size public.quest_size not null,
  created_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '24 hours',
  status public.quest_status not null default 'open',
  claimed_at timestamptz,
  approved_at timestamptz,
  proof_path text,
  points_awarded integer,
  -- A quest's kid always belongs to the quest's family.
  foreign key (kid_id, family_id) references public.members (id, family_id) on delete cascade
);

create index quests_family_idx on public.quests (family_id);
create index quests_kid_idx on public.quests (kid_id);

-- ---------------------------------------------------------------------------
-- Helpers (not exposed through the API)

create schema if not exists private;

create function private.family_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select family_id from public.members where user_id = auth.uid()
$$;

create function private.member_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.members where user_id = auth.uid()
$$;

create function private.is_parent() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select role = 'parent' from public.members where user_id = auth.uid()), false)
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

-- Same rule and integer math as src/core/points.ts (spec §3.2).
create function public.quest_points(size public.quest_size, due_at timestamptz, at timestamptz)
returns integer
language sql immutable set search_path = ''
as $$
  with b as (
    select case size when 'S' then 10 when 'M' then 25 else 60 end as base,
           extract(epoch from (at - due_at)) * 1000 as late_ms
  )
  select floor(
    base * greatest(25, 100 - 10 * (case when late_ms <= 0 then 0 else ceil(late_ms / 43200000.0) end)) / 100.0
  )::integer
  from b
$$;

-- ---------------------------------------------------------------------------
-- Row level security

alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.quests enable row level security;

revoke all on public.families, public.members, public.quests from anon, authenticated;
grant select on public.families, public.members, public.quests to authenticated;
grant insert (family_id, kid_id, title, category, size, due_at) on public.quests to authenticated;
grant delete on public.quests to authenticated;

create policy "family reads own family" on public.families
  for select to authenticated using (id = (select private.family_id()));

create policy "family reads own members" on public.members
  for select to authenticated using (family_id = (select private.family_id()));

create policy "family reads own quests" on public.quests
  for select to authenticated using (family_id = (select private.family_id()));

create policy "parents post quests" on public.quests
  for insert to authenticated
  with check (family_id = (select private.family_id()) and (select private.is_parent()));

create policy "parents delete quests" on public.quests
  for delete to authenticated
  using (family_id = (select private.family_id()) and (select private.is_parent()));

-- ---------------------------------------------------------------------------
-- RPCs

create function public.create_family(family_name text, parent_name text)
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
  return fam;
end;
$$;

create function public.add_kid(kid_name text, kid_avatar text)
returns public.members
language plpgsql security definer set search_path = ''
as $$
declare
  kid public.members;
begin
  if not private.is_parent() then
    raise exception 'not a parent';
  end if;
  insert into public.members (family_id, role, display_name, avatar)
    values (private.family_id(), 'kid', kid_name, kid_avatar)
    returning * into kid;
  return kid;
end;
$$;

create function public.family_kids(code text)
returns table (id uuid, display_name text, avatar text)
language sql stable security definer set search_path = ''
as $$
  select m.id, m.display_name, m.avatar
  from public.members m
  join public.families f on f.id = m.family_id
  where f.invite_code = upper(code) and m.role = 'kid' and m.user_id is null
  order by m.created_at
$$;

create function public.join_family(code text, kid_id uuid)
returns public.members
language plpgsql security definer set search_path = ''
as $$
declare
  kid public.members;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'already in a family';
  end if;
  update public.members m
     set user_id = auth.uid()
    from public.families f
   where m.id = join_family.kid_id
     and f.id = m.family_id
     and f.invite_code = upper(code)
     and m.role = 'kid'
     and m.user_id is null
  returning m.* into kid;
  if kid.id is null then
    raise exception 'invalid code or kid';
  end if;
  return kid;
end;
$$;

create function public.claim_quest(quest_id uuid)
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

create function public.review_claim(quest_id uuid, approve boolean)
returns public.quests
language plpgsql security definer set search_path = ''
as $$
declare
  q public.quests;
  pts integer;
begin
  select * into q from public.quests where id = quest_id for update;
  if q.id is null or q.family_id is distinct from private.family_id() or not private.is_parent() then
    raise exception 'not a parent';
  end if;
  if q.status <> 'claimed' then
    raise exception 'quest not claimed';
  end if;

  if approve then
    pts := public.quest_points(q.size, q.due_at, q.claimed_at);
    update public.quests
       set status = 'done', approved_at = now(), points_awarded = pts
     where id = quest_id returning * into q;
    update public.members
       set lifetime_points = lifetime_points + pts, wallet_points = wallet_points + pts
     where id = q.kid_id;
  else
    update public.quests set status = 'open', claimed_at = null
     where id = quest_id returning * into q;
  end if;
  return q;
end;
$$;

revoke execute on function
  public.create_family(text, text),
  public.add_kid(text, text),
  public.family_kids(text),
  public.join_family(text, uuid),
  public.claim_quest(uuid),
  public.review_claim(uuid, boolean),
  public.quest_points(public.quest_size, timestamptz, timestamptz)
from public, anon;

grant execute on function
  public.create_family(text, text),
  public.add_kid(text, text),
  public.family_kids(text),
  public.join_family(text, uuid),
  public.claim_quest(uuid),
  public.review_claim(uuid, boolean),
  public.quest_points(public.quest_size, timestamptz, timestamptz)
to authenticated;
