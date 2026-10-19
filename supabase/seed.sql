-- İsteğe bağlı örnek kayıtlar. Canlı kazıyıcı çalışınca gerçek ilanlar bunların yanına eklenir.
insert into public.announcements (institution_name, title, source_name, source_url, application_start_date, application_end_date, status)
values
  ('Örnek Belediye', 'Bilgi işlem personeli', 'ornek', 'https://example.com/kpss-ornek-1', now() - interval '2 days', now() + interval '20 hours', 'published'),
  ('Örnek Üniversite', 'İdari personel', 'ornek', 'https://example.com/kpss-ornek-2', now() - interval '5 days', now() + interval '12 days', 'published')
on conflict (source_url) do nothing;

insert into public.job_positions (
  announcement_id, position_title, quota, cities, education_level, is_general_degree,
  allowed_departments, requires_kpss, kpss_type, min_kpss_score, raw_requirements_text
)
select id, 'Yazılım Mühendisi', 3, array['İstanbul','Ankara'], 'Lisans', false,
  array['Yazılım Mühendisliği','Bilgisayar Mühendisliği'], true, 'P3', 70, 'Örnek kadro. Resmi ilan değildir.'
from public.announcements where source_url = 'https://example.com/kpss-ornek-1'
and not exists (
  select 1 from public.job_positions jp
  join public.announcements a on a.id = jp.announcement_id
  where a.source_url = 'https://example.com/kpss-ornek-1'
);

insert into public.base_scores (year, institution_name, position_title, department, kpss_type, min_score, source_note)
select 2024, 'Merkezi atama', 'Memur', 'İşletme', 'P3', 91.1500, 'Örnek arşiv — resmi tabloyla değiştirin'
where not exists (select 1 from public.base_scores);

insert into public.local_courses (city, provider, title, detail)
select 'İstanbul', 'İSMEK', 'Bilgisayar İşletmenliği', 'Örnek kurs rehberi'
where not exists (select 1 from public.local_courses);
