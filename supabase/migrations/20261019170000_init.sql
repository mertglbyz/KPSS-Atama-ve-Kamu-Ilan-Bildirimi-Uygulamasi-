-- KPSS Atama şeması. Supabase SQL Editor'da bir kez çalıştırın
-- veya `supabase db push` ile uygulayın.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- 1. Profiller
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  age integer,
  height integer,
  weight integer,
  gender text check (gender in ('Erkek', 'Kadın')),
  city text,
  primary_education_level text check (primary_education_level in ('Lise', 'Ortaöğretim', 'Önlisans', 'Lisans')),
  departments text[] default '{}',
  educations jsonb default '[]'::jsonb,
  has_kpss boolean default false,
  kpss_type text default 'P3',
  kpss_score numeric(6,4) default 0,
  yds_score numeric(5,2) default 0,
  ales_score numeric(6,4) default 0,
  driver_licenses text[] default '{}',
  is_disabled boolean default false,
  has_security_card boolean default false,
  security_card_type text check (security_card_type in ('Yok', 'Silahsız', 'Silahlı')) default 'Yok',
  is_student boolean default false,
  has_sgk_history boolean default false,
  sgk_prim_days integer default 0,
  certificates text[] default '{}',
  is_premium boolean default false,
  subscription_plan text check (subscription_plan in ('free', 'monthly', 'quarterly', 'yearly')) default 'free',
  subscription_expires_at timestamptz,
  expo_push_token text,
  onboarding_completed boolean default false,
  notify_new_jobs boolean default true,
  notify_deadline boolean default true,
  notify_results boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  institution_name text not null,
  title text not null,
  source_name text,
  source_url text unique,
  pdf_url text,
  application_start_date timestamptz,
  application_end_date timestamptz not null,
  status text check (status in ('draft', 'published', 'archived')) default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.job_positions (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  position_title text not null,
  quota integer default 1,
  cities text[] default '{}',
  education_level text check (education_level in ('Lise', 'Ortaöğretim', 'Önlisans', 'Lisans')) not null,
  is_general_degree boolean default false,
  allowed_departments text[] default '{}',
  requires_kpss boolean default true,
  kpss_type text,
  min_kpss_score numeric(6,4) default 0,
  min_yds_score numeric(5,2) default 0,
  min_age integer default 18,
  max_age integer default 99,
  allowed_genders text[] default array['Erkek', 'Kadın'],
  min_height_male integer default 0,
  min_height_female integer default 0,
  required_licenses text[] default '{}',
  requires_security_card boolean default false,
  requires_disability boolean default false,
  min_sgk_days integer default 0,
  required_certificates text[] default '{}',
  raw_requirements_text text,
  created_at timestamptz default now()
);

create table if not exists public.user_job_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  job_position_id uuid references public.job_positions(id) on delete cascade,
  is_hidden boolean default false,
  is_saved boolean default false,
  application_status text check (application_status in ('none', 'applied', 'accepted', 'rejected')) default 'none',
  unique (user_id, job_position_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind text check (kind in ('new_job', 'deadline', 'result', 'system')) default 'system',
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now(),
  dedupe_key text,
  unique (user_id, dedupe_key)
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  sender text check (sender in ('user', 'support')) default 'user',
  created_at timestamptz default now()
);

create table if not exists public.scraper_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text check (status in ('running', 'success', 'error')) default 'running',
  source_counts jsonb default '{}'::jsonb,
  message text
);

create table if not exists public.base_scores (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  institution_name text not null,
  position_title text not null,
  department text,
  kpss_type text,
  min_score numeric(6,4) not null,
  source_note text
);

create table if not exists public.local_courses (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  provider text not null,
  title text not null,
  detail text
);

create index if not exists profiles_departments_gin on public.profiles using gin (departments);
create index if not exists announcements_status_end_idx on public.announcements (status, application_end_date);
create index if not exists job_positions_announcement_idx on public.job_positions (announcement_id);

create or replace function private.same_education_level(a text, b text)
returns boolean
language sql
immutable
as $$
  select case when a in ('Lise', 'Ortaöğretim') then 'Ortaöğretim' else a end
       = case when b in ('Lise', 'Ortaöğretim') then 'Ortaöğretim' else b end;
$$;

-- Eşleştirme kuralları tek yerde durur.
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
        and coalesce(u.kpss_score, 0) >= coalesce(jp.min_kpss_score, 0)
        and (jp.kpss_type is null or jp.kpss_type = '' or u.kpss_type = jp.kpss_type)
      )
    )
    and coalesce(u.yds_score, 0) >= coalesce(jp.min_yds_score, 0)
    and (u.age is null or (u.age >= coalesce(jp.min_age, 18) and u.age <= coalesce(jp.max_age, 99)))
    and (u.gender is null or u.gender = any(coalesce(jp.allowed_genders, array['Erkek', 'Kadın'])))
    and (
      u.height is null
      or u.gender is null
      or (u.gender = 'Erkek' and u.height >= coalesce(jp.min_height_male, 0))
      or (u.gender = 'Kadın' and u.height >= coalesce(jp.min_height_female, 0))
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_match_summary(p_user_id uuid)
returns table (
  total_positions bigint,
  institution_count bigint,
  expiring_48h bigint,
  new_today bigint,
  last_success_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  u public.profiles%rowtype;
begin
  if auth.uid() is distinct from p_user_id and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  select * into u from public.profiles where id = p_user_id;
  if not found then
    return query
    select 0::bigint, 0::bigint, 0::bigint, 0::bigint,
      (select finished_at from public.scraper_runs where status = 'success' order by finished_at desc limit 1);
    return;
  end if;
  return query
  select
    count(*)::bigint,
    count(distinct a.institution_name)::bigint,
    count(*) filter (where a.application_end_date <= now() + interval '48 hours')::bigint,
    count(*) filter (where jp.created_at::date = now()::date)::bigint,
    (select finished_at from public.scraper_runs where status = 'success' order by finished_at desc limit 1)
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  left join public.user_job_interactions uji
    on uji.job_position_id = jp.id and uji.user_id = p_user_id
  where coalesce(uji.is_hidden, false) = false
    and private.profile_matches_position(u, jp, a);
end;
$$;

create or replace function public.get_matched_positions(p_user_id uuid)
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
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  u public.profiles%rowtype;
begin
  if auth.uid() is distinct from p_user_id and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  select * into u from public.profiles where id = p_user_id;
  if coalesce(u.is_premium, false) = false then
    return;
  end if;
  return query
  select
    jp.id, a.id, a.institution_name, a.title, jp.position_title, jp.quota, jp.cities,
    jp.education_level, jp.is_general_degree, jp.allowed_departments, jp.requires_kpss,
    jp.kpss_type, jp.min_kpss_score, jp.min_yds_score, jp.min_age, jp.max_age,
    jp.allowed_genders, jp.min_height_male, jp.min_height_female, jp.required_licenses,
    jp.requires_security_card, jp.requires_disability, jp.min_sgk_days, jp.required_certificates,
    jp.raw_requirements_text, a.application_start_date, a.application_end_date,
    a.source_url, a.source_name, a.status, jp.created_at
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  left join public.user_job_interactions uji
    on uji.job_position_id = jp.id and uji.user_id = p_user_id
  where coalesce(uji.is_hidden, false) = false
    and private.profile_matches_position(u, jp, a)
  order by a.application_end_date asc;
end;
$$;

create or replace function public.list_job_cards()
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
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    jp.id, a.id, a.institution_name, a.title, jp.position_title, jp.quota, jp.cities,
    jp.education_level, a.application_start_date, a.application_end_date,
    a.source_name, a.source_url, a.status, a.created_at
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  where a.status in ('published', 'archived')
  order by a.application_end_date desc;
$$;

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
  created_at timestamptz
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
    a.application_start_date, a.application_end_date, a.source_url, a.source_name, a.status, jp.created_at
  from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  where jp.id = p_position_id
    and a.status in ('published', 'archived');
end;
$$;

create or replace function public.get_competitor_rank(p_user_id uuid, p_department text)
returns table (
  total_candidates bigint,
  user_rank bigint,
  user_score numeric,
  unlocked boolean
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
  with ranked as (
    select
      id,
      kpss_score,
      rank() over (order by kpss_score desc) as rnk,
      count(*) over () as total_cnt
    from public.profiles
    where p_department = any(departments)
      and has_kpss = true
      and kpss_score > 0
  )
  select
    coalesce((select total_cnt from ranked limit 1), 0),
    case when coalesce(u.is_premium, false) then (select rnk from ranked where id = p_user_id) else null end,
    coalesce(u.kpss_score, 0),
    coalesce(u.is_premium, false);
end;
$$;

create or replace function public.get_score_distribution(p_user_id uuid, p_department text)
returns table (label text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  premium boolean;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;
  select is_premium into premium from public.profiles where id = p_user_id;
  if coalesce(premium, false) = false then
    return;
  end if;
  return query
  select bucket.label, count(p.id)::bigint
  from (
    values ('0-50', 0::numeric, 50::numeric),
           ('50-60', 50, 60),
           ('60-70', 60, 70),
           ('70-80', 70, 80),
           ('80-90', 80, 90),
           ('90+', 90, 101)
  ) as bucket(label, low, high)
  left join public.profiles p
    on p.has_kpss = true
   and p.kpss_score > 0
   and p_department = any(p.departments)
   and p.kpss_score >= bucket.low
   and p.kpss_score < bucket.high
  group by bucket.label, bucket.low
  order by bucket.low;
end;
$$;

create or replace function public.list_base_scores(p_user_id uuid)
returns setof public.base_scores
language plpgsql
security definer
set search_path = public
as $$
declare
  premium boolean;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;
  select is_premium into premium from public.profiles where id = p_user_id;
  if coalesce(premium, false) then
    return query select * from public.base_scores order by year desc, min_score desc;
  else
    return query select * from public.base_scores order by year desc, min_score desc limit 3;
  end if;
end;
$$;

create or replace function public.list_courses(p_city text)
returns setof public.local_courses
language sql
security definer
set search_path = public
as $$
  select * from public.local_courses
  where p_city is null or p_city = '' or city = p_city
  order by provider, title;
$$;

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
    )
    and private.profile_matches_position(u, jp, a)
    and not exists (
      select 1 from public.user_job_interactions uji
      where uji.user_id = u.id and uji.job_position_id = jp.id and uji.is_hidden = true
    );
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.get_match_summary(uuid) from public, anon;
revoke all on function public.get_matched_positions(uuid) from public, anon;
revoke all on function public.list_job_cards() from public, anon;
revoke all on function public.get_position_detail(uuid, uuid) from public, anon;
revoke all on function public.get_competitor_rank(uuid, text) from public, anon;
revoke all on function public.get_score_distribution(uuid, text) from public, anon;
revoke all on function public.list_base_scores(uuid) from public, anon;
revoke all on function public.list_courses(text) from public, anon;
revoke all on function public.users_to_notify_for_position(uuid, text) from public, anon, authenticated;

grant execute on function public.get_match_summary(uuid) to authenticated, service_role;
grant execute on function public.get_matched_positions(uuid) to authenticated, service_role;
grant execute on function public.list_job_cards() to authenticated, service_role;
grant execute on function public.get_position_detail(uuid, uuid) to authenticated, service_role;
grant execute on function public.get_competitor_rank(uuid, text) to authenticated, service_role;
grant execute on function public.get_score_distribution(uuid, text) to authenticated, service_role;
grant execute on function public.list_base_scores(uuid) to authenticated, service_role;
grant execute on function public.list_courses(text) to authenticated, service_role;
grant execute on function public.users_to_notify_for_position(uuid, text) to service_role;

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.job_positions enable row level security;
alter table public.user_job_interactions enable row level security;
alter table public.notifications enable row level security;
alter table public.support_messages enable row level security;
alter table public.scraper_runs enable row level security;
alter table public.base_scores enable row level security;
alter table public.local_courses enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (
  nickname, age, height, weight, gender, city,
  primary_education_level, departments, educations,
  has_kpss, kpss_type, kpss_score, yds_score, ales_score,
  driver_licenses, is_disabled, has_security_card, security_card_type,
  is_student, has_sgk_history, sgk_prim_days, certificates,
  expo_push_token, onboarding_completed,
  notify_new_jobs, notify_deadline, notify_results, updated_at
) on public.profiles to authenticated;

revoke all on public.announcements from anon, authenticated;
revoke all on public.job_positions from anon, authenticated;
grant select, insert, update, delete on public.announcements to service_role;
grant select, insert, update, delete on public.job_positions to service_role;

drop policy if exists interactions_own on public.user_job_interactions;
create policy interactions_own on public.user_job_interactions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists messages_own on public.support_messages;
create policy messages_own on public.support_messages for select to authenticated using (user_id = auth.uid());
drop policy if exists messages_insert_own on public.support_messages;
create policy messages_insert_own on public.support_messages for insert to authenticated with check (user_id = auth.uid() and sender = 'user');

drop policy if exists scraper_runs_read on public.scraper_runs;
create policy scraper_runs_read on public.scraper_runs for select to authenticated using (true);

grant select, insert, update, delete on public.notifications to service_role;
grant select, insert, update, delete on public.scraper_runs to service_role;
grant select, insert, update, delete on public.base_scores to service_role;
grant select, insert, update, delete on public.local_courses to service_role;
