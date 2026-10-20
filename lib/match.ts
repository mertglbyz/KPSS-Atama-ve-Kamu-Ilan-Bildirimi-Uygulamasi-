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
    const scores = [
      { type: profile.kpssType, score: profile.kpssScore },
      ...(profile.kpssScores ?? []),
    ];
    const sameType = (left: string, right: string) => left.replace(/\s|kpss|grubu/gi, '').toLocaleLowerCase('tr-TR') === right.replace(/\s|kpss|grubu/gi, '').toLocaleLowerCase('tr-TR');
    const fitting = scores.find((item) => !job.kpssType || sameType(item.type, job.kpssType));
    if (!profile.hasKpss) gaps.push('KPSS puanı');
    else if (!fitting) gaps.push(`${job.kpssType} puan türü`);
    else if (fitting.score < job.minKpssScore) gaps.push(`En az ${job.minKpssScore} KPSS`);
  }
  if (profile.ydsScore < job.minYdsScore) gaps.push(`En az ${job.minYdsScore} YDS`);
  if (profile.age != null && (profile.age < job.minAge || profile.age > job.maxAge)) gaps.push('Yaş şartı');
  if (profile.gender && !job.allowedGenders.includes(profile.gender)) gaps.push('Cinsiyet şartı');
  const heightLimited = job.minHeightMale > 0 || job.minHeightFemale > 0 || job.maxHeightMale > 0 || job.maxHeightFemale > 0;
  if (heightLimited && profile.height == null) gaps.push('Boy bilgisi');
  if (profile.height != null && profile.gender === 'Erkek' && (profile.height < job.minHeightMale || (job.maxHeightMale > 0 && profile.height > job.maxHeightMale))) gaps.push('Boy şartı');
  if (profile.height != null && profile.gender === 'Kadın' && (profile.height < job.minHeightFemale || (job.maxHeightFemale > 0 && profile.height > job.maxHeightFemale))) gaps.push('Boy şartı');
  const weightLimited = job.minWeight > 0 || job.maxWeight > 0;
  if (weightLimited && profile.weight == null) gaps.push('Kilo bilgisi');
  if (profile.weight != null && job.minWeight > 0 && profile.weight < job.minWeight) gaps.push('Kilo şartı');
  if (profile.weight != null && job.maxWeight > 0 && profile.weight > job.maxWeight) gaps.push('Kilo şartı');
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

