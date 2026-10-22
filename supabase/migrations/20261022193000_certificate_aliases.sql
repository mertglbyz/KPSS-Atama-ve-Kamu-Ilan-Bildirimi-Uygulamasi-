create or replace function private.certificate_key(value text)
returns text
language sql
immutable
as $$
  with folded as (
    select regexp_replace(
      lower(translate(coalesce(value, ''), 'İIŞĞÜÖÇıişğüöç', 'iisguociisguoc')),
      '[^a-z0-9]+',
      ' ',
      'g'
    ) as folded_text
  )
  select case
    when folded_text ~ '(^| )bilgisayar isletmen($| )' then 'bilgisayar isletmenligi'
    when folded_text ~ 'bilgisayar operator' then 'bilgisayar operatorlugu'
    when folded_text ~ '(^| )daktilo($| )|daktilografi' then 'daktilografi'
    when folded_text ~ 'kalorifer atesci' then 'kalorifer atesciligi'
    when folded_text ~ '(^| )kaynakci($| )|kaynakcilik' then 'kaynakcilik'
    when folded_text ~ 'pastacilik|(^| )pastaci($| )' then 'pastacilik'
    when folded_text ~ 'ascilik|(^| )asci belgesi($| )' then 'ascilik'
    when folded_text ~ 'elektrik tesisat' then 'elektrik tesisatciligi'
    when folded_text ~ 'sihhi tesisat' then 'sihhi tesisatcilik'
    when folded_text ~ '(^| )src ?5($| )' then 'src5'
    when folded_text ~ '(^| )src ?4($| )' then 'src4'
    when folded_text ~ '(^| )src ?3($| )' then 'src3'
    when folded_text ~ '(^| )src ?2($| )' then 'src2'
    when folded_text ~ '(^| )src ?1($| )' then 'src1'
    when folded_text ~ 'psikoteknik' then 'psikoteknik'
    when folded_text ~ '(^| )adr($| )|tehlikeli madde' then 'adr'
    when folded_text ~ 'is makinesi operator|operator belgesi' then 'is makinesi operatorlugu'
    when folded_text ~ 'ilk yardim' then 'ilk yardim'
    when folded_text ~ 'hijyen' then 'hijyen egitimi'
    when folded_text ~ 'is guvenligi uzmanligi a|(^| )a sinifi is guvenligi' then 'is guvenligi a'
    when folded_text ~ 'is guvenligi uzmanligi b|(^| )b sinifi is guvenligi' then 'is guvenligi b'
    when folded_text ~ 'is guvenligi uzmanligi c|(^| )c sinifi is guvenligi' then 'is guvenligi c'
    when folded_text ~ 'mesleki yeterlilik|(^| )myk($| )' then 'myk'
    when folded_text ~ 'pedagojik formasyon' then 'pedagojik formasyon'
    when folded_text ~ 'hafizlik|(^| )hafiz($| )' then 'hafizlik'
    else btrim(folded_text)
  end
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
    and not exists (
      select 1
      from unnest(coalesce(jp.required_certificates, '{}')) required_name
      where not exists (
        select 1
        from unnest(coalesce(u.certificates, '{}')) owned_name
        where private.certificate_key(owned_name) = private.certificate_key(required_name)
      )
    )
    and (
      coalesce(cardinality(jp.cities), 0) = 0
      or 'Tüm Türkiye' = any(jp.cities)
      or u.city is null
      or u.city = any(jp.cities)
    );
$$;
