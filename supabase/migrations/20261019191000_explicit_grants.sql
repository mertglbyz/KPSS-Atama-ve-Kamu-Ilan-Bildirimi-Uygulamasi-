-- İlk şema çalıştıktan sonra bir kez çalıştırın.
-- Yeni tabloların otomatik açılması kapalı olduğu için eksik tablo yetkilerini verir.

grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_job_interactions to authenticated;
grant select, update on table public.notifications to authenticated;
grant select, insert on table public.support_messages to authenticated;
grant select on table public.scraper_runs to authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.user_job_interactions to service_role;
grant select, insert, update, delete on table public.support_messages to service_role;
