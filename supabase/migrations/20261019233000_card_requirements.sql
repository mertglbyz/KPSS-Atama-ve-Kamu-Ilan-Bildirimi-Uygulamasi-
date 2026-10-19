drop function if exists public.list_job_cards();

create function public.list_job_cards()
returns table (
  position_id uuid,
  announcement_id uuid,
  institution_name text,
  announcement_title text,
  position_title text,
  quota integer,
  cities text[],
  education_level text,
  application_start_date timestamptz,
  application_end_date timestamptz,
  source_name text,
  source_url text,
  status text,
  created_at timestamptz,
  requires_kpss boolean,
  kpss_type text,
  min_kpss_score numeric
)
language sql
security definer
set search_path = public
as $$
  select
    jp.id, a.id, a.institution_name, a.title, jp.position_title, jp.quota, jp.cities,
    jp.education_level, a.application_start_date, a.application_end_date,
    a.source_name, a.source_url, a.status, a.created_at,
    jp.requires_kpss, jp.kpss_type, jp.min_kpss_score
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  where a.status in ('published', 'archived')
  order by a.application_end_date desc;
$$;

grant execute on function public.list_job_cards() to authenticated, service_role;
