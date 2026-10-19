import { DEMO_BASE_SCORES, DEMO_COURSES, DEMO_JOBS, DEMO_MESSAGES } from '@/lib/demo-data';
import { careerTips, matchedPositions, summarize } from '@/lib/match';
import { fromProfileRow, toMatchProfile, toProfileUpdate } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type {
  AppNotification,
  BaseScore,
  CompetitorRank,
  JobPosition,
  LocalCourse,
  MatchSummary,
  ProfileDraft,
  PublicJobCard,
  ScoreBucket,
  SupportMessage,
} from '@/types/domain';

function asNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function mapPosition(row: Record<string, unknown>): JobPosition {
  return {
    id: String(row.position_id ?? row.id),
    announcementId: String(row.announcement_id),
    institutionName: String(row.institution_name ?? ''),
    announcementTitle: String(row.announcement_title ?? row.title ?? ''),
    positionTitle: String(row.position_title ?? ''),
    quota: asNumber(row.quota, 1),
    cities: Array.isArray(row.cities) ? row.cities.map(String) : [],
    educationLevel: (row.education_level as JobPosition['educationLevel']) ?? 'Lisans',
    isGeneralDegree: Boolean(row.is_general_degree),
    allowedDepartments: Array.isArray(row.allowed_departments) ? row.allowed_departments.map(String) : [],
    requiresKpss: row.requires_kpss !== false,
    kpssType: row.kpss_type ? String(row.kpss_type) : null,
    minKpssScore: asNumber(row.min_kpss_score),
    minYdsScore: asNumber(row.min_yds_score),
    minAge: asNumber(row.min_age, 18),
    maxAge: asNumber(row.max_age, 99),
    allowedGenders: Array.isArray(row.allowed_genders) ? (row.allowed_genders as JobPosition['allowedGenders']) : ['Erkek', 'Kadın'],
    minHeightMale: asNumber(row.min_height_male),
    minHeightFemale: asNumber(row.min_height_female),
    requiredLicenses: Array.isArray(row.required_licenses) ? row.required_licenses.map(String) : [],
    requiresSecurityCard: Boolean(row.requires_security_card),
    requiresDisability: Boolean(row.requires_disability),
    minSgkDays: asNumber(row.min_sgk_days),
    requiredCertificates: Array.isArray(row.required_certificates) ? row.required_certificates.map(String) : [],
    rawRequirementsText: row.raw_requirements_text ? String(row.raw_requirements_text) : null,
    applicationStartDate: row.application_start_date ? String(row.application_start_date) : null,
    applicationEndDate: String(row.application_end_date),
    sourceUrl: row.source_url ? String(row.source_url) : null,
    sourceName: row.source_name ? String(row.source_name) : null,
    status: (row.status as JobPosition['status']) ?? 'published',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapCard(row: Record<string, unknown>): PublicJobCard {
  return {
    positionId: String(row.position_id),
    announcementId: String(row.announcement_id),
    institutionName: String(row.institution_name ?? ''),
    announcementTitle: String(row.announcement_title ?? ''),
    positionTitle: String(row.position_title ?? ''),
    quota: asNumber(row.quota, 1),
    cities: Array.isArray(row.cities) ? row.cities.map(String) : [],
    educationLevel: (row.education_level as PublicJobCard['educationLevel']) ?? 'Lisans',
    applicationStartDate: row.application_start_date ? String(row.application_start_date) : null,
    applicationEndDate: String(row.application_end_date),
    sourceName: row.source_name ? String(row.source_name) : null,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    status: row.status === 'archived' ? 'archived' : 'published',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function saveProfile(userId: string, draft: ProfileDraft): Promise<void> {
  if (!supabase || useAppStore.getState().mode !== 'live') return;
  const { error } = await supabase.from('profiles').update(toProfileUpdate(draft)).eq('id', userId);
  if (error) throw error;
}

export async function loadProfile(userId: string): Promise<{ draft: ProfileDraft; isPremium: boolean; plan: 'free' | 'monthly' | 'quarterly' | 'yearly' } | null> {
  if (!supabase || useAppStore.getState().mode !== 'live') return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const plan = data.subscription_plan;
  return {
    draft: fromProfileRow(data),
    isPremium: Boolean(data.is_premium),
    plan: plan === 'monthly' || plan === 'quarterly' || plan === 'yearly' ? plan : 'free',
  };
}

export async function fetchSummary(userId: string, draft: ProfileDraft): Promise<MatchSummary> {
  if (!supabase || useAppStore.getState().mode !== 'live') return summarize(matchedPositions(toMatchProfile(draft), DEMO_JOBS), new Date().toISOString());
  const { data, error } = await supabase.rpc('get_match_summary', { p_user_id: userId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalPositions: asNumber(row?.total_positions),
    institutionCount: asNumber(row?.institution_count),
    expiring48h: asNumber(row?.expiring_48h),
    newToday: asNumber(row?.new_today),
    lastSuccessAt: row?.last_success_at ? String(row.last_success_at) : null,
  };
}

export async function fetchMatches(userId: string, draft: ProfileDraft, premium: boolean): Promise<JobPosition[]> {
  if (!supabase || useAppStore.getState().mode !== 'live') {
    const matches = matchedPositions(toMatchProfile(draft), DEMO_JOBS);
    return premium ? matches : [];
  }
  const { data, error } = await supabase.rpc('get_matched_positions', { p_user_id: userId });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapPosition(row));
}

export async function fetchCards(scope: 'active' | 'archived'): Promise<PublicJobCard[]> {
  if (!supabase || useAppStore.getState().mode !== 'live') {
    return DEMO_JOBS.filter((job) => (scope === 'archived' ? job.status === 'archived' : job.status === 'published')).map((job) => ({
      positionId: job.id,
      announcementId: job.announcementId,
      institutionName: job.institutionName,
      announcementTitle: job.announcementTitle,
      positionTitle: job.positionTitle,
      quota: job.quota,
      cities: job.cities,
      educationLevel: job.educationLevel,
      applicationStartDate: job.applicationStartDate,
      applicationEndDate: job.applicationEndDate,
      sourceName: job.sourceName,
      sourceUrl: job.sourceUrl,
      status: job.status === 'archived' ? 'archived' : 'published',
      createdAt: job.createdAt,
    }));
  }
  const { data, error } = await supabase.rpc('list_job_cards');
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapCard(row)).filter((card: PublicJobCard) => (scope === 'archived' ? card.status === 'archived' : card.status === 'published'));
}

export async function fetchPosition(userId: string, positionId: string, draft: ProfileDraft, premium: boolean): Promise<JobPosition | null> {
  if (!supabase || useAppStore.getState().mode !== 'live') {
    const job = DEMO_JOBS.find((item) => item.id === positionId) ?? null;
    if (!job || premium) return job;
    return {
      ...job,
      allowedDepartments: [],
      minKpssScore: 0,
      rawRequirementsText: null,
      requiredCertificates: [],
      requiredLicenses: [],
    };
  }
  const { data, error } = await supabase.rpc('get_position_detail', { p_user_id: userId, p_position_id: positionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? mapPosition(row) : null;
}

export async function fetchRank(userId: string, draft: ProfileDraft, premium: boolean): Promise<CompetitorRank> {
  const score = toMatchProfile(draft).kpssScore;
  if (!supabase || useAppStore.getState().mode !== 'live') {
    const cohort = [92, 88, 86, 84, 81, 79, 76, 74, 71, 68, 64, score].filter((item) => item > 0).sort((a, b) => b - a);
    const rank = cohort.findIndex((item) => item === score) + 1;
    return { totalCandidates: cohort.length, userRank: premium ? rank || null : null, userScore: score, unlocked: premium };
  }
  const department = draft.educations.find((item) => item.department)?.department ?? '';
  const { data, error } = await supabase.rpc('get_competitor_rank', { p_user_id: userId, p_department: department });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalCandidates: asNumber(row?.total_candidates),
    userRank: row?.user_rank == null ? null : asNumber(row.user_rank),
    userScore: asNumber(row?.user_score, score),
    unlocked: Boolean(row?.unlocked),
  };
}

export async function fetchDistribution(userId: string, department: string, premium: boolean): Promise<ScoreBucket[]> {
  const empty = [
    { label: '50-60', count: 1 },
    { label: '60-70', count: 2 },
    { label: '70-80', count: 3 },
    { label: '80-90', count: 4 },
    { label: '90+', count: 2 },
  ];
  if (!premium) return [];
  if (!supabase || useAppStore.getState().mode !== 'live') return empty;
  const { data, error } = await supabase.rpc('get_score_distribution', { p_user_id: userId, p_department: department });
  if (error) throw error;
  return (data ?? []).map((row: { label: string; count: number }) => ({ label: row.label, count: asNumber(row.count) }));
}

export async function fetchBaseScores(userId: string, premium: boolean): Promise<BaseScore[]> {
  if (!supabase || useAppStore.getState().mode !== 'live') return premium ? DEMO_BASE_SCORES : DEMO_BASE_SCORES.slice(0, 3);
  const { data, error } = await supabase.rpc('list_base_scores', { p_user_id: userId });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    year: asNumber(row.year),
    institutionName: String(row.institution_name),
    positionTitle: String(row.position_title),
    department: row.department ? String(row.department) : null,
    kpssType: row.kpss_type ? String(row.kpss_type) : null,
    minScore: asNumber(row.min_score),
    sourceNote: row.source_note ? String(row.source_note) : null,
  }));
}

export async function fetchCourses(city: string): Promise<LocalCourse[]> {
  if (!supabase || useAppStore.getState().mode !== 'live') return DEMO_COURSES.filter((course) => !city || course.city === city);
  const { data, error } = await supabase.rpc('list_courses', { p_city: city });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    city: String(row.city),
    provider: String(row.provider),
    title: String(row.title),
    detail: row.detail ? String(row.detail) : null,
  }));
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  if (!supabase || useAppStore.getState().mode !== 'live') {
    return [
      {
        id: 'n1',
        title: 'Örnek bildirim',
        body: 'Canlı push bildirimleri Supabase ve Expo token bağlandıktan sonra burada birikir.',
        kind: 'system',
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ];
  }
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    kind: row.kind,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!supabase || useAppStore.getState().mode !== 'live') return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
}

export async function fetchMessages(userId: string): Promise<SupportMessage[]> {
  if (!supabase || useAppStore.getState().mode !== 'live') return DEMO_MESSAGES;
  const { data, error } = await supabase.from('support_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, body: row.body, sender: row.sender, createdAt: row.created_at }));
}

export async function sendMessage(userId: string, body: string): Promise<void> {
  if (!supabase || useAppStore.getState().mode !== 'live') return;
  const { error } = await supabase.from('support_messages').insert({ user_id: userId, body, sender: 'user' });
  if (error) throw error;
}

export async function upsertInteraction(userId: string, positionId: string, patch: Record<string, unknown>): Promise<void> {
  if (!supabase || positionId.startsWith('demo-')) return;
  const { error } = await supabase.from('user_job_interactions').upsert(
    { user_id: userId, job_position_id: positionId, ...patch },
    { onConflict: 'user_id,job_position_id' },
  );
  if (error) throw error;
}

export function localTips(draft: ProfileDraft) {
  return careerTips(toMatchProfile(draft), DEMO_JOBS);
}

export async function deleteAccount(): Promise<void> {
  if (!supabase || useAppStore.getState().mode !== 'live') return;
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
}
