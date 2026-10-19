import { isToday, isWithin48Hours } from './format';
import type { JobPosition, MatchProfile, MatchSummary } from '../types/domain';

export type MatchResult = {
  matched: boolean;
  gaps: string[];
};

function sameLevel(left: string, right: string): boolean {
  const normalize = (value: string) => (value === 'Lise' ? 'Ortaöğretim' : value);
  return normalize(left) === normalize(right);
}

function educationMatches(profile: MatchProfile, job: JobPosition): boolean {
  return profile.educations.some((education) => {
    if (!sameLevel(education.level, job.educationLevel)) return false;
    if (job.isGeneralDegree) return true;
    return job.allowedDepartments.includes(education.department);
  });
}

export function evaluatePosition(profile: MatchProfile, job: JobPosition): MatchResult {
  const gaps: string[] = [];
  if (job.status !== 'published') gaps.push('İlan yayında değil');
  if (new Date(job.applicationEndDate).getTime() < Date.now()) gaps.push('Başvuru süresi dolmuş');
  if (!educationMatches(profile, job)) gaps.push('Eğitim veya bölüm şartı');
  if (job.requiresKpss) {
    if (!profile.hasKpss) gaps.push('KPSS puanı');
    else if (job.kpssType && profile.kpssType !== job.kpssType) gaps.push(`${job.kpssType} puan türü`);
    else if (profile.kpssScore < job.minKpssScore) gaps.push(`En az ${job.minKpssScore} KPSS`);
  }
  if (profile.ydsScore < job.minYdsScore) gaps.push(`En az ${job.minYdsScore} YDS`);
  if (profile.age != null && (profile.age < job.minAge || profile.age > job.maxAge)) gaps.push('Yaş şartı');
  if (profile.gender && !job.allowedGenders.includes(profile.gender)) gaps.push('Cinsiyet şartı');
  if (profile.height != null && profile.gender === 'Erkek' && profile.height < job.minHeightMale) gaps.push('Boy şartı');
  if (profile.height != null && profile.gender === 'Kadın' && profile.height < job.minHeightFemale) gaps.push('Boy şartı');
  const missingLicenses = job.requiredLicenses.filter((license) => !profile.driverLicenses.includes(license));
  if (missingLicenses.length) gaps.push(`${missingLicenses.join(', ')} ehliyet`);
  if (job.requiresSecurityCard && !profile.hasSecurityCard) gaps.push('Güvenlik görevlisi kartı');
  if (job.requiresDisability && !profile.isDisabled) gaps.push('Engelli kadrosu');
  if (profile.sgkPrimDays < job.minSgkDays) gaps.push(`${job.minSgkDays} SGK günü`);
  const missingCertificates = job.requiredCertificates.filter((item) => !profile.certificates.includes(item));
  if (missingCertificates.length) gaps.push(missingCertificates.join(', '));
  if (
    job.cities.length > 0 &&
    !job.cities.includes('Tüm Türkiye') &&
    profile.city &&
    !job.cities.includes(profile.city)
  ) {
    gaps.push('İl şartı');
  }
  return { matched: gaps.length === 0, gaps };
}

export function matchedPositions(profile: MatchProfile, jobs: JobPosition[]): JobPosition[] {
  return jobs.filter((job) => evaluatePosition(profile, job).matched);
}

export function summarize(jobs: JobPosition[], lastSuccessAt: string | null = null): MatchSummary {
  const institutions = new Set(jobs.map((job) => job.institutionName));
  return {
    totalPositions: jobs.length,
    institutionCount: institutions.size,
    expiring48h: jobs.filter((job) => isWithin48Hours(job.applicationEndDate)).length,
    newToday: jobs.filter((job) => isToday(job.createdAt)).length,
    lastSuccessAt,
  };
}

export type CareerTip = {
  title: string;
  detail: string;
  extraCount: number;
};

export function careerTips(profile: MatchProfile, jobs: JobPosition[]): CareerTip[] {
  const active = jobs.filter((job) => job.status === 'published' && new Date(job.applicationEndDate).getTime() >= Date.now());
  const baseline = matchedPositions(profile, active).length;
  const ideas: { title: string; apply: (profile: MatchProfile) => MatchProfile }[] = [
    {
      title: 'B sınıfı ehliyet',
      apply: (current) => ({ ...current, driverLicenses: Array.from(new Set([...current.driverLicenses, 'B'])) }),
    },
    {
      title: 'D sınıfı ehliyet',
      apply: (current) => ({ ...current, driverLicenses: Array.from(new Set([...current.driverLicenses, 'D'])) }),
    },
    {
      title: 'Bilgisayar İşletmenliği',
      apply: (current) => ({
        ...current,
        certificates: Array.from(new Set([...current.certificates, 'Bilgisayar İşletmenliği'])),
      }),
    },
    {
      title: 'Güvenlik görevlisi kartı',
      apply: (current) => ({ ...current, hasSecurityCard: true }),
    },
    {
      title: 'SRC belgesi',
      apply: (current) => ({
        ...current,
        certificates: Array.from(new Set([...current.certificates, 'SRC2'])),
      }),
    },
  ];

  return ideas
    .map((idea) => {
      const extraCount = matchedPositions(idea.apply(profile), active).length - baseline;
      return {
        title: idea.title,
        extraCount,
        detail:
          extraCount > 0
            ? `${idea.title} eklersen başvurabileceğin ilan sayısı ${baseline} değerinden ${baseline + extraCount} değerine çıkar.`
            : `${idea.title} şu anki ilan setinde yeni eşleşme açmıyor.`,
      };
    })
    .filter((tip) => tip.extraCount > 0)
    .sort((a, b) => b.extraCount - a.extraCount);
}
