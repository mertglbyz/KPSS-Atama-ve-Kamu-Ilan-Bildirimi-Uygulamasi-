-- Aynı ilanın birden fazla resmi sitede çıkmasını tek kayıtta tutar.
alter table public.announcements
  add column if not exists content_fingerprint text,
  add column if not exists also_listed_on jsonb not null default '[]'::jsonb;

create index if not exists announcements_fingerprint_idx
  on public.announcements (content_fingerprint);
