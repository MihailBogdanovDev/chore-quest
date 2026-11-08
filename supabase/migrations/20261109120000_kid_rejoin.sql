-- Kids can leave a device and join again: the family code re-claims a hero that is
-- already bound to another (or a signed-out) device.

create or replace function public.family_kids(code text)
returns table (id uuid, display_name text, avatar text)
language sql stable security definer set search_path = ''
as $$
  select m.id, m.display_name, m.avatar
  from public.members m
  join public.families f on f.id = m.family_id
  where f.invite_code = upper(code) and m.role = 'kid'
  order by m.created_at
$$;

create or replace function public.join_family(code text, kid_id uuid)
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
  returning m.* into kid;
  if kid.id is null then
    raise exception 'invalid code or kid';
  end if;
  return kid;
end;
$$;
