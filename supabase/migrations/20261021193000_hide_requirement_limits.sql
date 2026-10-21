create or replace function public.get_position_detail(p_user_id uuid, p_position_id uuid)
returns table (
  position_id uuid,
  announcement_id uuid,
  institution_name text,
  announcement_title text,
  position_title text,
  quota integer,
  cities text[],
  education_level text,
  is_general_degree boolean,
  allowed_departments text[],
  requires_kpss boolean,
  kpss_type text,
  min_kpss_score numeric,
  min_yds_score numeric,
  min_age integer,
  max_age integer,
  allowed_genders text[],
  min_height_male integer,
  min_height_female integer,
  required_licenses text[],
  requires_security_card boolean,
  requires_disability boolean,
  min_sgk_days integer,
  required_certificates text[],
  raw_requirements_text text,
  application_start_date timestamptz,
  application_end_date timestamptz,
  source_url text,
  source_name text,
  status text,
  created_at timestamptz,
  max_height_male integer,
  max_height_female integer,
  min_weight integer,
  max_weight integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.profiles%rowtype;
  premium boolean;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;
  select * into u from public.profiles where id = p_user_id;
  premium := coalesce(u.is_premium, false);
  return query
  select
    jp.id, a.id, a.institution_name, a.title, jp.position_title, jp.quota, jp.cities,
    jp.education_level,
    case when premium then jp.is_general_degree else false end,
    case when premium then jp.allowed_departments else '{}'::text[] end,
    jp.requires_kpss,
    case when premium then jp.kpss_type else null end,
    case when premium then jp.min_kpss_score else 0 end,
    case when premium then jp.min_yds_score else 0 end,
    case when premium then jp.min_age else 18 end,
    case when premium then jp.max_age else 99 end,
    case when premium then jp.allowed_genders else array['Erkek', 'Kadın']::text[] end,
    case when premium then jp.min_height_male else 0 end,
    case when premium then jp.min_height_female else 0 end,
    case when premium then jp.required_licenses else '{}'::text[] end,
    case when premium then jp.requires_security_card else false end,
    case when premium then jp.requires_disability else false end,
    case when premium then jp.min_sgk_days else 0 end,
    case when premium then jp.required_certificates else '{}'::text[] end,
    case when premium then jp.raw_requirements_text else null end,
    a.application_start_date, a.application_end_date, a.source_url, a.source_name, a.status, jp.created_at,
    case when premium then coalesce(jp.max_height_male, 0) else 0 end,
    case when premium then coalesce(jp.max_height_female, 0) else 0 end,
    case when premium then coalesce(jp.min_weight, 0) else 0 end,
    case when premium then coalesce(jp.max_weight, 0) else 0 end
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  where jp.id = p_position_id
    and a.status in ('published', 'archived');
end;
$$;

grant execute on function public.get_position_detail(uuid, uuid) to authenticated, service_role;
