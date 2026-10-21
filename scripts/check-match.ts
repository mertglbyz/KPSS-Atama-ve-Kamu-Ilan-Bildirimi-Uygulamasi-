import { evaluatePosition, matchedPositions } from '../lib/match';
import type { JobPosition, MatchProfile } from '../types/domain';

const profile: MatchProfile = {
  age: 25,
  height: 180,
  gender: 'Erkek',
  city: 'İstanbul',
  educations: [{ level: 'Lisans', department: 'Yazılım Mühendisliği' }],
  hasKpss: true,
  kpssType: 'P3',
  kpssScore: 81,
  kpssScores: [],
  weight: 75,
  ydsScore: 0,
  alesScore: 0,
  driverLicenses: ['B'],
  isDisabled: false,
  hasSecurityCard: false,
  sgkPrimDays: 100,
  certificates: [],
};

const job = (patch: Partial<JobPosition>): JobPosition => ({
  id: '1',
  announcementId: 'a',
  institutionName: 'Kurum',
  announcementTitle: 'Alım',
  positionTitle: 'Kadro',
  quota: 1,
  cities: ['Tüm Türkiye'],
  educationLevel: 'Lisans',
  isGeneralDegree: true,
  allowedDepartments: [],
  requiresKpss: true,
  kpssType: 'P3',
  minKpssScore: 70,
  minYdsScore: 0,
  minAge: 18,
  maxAge: 65,
  allowedGenders: ['Erkek', 'Kadın'],
  minHeightMale: 0,
  minHeightFemale: 0,
  maxHeightMale: 0,
  maxHeightFemale: 0,
  minWeight: 0,
  maxWeight: 0,
  requiredLicenses: [],
  requiresSecurityCard: false,
  requiresDisability: false,
  minSgkDays: 0,
  requiredCertificates: [],
  rawRequirementsText: null,
  applicationStartDate: null,
  applicationEndDate: new Date(Date.now() + 864e5).toISOString(),
  sourceUrl: null,
  sourceName: null,
  status: 'published',
  createdAt: new Date().toISOString(),
  ...patch,
});

const matches = matchedPositions(profile, [
  job({}),
  job({ id: '2', educationLevel: 'Ortaöğretim', kpssType: 'P94' }),
  job({ id: '3', requiredLicenses: ['D'] }),
  job({ id: '4', requiresSecurityCard: true }),
]);

if (matches.length !== 1 || matches[0].id !== '1') {
  throw new Error(`Beklenen tek eşleşme, gelen: ${matches.map((item) => item.id).join(',')}`);
}

const blocked = evaluatePosition(profile, job({ minKpssScore: 90 }));
if (blocked.matched || !blocked.gaps.some((gap) => gap.includes('90'))) {
  throw new Error('Düşük puan elenmedi');
}

const hukuk = evaluatePosition(
  { ...profile, kpssType: 'Hukuk', kpssScore: 75 },
  job({ kpssType: 'KPSS A Hukuk', minKpssScore: 70 }),
);
if (!hukuk.matched) throw new Error('A grubu Hukuk eşleşmedi');

const notP10 = evaluatePosition({ ...profile, kpssType: 'P1', kpssScore: 80 }, job({ kpssType: 'P10', minKpssScore: 70 }));
if (notP10.matched) throw new Error('P10, P1 ile eşleşmemeli');

const secondary = evaluatePosition(
  { ...profile, kpssScore: 60, kpssScores: [{ type: 'P1', score: 85 }] },
  job({ kpssType: null, minKpssScore: 70 }),
);
if (!secondary.matched) throw new Error('Puan türü boşken ek puan kabul edilmedi');

console.log('match checks ok');
