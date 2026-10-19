alter table public.announcements add column if not exists body_hash text;
alter table public.announcements add column if not exists listing_state text not null default 'active';
alter table public.announcements drop constraint if exists announcements_listing_state_check;
alter table public.announcements
  add constraint announcements_listing_state_check check (listing_state in ('active', 'revised', 'cancelled'));

alter table public.job_positions add column if not exists max_height_male integer default 0;
alter table public.job_positions add column if not exists max_height_female integer default 0;
alter table public.job_positions add column if not exists min_weight integer default 0;
alter table public.job_positions add column if not exists max_weight integer default 0;

alter table public.profiles add column if not exists kpss_scores jsonb not null default '[]'::jsonb;
grant update (kpss_scores) on table public.profiles to authenticated;

create or replace function private.same_kpss_type(left_type text, right_type text)
returns boolean
language sql
immutable
as $$
  with folded as (
    select regexp_replace(lower(translate(coalesce(left_type, ''), 'İIŞĞÜÖÇıişğüöç', 'iisguociisguoc')), '\y(kpss|grubu|a)\y', '', 'g') as left_value,
           regexp_replace(lower(translate(coalesce(right_type, ''), 'İIŞĞÜÖÇıişğüöç', 'iisguociisguoc')), '\y(kpss|grubu|a)\y', '', 'g') as right_value
  )
  select coalesce(btrim(right_value), '') = ''
    or regexp_replace(left_value, '[^a-z0-9]', '', 'g') = regexp_replace(right_value, '[^a-z0-9]', '', 'g')
  from folded;
$$;

create or replace function private.profile_matches_position(
  u public.profiles,
  jp public.job_positions,
  a public.announcements
) returns boolean
language sql
stable
as $$
  select
    a.status = 'published'
    and coalesce(a.listing_state, 'active') <> 'cancelled'
    and a.application_end_date >= now()
    and (
      (
        private.same_education_level(u.primary_education_level, jp.education_level)
        and (
          jp.is_general_degree
          or coalesce(jp.allowed_departments, '{}') && coalesce(u.departments, '{}')
        )
      )
      or exists (
        select 1
        from jsonb_array_elements(coalesce(u.educations, '[]'::jsonb)) elem
        where private.same_education_level(elem->>'level', jp.education_level)
          and (
            jp.is_general_degree
            or (elem->>'department') = any(coalesce(jp.allowed_departments, '{}'))
          )
      )
    )
    and (
      jp.requires_kpss = false
      or (
        u.has_kpss = true
        and (
          (
            private.same_kpss_type(u.kpss_type, jp.kpss_type)
            and coalesce(u.kpss_score, 0) >= coalesce(jp.min_kpss_score, 0)
          )
          or exists (
            select 1
            from jsonb_array_elements(coalesce(u.kpss_scores, '[]'::jsonb)) score
            where private.same_kpss_type(score->>'type', jp.kpss_type)
              and coalesce((score->>'score')::numeric, 0) >= coalesce(jp.min_kpss_score, 0)
          )
        )
      )
    )
    and coalesce(u.yds_score, 0) >= coalesce(jp.min_yds_score, 0)
    and (u.age is null or (u.age >= coalesce(jp.min_age, 18) and u.age <= coalesce(jp.max_age, 99)))
    and (u.gender is null or u.gender = any(coalesce(jp.allowed_genders, array['Erkek', 'Kadın'])))
    and (
      coalesce(jp.min_height_male, 0) = 0 and coalesce(jp.min_height_female, 0) = 0
      and coalesce(jp.max_height_male, 0) = 0 and coalesce(jp.max_height_female, 0) = 0
      or (
        u.height is not null
        and (
          u.gender is distinct from 'Erkek'
          or (
            u.height >= coalesce(jp.min_height_male, 0)
            and (coalesce(jp.max_height_male, 0) = 0 or u.height <= jp.max_height_male)
          )
        )
        and (
          u.gender is distinct from 'Kadın'
          or (
            u.height >= coalesce(jp.min_height_female, 0)
            and (coalesce(jp.max_height_female, 0) = 0 or u.height <= jp.max_height_female)
          )
        )
      )
    )
    and (
      coalesce(jp.min_weight, 0) = 0 and coalesce(jp.max_weight, 0) = 0
      or (
        u.weight is not null
        and (coalesce(jp.min_weight, 0) = 0 or u.weight >= jp.min_weight)
        and (coalesce(jp.max_weight, 0) = 0 or u.weight <= jp.max_weight)
      )
    )
    and coalesce(jp.required_licenses, '{}') <@ coalesce(u.driver_licenses, '{}')
    and (jp.requires_security_card = false or u.has_security_card = true)
    and (jp.requires_disability = false or u.is_disabled = true)
    and coalesce(u.sgk_prim_days, 0) >= coalesce(jp.min_sgk_days, 0)
    and coalesce(jp.required_certificates, '{}') <@ coalesce(u.certificates, '{}')
    and (
      coalesce(cardinality(jp.cities), 0) = 0
      or 'Tüm Türkiye' = any(jp.cities)
      or u.city is null
      or u.city = any(jp.cities)
    );
$$;

drop function if exists public.get_position_detail(uuid, uuid);

create function public.get_position_detail(p_user_id uuid, p_position_id uuid)
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
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;
  select * into u from public.profiles where id = p_user_id;
  return query
  select
    jp.id, a.id, a.institution_name, a.title, jp.position_title, jp.quota, jp.cities,
    jp.education_level,
    case when coalesce(u.is_premium, false) then jp.is_general_degree else false end,
    case when coalesce(u.is_premium, false) then jp.allowed_departments else '{}'::text[] end,
    jp.requires_kpss,
    case when coalesce(u.is_premium, false) then jp.kpss_type else null end,
    case when coalesce(u.is_premium, false) then jp.min_kpss_score else 0 end,
    case when coalesce(u.is_premium, false) then jp.min_yds_score else 0 end,
    jp.min_age, jp.max_age, jp.allowed_genders, jp.min_height_male, jp.min_height_female,
    case when coalesce(u.is_premium, false) then jp.required_licenses else '{}'::text[] end,
    case when coalesce(u.is_premium, false) then jp.requires_security_card else false end,
    case when coalesce(u.is_premium, false) then jp.requires_disability else false end,
    case when coalesce(u.is_premium, false) then jp.min_sgk_days else 0 end,
    case when coalesce(u.is_premium, false) then jp.required_certificates else '{}'::text[] end,
    case when coalesce(u.is_premium, false) then jp.raw_requirements_text else null end,
    a.application_start_date, a.application_end_date, a.source_url, a.source_name, a.status, jp.created_at,
    coalesce(jp.max_height_male, 0), coalesce(jp.max_height_female, 0), coalesce(jp.min_weight, 0), coalesce(jp.max_weight, 0)
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  where jp.id = p_position_id
    and a.status in ('published', 'archived');
end;
$$;

grant execute on function public.get_position_detail(uuid, uuid) to authenticated, service_role;
