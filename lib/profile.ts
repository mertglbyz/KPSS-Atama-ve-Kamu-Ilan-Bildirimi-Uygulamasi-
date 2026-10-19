import type { EducationLevel, MatchProfile, ProfileDraft } from '@/types/domain';
import { parseScore } from '@/lib/format';

const LEVEL_RANK: Record<EducationLevel, number> = { Ortaöğretim: 1, Önlisans: 2, Lisans: 3 };

export function normalizeLevel(value: unknown): EducationLevel {
  if (value === 'Önlisans') return 'Önlisans';
  if (value === 'Lisans') return 'Lisans';
  return 'Ortaöğretim';
}

export const emptyDraft = (): ProfileDraft => ({
  nickname: '',
  age: '',
  height: '',
  weight: '',
  gender: '',
  city: '',
  educations: [{ level: 'Lisans', department: '' }],
  hasKpss: null,
  kpssType: 'P3',
  kpssScore: '',
  kpssScores: [],
  ydsScore: '',
  alesScore: '',
  driverLicenses: [],
  isDisabled: false,
  hasSecurityCard: false,
  securityCardType: 'Yok',
  isStudent: false,
  hasSgkHistory: false,
  sgkPrimDays: '',
  certificates: [],
  onboardingCompleted: false,
  notifyNewJobs: true,
  notifyDeadline: true,
  notifyResults: true,
});

export function highestEducation(draft: ProfileDraft): EducationLevel | null {
  const filled = draft.educations.filter((item) => item.department.trim());
  if (!filled.length) return null;
  return [...filled].sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level])[0].level;
}

export function toMatchProfile(draft: ProfileDraft): MatchProfile {
  return {
    age: Number(draft.age) || null,
    height: Number(draft.height) || null,
    gender: draft.gender || null,
    city: draft.city || null,
    educations: draft.educations
      .filter((item) => item.department.trim())
      .map((item) => ({ level: item.level, department: item.department.trim() })),
    hasKpss: draft.hasKpss === true,
    kpssType: draft.kpssType,
    kpssScore: parseScore(draft.kpssScore) ?? 0,
    kpssScores: (draft.kpssScores ?? [])
      .map((item) => ({ type: item.type, score: parseScore(item.score) ?? 0 }))
      .filter((item) => item.type && item.score > 0),
    weight: Number(draft.weight) || null,
    ydsScore: parseScore(draft.ydsScore) ?? 0,
    alesScore: parseScore(draft.alesScore) ?? 0,
    driverLicenses: draft.driverLicenses,
    isDisabled: draft.isDisabled,
    hasSecurityCard: draft.hasSecurityCard,
    sgkPrimDays: Number(draft.sgkPrimDays) || 0,
    certificates: draft.certificates,
  };
}

export function toProfileUpdate(draft: ProfileDraft) {
  const educations = draft.educations
    .filter((item) => item.department.trim())
    .map((item) => ({ level: item.level, department: item.department.trim() }));
  return {
    nickname: draft.nickname.trim(),
    age: Number(draft.age) || null,
    height: Number(draft.height) || null,
    weight: Number(draft.weight) || null,
    gender: draft.gender || null,
    city: draft.city || null,
    primary_education_level: highestEducation(draft),
    departments: educations.map((item) => item.department),
    educations,
    has_kpss: draft.hasKpss === true,
    kpss_type: draft.kpssType,
    kpss_score: parseScore(draft.kpssScore) ?? 0,
    kpss_scores: (draft.kpssScores ?? [])
      .map((item) => ({ type: item.type, score: parseScore(item.score) ?? 0 }))
      .filter((item) => item.type && item.score > 0),
    yds_score: parseScore(draft.ydsScore) ?? 0,
    ales_score: parseScore(draft.alesScore) ?? 0,
    driver_licenses: draft.driverLicenses,
    is_disabled: draft.isDisabled,
    has_security_card: draft.hasSecurityCard,
    security_card_type: draft.hasSecurityCard ? draft.securityCardType : 'Yok',
    is_student: draft.isStudent,
    has_sgk_history: draft.hasSgkHistory,
    sgk_prim_days: Number(draft.sgkPrimDays) || 0,
    certificates: draft.certificates,
    onboarding_completed: draft.onboardingCompleted,
    notify_new_jobs: draft.notifyNewJobs,
    notify_deadline: draft.notifyDeadline,
    notify_results: draft.notifyResults,
    updated_at: new Date().toISOString(),
  };
}

export function fromProfileRow(row: Record<string, unknown>): ProfileDraft {
  const educations = Array.isArray(row.educations) ? row.educations : [];
  const normalized = educations
    .map((item) => {
      const entry = item as { level?: EducationLevel; department?: string };
      if (!entry.level || !entry.department) return null;
      return { level: normalizeLevel(entry.level), department: entry.department };
    })
    .filter((item): item is { level: EducationLevel; department: string } => item != null);

  return {
    ...emptyDraft(),
    nickname: String(row.nickname ?? ''),
    age: row.age == null ? '' : String(row.age),
    height: row.height == null ? '' : String(row.height),
    weight: row.weight == null ? '' : String(row.weight),
    gender: row.gender === 'Erkek' || row.gender === 'Kadın' ? row.gender : '',
    city: String(row.city ?? ''),
    educations: normalized.length ? normalized : [{ level: 'Lisans', department: '' }],
    hasKpss: Boolean(row.has_kpss),
    kpssType: String(row.kpss_type ?? 'P3'),
    kpssScore: row.kpss_score == null ? '' : String(row.kpss_score).replace('.', ','),
    kpssScores: Array.isArray(row.kpss_scores)
      ? row.kpss_scores
          .map((item) => {
            const entry = item as { type?: string; score?: number };
            if (!entry.type) return null;
            return { type: entry.type, score: entry.score == null ? '' : String(entry.score).replace('.', ',') };
          })
          .filter((item): item is { type: string; score: string } => item != null)
      : [],
    ydsScore: row.yds_score ? String(row.yds_score).replace('.', ',') : '',
    alesScore: row.ales_score ? String(row.ales_score).replace('.', ',') : '',
    driverLicenses: Array.isArray(row.driver_licenses) ? row.driver_licenses.map(String) : [],
    isDisabled: Boolean(row.is_disabled),
    hasSecurityCard: Boolean(row.has_security_card),
    securityCardType:
      row.security_card_type === 'Silahlı' || row.security_card_type === 'Silahsız' ? row.security_card_type : 'Yok',
    isStudent: Boolean(row.is_student),
    hasSgkHistory: Boolean(row.has_sgk_history),
    sgkPrimDays: row.sgk_prim_days ? String(row.sgk_prim_days) : '',
    certificates: Array.isArray(row.certificates) ? row.certificates.map(String) : [],
    onboardingCompleted: Boolean(row.onboarding_completed),
    notifyNewJobs: row.notify_new_jobs !== false,
    notifyDeadline: row.notify_deadline !== false,
    notifyResults: row.notify_results !== false,
  };
}
