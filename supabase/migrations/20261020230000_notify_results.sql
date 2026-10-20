create or replace function public.users_to_notify_for_position(p_position_id uuid, p_kind text)
returns table (user_id uuid, expo_push_token text, nickname text)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  return query
  select u.id, u.expo_push_token, u.nickname
  from public.profiles u
  join public.job_positions jp on jp.id = p_position_id
  join public.announcements a on a.id = jp.announcement_id
  where u.is_premium = true
    and u.expo_push_token is not null
    and (
      (p_kind = 'new_job' and u.notify_new_jobs = true)
      or (p_kind = 'deadline' and u.notify_deadline = true)
      or (p_kind = 'result' and u.notify_results = true)
    )
    and private.profile_matches_position(u, jp, a)
    and not exists (
      select 1 from public.user_job_interactions uji
      where uji.user_id = u.id and uji.job_position_id = jp.id and uji.is_hidden = true
    );
end;
$$;
