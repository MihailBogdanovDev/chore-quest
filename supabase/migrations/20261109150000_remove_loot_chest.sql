-- No more loot chests: random rewards for kids felt too close to gambling.
-- Approval pays exactly the quest's gold. quests.chest_gold stays for past approvals.

create or replace function public.review_claim(quest_id uuid, approve boolean)
returns public.quests
language plpgsql security definer set search_path = ''
as $$
declare
  q public.quests;
  m public.members;
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
     set status = 'done', approved_at = now(), points_awarded = q.gold
   where id = quest_id returning * into q;

  update public.members
     set lifetime_points = lifetime_points + q.gold,
         wallet_points = wallet_points + q.gold,
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
