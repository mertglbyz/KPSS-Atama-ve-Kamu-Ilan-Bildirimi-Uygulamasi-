import './load-env';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { parseAnnouncement } from './gemini';
import { fingerprint, sameAnnouncement } from './identity';
import { datesFromTitle } from './dates';
import { noticeKind } from './notices';
import { discoverIlanGov, discoverKamuilan, discoverKariyerKapisi, discoverYerelYonetimler, downloadPdf, enrichAd } from './sources';
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
const maxNewPerRun = Number(process.env.MAX_NEW_PER_RUN || 60);

type KnownAd = {
  id: string;
  institution_name: string;
  title: string;
  source_url: string;
  source_name: string | null;
  application_end_date: string | null;
  body_hash?: string | null;
};

async function noteAlternate(existingId: string, ad: DiscoveredAd) {
  const read = await supabase.from('announcements').select('also_listed_on').eq('id', existingId).maybeSingle();
  if (read.error || !read.data) return;
  const current = Array.isArray(read.data.also_listed_on) ? read.data.also_listed_on : [];
  if (current.some((item) => item && typeof item === 'object' && 'url' in item && item.url === ad.sourceUrl)) return;
  await supabase.from('announcements').update({
    also_listed_on: [...current, { source: ad.sourceName, url: ad.sourceUrl }],
  }).eq('id', existingId);
}

async function notify(positionId: string, kind: 'new_job' | 'deadline' | 'result', body: string, title = kind === 'deadline' ? 'Son 48 saat' : kind === 'result' ? 'İlan güncellendi' : 'Yeni uygun ilan', dedupe: string = kind) {
  const { data, error } = await supabase.rpc('users_to_notify_for_position', {
    p_position_id: positionId,
    p_kind: kind,
  });
  if (error || !data?.length) return;
  const messages = data.map((candidate: { expo_push_token: string }) => ({
    to: candidate.expo_push_token,
    title,
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
      title,
      body,
      kind: dedupe === kind ? kind : 'system',
      dedupe_key: `${dedupe}:${positionId}:${candidate.user_id}`,
    })),
    { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
  );
}

function futureDate(value: string | undefined, fallbackDays: number) {
  const now = new Date();
  const parsed = value ? new Date(value) : new Date(now.getTime() + fallbackDays * 864e5);
  if (Number.isNaN(parsed.getTime())) return new Date(now.getTime() + fallbackDays * 864e5).toISOString();
  if (parsed.getFullYear() < now.getFullYear()) parsed.setFullYear(now.getFullYear());
  return parsed.toISOString();
}

function isStale(value: string | null | undefined) {
  if (!value) return false;
  const year = new Date(value).getFullYear();
  return !Number.isNaN(year) && year < new Date().getFullYear();
}

function educationLevel(value: string | undefined): 'Ortaöğretim' | 'Önlisans' | 'Lisans' {
  const folded = (value ?? '').toLocaleLowerCase('tr-TR');
  if (folded.includes('önlisans') || folded.includes('onlisans')) return 'Önlisans';
  if (folded.includes('orta') || folded.includes('lise')) return 'Ortaöğretim';
  if (value === 'Lisans' || value === 'Önlisans' || value === 'Ortaöğretim') return value;
  return 'Lisans';
}

function normalizePosition(position: ParsedPosition): ParsedPosition {
  return { ...position, education_level: educationLevel(position.education_level) };
}

function fallbackPosition(ad: DiscoveredAd): ParsedPosition {
  const text = `${ad.title}\n${ad.text}`.toLocaleLowerCase('tr-TR');
  return {
    position_title: ad.title.replace(/\s+/g, ' ').trim().slice(0, 140) || 'Kamu personel ilanı',
    education_level: educationLevel(text),
    is_general_degree: /herhangi bir|düz memur|duz memur/.test(text),
    requires_kpss: /kpss/.test(text),
    cities: [],
    raw_requirements_text: ad.text.slice(0, 4000),
  };
}

async function saveAd(ad: DiscoveredAd, options: { hash: string; existingId?: string; localKind: 'active' | 'revised' | 'cancelled' }): Promise<string | undefined> {
  const { data: existing } = options.existingId
    ? await supabase.from('announcements').select('id, source_url').eq('id', options.existingId).maybeSingle()
    : await supabase.from('announcements').select('id, source_url').eq('source_url', ad.sourceUrl).maybeSingle();
  if (!process.env.GEMINI_API_KEY) {
    notes.push('GEMINI_API_KEY yok, ayrıştırma atlandı.');
    return undefined;
  }
  const attached = ad.pdf && ad.pdf.length <= 12 * 1024 * 1024 ? ad.pdf : undefined;
  const pdf = attached ?? (ad.pdfUrl ? await downloadPdf(ad.pdfUrl) : undefined);
  const parsed = await parseAnnouncement(`${ad.institutionName}\n${ad.title}\n${ad.text}`, pdf);
  const kind = options.localKind === 'cancelled' || parsed.notice_kind === 'cancelled'
    ? 'cancelled'
    : options.localKind === 'revised' || parsed.notice_kind === 'revised'
      ? 'revised'
      : 'active';
  const parsedPositions = (parsed.positions ?? []).map(normalizePosition);
  const positions = kind === 'cancelled' ? [] : parsedPositions.length ? parsedPositions : [fallbackPosition(ad)];
  if (kind === 'cancelled' && existing) {
    const current = await supabase.from('job_positions').select('id, position_title').eq('announcement_id', existing.id);
    for (const position of current.data ?? []) {
      await notify(position.id, 'result', `${ad.institutionName}: ${position.position_title} ilanı iptal edildi.`, 'İlan iptal edildi', `cancel:${options.hash}`);
    }
    await supabase.from('announcements').update({ status: 'archived', listing_state: 'cancelled', body_hash: options.hash }).eq('id', existing.id);
    return existing.id;
  }
  const row = {
    institution_name: parsed.institution_name || ad.institutionName,
    title: ad.title,
    source_name: ad.sourceName,
    source_url: existing?.source_url || ad.sourceUrl,
    pdf_url: ad.pdfUrl ?? null,
    application_start_date: datesFromTitle(ad.title).start ?? (parsed.application_start_date ? futureDate(parsed.application_start_date, 0) : null),
    application_end_date: datesFromTitle(ad.title).end ?? futureDate(parsed.application_end_date, 14),
    status: kind === 'cancelled' ? 'archived' : positions.length ? 'published' : 'draft',
    content_fingerprint: fingerprint(parsed.institution_name || ad.institutionName, ad.title),
    body_hash: options.hash,
    listing_state: kind === 'cancelled' ? 'cancelled' : kind,
  };
  const { content_fingerprint: fingerprintValue, source_url: _sourceUrl, ...updateRow } = row;
  let created = existing
    ? await supabase.from('announcements').update({ ...updateRow, content_fingerprint: fingerprintValue }).eq('id', existing.id).select('id').single()
    : await supabase.from('announcements').insert(row).select('id').single();
  if (created.error && /content_fingerprint|body_hash|listing_state/.test(created.error.message)) {
    notes.push('İlan durum sütunları henüz yok. Supabase SQL dosyasını çalıştır.');
    const { content_fingerprint: _fingerprint, body_hash: _hash, listing_state: _state, ...plain } = row;
    created = existing
      ? await supabase.from('announcements').update(plain).eq('id', existing.id).select('id').single()
      : await supabase.from('announcements').insert(plain).select('id').single();
  }
  const { data: announcement, error } = created;
  if (existing && announcement) await supabase.from('job_positions').delete().eq('announcement_id', announcement.id);
  if (error || !announcement) throw error ?? new Error('ilan yazılamadı');
  if (kind === 'cancelled' || !positions.length || !announcement) return announcement?.id;
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
    max_height_male: position.max_height_male ?? 0,
    max_height_female: position.max_height_female ?? 0,
    min_weight: position.min_weight ?? 0,
    max_weight: position.max_weight ?? 0,
    required_licenses: position.required_licenses ?? [],
    requires_security_card: position.requires_security_card ?? false,
    requires_disability: position.requires_disability ?? false,
    min_sgk_days: position.min_sgk_days ?? 0,
    required_certificates: position.required_certificates ?? [],
    raw_requirements_text: position.raw_requirements_text ?? null,
  }));
  let positionWrite = await supabase.from('job_positions').insert(rows).select('id, position_title');
  if (positionWrite.error && /min_weight|max_weight|max_height/.test(positionWrite.error.message)) {
    const slim = rows.map(({ min_weight: _minWeight, max_weight: _maxWeight, max_height_male: _maxMale, max_height_female: _maxFemale, ...rest }) => rest);
    positionWrite = await supabase.from('job_positions').insert(slim).select('id, position_title');
    notes.push('Boy ve kilo sütunları henüz yok. Supabase SQL dosyasını çalıştır.');
  }
  if (positionWrite.error) throw positionWrite.error;
  const updated = Boolean(existing) && kind === 'revised';
  for (const position of positionWrite.data ?? []) {
    await notify(
      position.id,
      updated ? 'result' : 'new_job',
      `${ad.institutionName}: ${position.position_title}`,
      updated ? 'İlan güncellendi' : 'Yeni uygun ilan',
      updated ? `revision:${options.hash}` : 'new_job',
    );
  }
  counts[ad.sourceName] = (counts[ad.sourceName] ?? 0) + 1;
  return announcement.id;
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
    const sources = [
      ['kamuilan.sbb.gov.tr', discoverKamuilan],
      ['kariyerkapisi.gov.tr', discoverKariyerKapisi],
      ['ilan.gov.tr', discoverIlanGov],
      ['yerelyonetimler.csb.gov.tr', discoverYerelYonetimler],
    ] as const;
    for (const [name, discover] of sources) {
      try {
        const found = await discover();
        notes.push(`${name}: ${found.length} ilan`);
        discovered.push(...found);
      } catch (error) {
        notes.push(`${name}: ${error instanceof Error ? error.message : 'hata'}`);
      }
    }
    const known = await supabase.from('announcements').select('id, institution_name, title, source_url, source_name, application_end_date, body_hash').limit(5000);
    const fallback = known.error?.message.includes('body_hash')
      ? await supabase.from('announcements').select('id, institution_name, title, source_url, source_name, application_end_date').limit(5000)
      : null;
    if (fallback) notes.push('Tekrar ve düzeltme sütunu henüz yok. Supabase SQL dosyasını çalıştır.');
    const catalog: KnownAd[] = (known.data ?? fallback?.data ?? []) as KnownAd[];
    let saved = 0;
    let deferred = 0;
    let duplicates = 0;
    for (const ad of discovered) {
      try {
        const enriched = await enrichAd(ad);
        const hash = createHash('sha256')
          .update(enriched.title)
          .update('\n')
          .update(enriched.text)
          .update(enriched.pdf ?? '')
          .digest('hex');
        const localKind = noticeKind(enriched.title, enriched.text);
        const already = catalog.find((item) => item.source_url === enriched.sourceUrl)
          ?? catalog.find((item) => sameAnnouncement(
            { institutionName: item.institution_name, title: item.title },
            { institutionName: enriched.institutionName, title: enriched.title },
          ));
        if (already && already.source_url !== enriched.sourceUrl && localKind === 'active') {
          await noteAlternate(already.id, enriched);
          duplicates += 1;
          continue;
        }
        const unchanged = already?.body_hash === hash && !isStale(already?.application_end_date) && localKind === 'active';
        if (unchanged) continue;
        if (!already && saved >= maxNewPerRun) {
          deferred += 1;
          continue;
        }
        const savedId = await saveAd(enriched, { hash, existingId: already?.id, localKind });
        if (!savedId) continue;
        if (already) {
          already.body_hash = hash;
          already.application_end_date = new Date().toISOString();
        } else {
          catalog.push({
            id: savedId,
            institution_name: enriched.institutionName,
            title: enriched.title,
            source_url: enriched.sourceUrl,
            source_name: enriched.sourceName,
            application_end_date: new Date().toISOString(),
            body_hash: hash,
          });
        }
        saved += 1;
      } catch (error) {
        const message = (error instanceof Error ? error.message : 'hata').slice(0, 180);
        notes.push(`${ad.sourceUrl}: ${message}`);
        if (message.includes('429') || message.toLowerCase().includes('quota')) {
          notes.push('Gemini kotası doldu, tur burada durdu. Kalan ilanlar sonraki turda alınır.');
          break;
        }
      }
    }
    if (duplicates) notes.push(`${duplicates} ilan başka sitede zaten vardı, ikinci kez kaydedilmedi.`);
    if (deferred) notes.push(`${deferred} yeni ilan sonraki tura bırakıldı.`);
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
