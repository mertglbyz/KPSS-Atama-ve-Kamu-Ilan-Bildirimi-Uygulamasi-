export type EducationLevel = 'Lise' | 'Önlisans' | 'Lisans';
export type Gender = 'Erkek' | 'Kadın';
export type SecurityCardType = 'Yok' | 'Silahsız' | 'Silahlı';
export type SubscriptionPlan = 'free' | 'monthly' | 'quarterly' | 'yearly';
export type ApplicationStatus = 'none' | 'applied' | 'accepted' | 'rejected';

export type EducationEntry = {
  level: EducationLevel;
  department: string;
};

export type ProfileDraft = {
  nickname: string;
  age: string;
  height: string;
  weight: string;
  gender: Gender | '';
  city: string;
  educations: EducationEntry[];
  hasKpss: boolean | null;
  kpssType: string;
  kpssScore: string;
  ydsScore: string;
  alesScore: string;
  driverLicenses: string[];
  isDisabled: boolean;
  hasSecurityCard: boolean;
  securityCardType: SecurityCardType;
  isStudent: boolean;
  hasSgkHistory: boolean;
  sgkPrimDays: string;
  certificates: string[];
  onboardingCompleted: boolean;
  notifyNewJobs: boolean;
  notifyDeadline: boolean;
  notifyResults: boolean;
};

export type MatchProfile = {
  age: number | null;
  height: number | null;
  gender: Gender | null;
  city: string | null;
  educations: EducationEntry[];
  hasKpss: boolean;
  kpssType: string;
  kpssScore: number;
  ydsScore: number;
  alesScore: number;
  driverLicenses: string[];
  isDisabled: boolean;
  hasSecurityCard: boolean;
  sgkPrimDays: number;
  certificates: string[];
};

export type JobPosition = {
  id: string;
  announcementId: string;
  institutionName: string;
  announcementTitle: string;
  positionTitle: string;
  quota: number;
  cities: string[];
  educationLevel: EducationLevel;
  isGeneralDegree: boolean;
  allowedDepartments: string[];
  requiresKpss: boolean;
  kpssType: string | null;
  minKpssScore: number;
  minYdsScore: number;
  minAge: number;
  maxAge: number;
  allowedGenders: Gender[];
  minHeightMale: number;
  minHeightFemale: number;
  requiredLicenses: string[];
  requiresSecurityCard: boolean;
  requiresDisability: boolean;
  minSgkDays: number;
  requiredCertificates: string[];
  rawRequirementsText: string | null;
  applicationStartDate: string | null;
  applicationEndDate: string;
  sourceUrl: string | null;
  sourceName: string | null;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
};

export type PublicJobCard = {
  positionId: string;
  announcementId: string;
  institutionName: string;
  announcementTitle: string;
  positionTitle: string;
  quota: number;
  cities: string[];
  educationLevel: EducationLevel;
  applicationStartDate: string | null;
  applicationEndDate: string;
  sourceName: string | null;
  sourceUrl: string | null;
  status: 'published' | 'archived';
  createdAt: string;
};

export type MatchSummary = {
  totalPositions: number;
  institutionCount: number;
  expiring48h: number;
  newToday: number;
  lastSuccessAt: string | null;
};

export type CompetitorRank = {
  totalCandidates: number;
  userRank: number | null;
  userScore: number;
  unlocked: boolean;
};

export type ScoreBucket = {
  label: string;
  count: number;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  kind: 'new_job' | 'deadline' | 'result' | 'system';
  readAt: string | null;
  createdAt: string;
};

export type JobInteraction = {
  isHidden: boolean;
  isSaved: boolean;
  applicationStatus: ApplicationStatus;
};

export type BaseScore = {
  id: string;
  year: number;
  institutionName: string;
  positionTitle: string;
  department: string | null;
  kpssType: string | null;
  minScore: number;
  sourceNote: string | null;
};

export type LocalCourse = {
  id: string;
  city: string;
  provider: string;
  title: string;
  detail: string | null;
};

export type SupportMessage = {
  id: string;
  body: string;
  sender: 'user' | 'support';
  createdAt: string;
};
