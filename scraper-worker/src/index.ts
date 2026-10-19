import { createClient } from '@supabase/supabase-js';
import { parseAnnouncement } from './gemini';
import { discoverHtmlSources, discoverIlanGov, downloadPdf } from './sources';
import type { DiscoveredAd, ParsedPosition } from './types';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const counts: Record<string, number> = {};
const notes: string[] = [];

async function notify(positionId: string, kind: 'new_job' | 'deadline', body: string) {
  const { data, error } = await supabase.rpc('users_to_notify_for_position', {
    p_position_id: positionId,
    p_kind: kind,
  });
  if (error || !data?.length) return;
  const messages = data.map((candidate: { expo_push_token: string }) => ({
    to: candidate.expo_push_token,
    title: kind === 'deadline' ? 'Son 48 saat' : 'Yeni uygun ilan',
    body,
    data: { positionId },
  }));
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  await supabase.from('notifications').upsert(
    data.map((candidate: { user_id: string }) => ({
      user_id: candidate.user_id,
      title: kind === 'deadline' ? 'Son 48 saat' : 'Yeni uygun ilan',
      body,
      kind,
      dedupe_key: `${kind}:${positionId}:${candidate.user_id}`,
    })),
    { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
  );
}

function futureDate(value: string | undefined, fallbackDays: number) {
  const parsed = value ? new Date(value) : new Date(Date.now() + fallbackDays * 864e5);
  if (Number.isNaN(parsed.getTime())) return new Date(Date.now() + fallbackDays * 864e5).toISOString();
  return parsed.toISOString();
}

async function saveAd(ad: DiscoveredAd) {
  const { data: existing } = await supabase.from('announcements').select('id').eq('source_url', ad.sourceUrl).maybeSingle();
  if (existing) return;
  if (!process.env.GEMINI_API_KEY) {
    notes.push('GEMINI_API_KEY yok, ayrıştırma atlandı.');
    return;
  }
  const pdf = ad.pdfUrl ? await downloadPdf(ad.pdfUrl) : undefined;
  const parsed = await parseAnnouncement(`${ad.institutionName}\n${ad.title}\n${ad.text}`, pdf);
  const positions = parsed.positions ?? [];
  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      institution_name: parsed.institution_name || ad.institutionName,
      title: ad.title,
      source_name: ad.sourceName,
      source_url: ad.sourceUrl,
      pdf_url: ad.pdfUrl ?? null,
      application_start_date: parsed.application_start_date ? futureDate(parsed.application_start_date, 0) : null,
      application_end_date: futureDate(parsed.application_end_date, 14),
      status: positions.length ? 'published' : 'draft',
    })
    .select('id')
    .single();
  if (error || !announcement) throw error ?? new Error('ilan yazılamadı');
  if (!positions.length) return;
  const rows = positions.map((position: ParsedPosition) => ({
    announcement_id: announcement.id,
    position_title: position.position_title,
    quota: position.quota ?? 1,
    cities: position.cities ?? [],
    education_level: position.education_level,
    is_general_degree: position.is_general_degree,
    allowed_departments: position.allowed_departments ?? [],
    requires_kpss: position.requires_kpss ?? true,
    kpss_type: position.kpss_type ?? null,
    min_kpss_score: position.min_kpss_score ?? 0,
    min_yds_score: position.min_yds_score ?? 0,
    min_age: position.min_age ?? 18,
    max_age: position.max_age ?? 99,
    allowed_genders: position.allowed_genders ?? ['Erkek', 'Kadın'],
    min_height_male: position.min_height_male ?? 0,
    min_height_female: position.min_height_female ?? 0,
    required_licenses: position.required_licenses ?? [],
    requires_security_card: position.requires_security_card ?? false,
    requires_disability: position.requires_disability ?? false,
    min_sgk_days: position.min_sgk_days ?? 0,
    required_certificates: position.required_certificates ?? [],
    raw_requirements_text: position.raw_requirements_text ?? null,
  }));
  const { data: inserted, error: positionError } = await supabase.from('job_positions').insert(rows).select('id, position_title');
  if (positionError) throw positionError;
  for (const position of inserted ?? []) {
    await notify(position.id, 'new_job', `${ad.institutionName}: ${position.position_title}`);
  }
  counts[ad.sourceName] = (counts[ad.sourceName] ?? 0) + 1;
}

async function remindDeadlines() {
  const until = new Date(Date.now() + 48 * 36e5).toISOString();
  const { data } = await supabase
    .from('job_positions')
    .select('id, position_title, announcements!inner(application_end_date, status, institution_name)')
    .eq('announcements.status', 'published')
    .gte('announcements.application_end_date', new Date().toISOString())
    .lte('announcements.application_end_date', until);
  for (const position of data ?? []) {
    const announcement = Array.isArray(position.announcements) ? position.announcements[0] : position.announcements;
    await notify(position.id, 'deadline', `${announcement?.institution_name ?? 'Kurum'} / ${position.position_title} başvurusu 48 saat içinde bitiyor.`);
  }
}

async function main() {
  const { data: run } = await supabase.from('scraper_runs').insert({ status: 'running' }).select('id').single();
  try {
    const discovered: DiscoveredAd[] = [];
    try {
      discovered.push(...(await discoverIlanGov()));
    } catch (error) {
      notes.push(`ilan.gov.tr: ${error instanceof Error ? error.message : 'hata'}`);
    }
    try {
      discovered.push(...(await discoverHtmlSources()));
    } catch (error) {
      notes.push(`html kaynakları: ${error instanceof Error ? error.message : 'hata'}`);
    }
    for (const ad of discovered.slice(0, 25)) {
      try {
        await saveAd(ad);
      } catch (error) {
        notes.push(`${ad.sourceUrl}: ${error instanceof Error ? error.message : 'hata'}`);
      }
    }
    await remindDeadlines();
    await supabase
      .from('scraper_runs')
      .update({ status: 'success', finished_at: new Date().toISOString(), source_counts: counts, message: notes.join('\n').slice(0, 2000) || null })
      .eq('id', run?.id);
    console.log(JSON.stringify({ counts, notes }, null, 2));
  } catch (error) {
    await supabase
      .from('scraper_runs')
      .update({ status: 'error', finished_at: new Date().toISOString(), message: error instanceof Error ? error.message : 'hata' })
      .eq('id', run?.id);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
