export type DiscoveredAd = {
  sourceName: string;
  sourceUrl: string;
  title: string;
  institutionName: string;
  text: string;
  pdfUrl?: string;
};

export type ParsedPosition = {
  position_title: string;
  quota?: number;
  cities?: string[];
  education_level: 'Lise' | 'Önlisans' | 'Lisans';
  is_general_degree: boolean;
  allowed_departments?: string[];
  requires_kpss?: boolean;
  kpss_type?: string;
  min_kpss_score?: number;
  min_age?: number;
  max_age?: number;
  min_height_male?: number;
  min_height_female?: number;
  required_licenses?: string[];
  requires_security_card?: boolean;
  requires_disability?: boolean;
  min_sgk_days?: number;
  raw_requirements_text?: string;
  allowed_genders?: string[];
  required_certificates?: string[];
  min_yds_score?: number;
};

export type ParsedAnnouncement = {
  institution_name?: string;
  application_start_date?: string;
  application_end_date?: string;
  positions?: ParsedPosition[];
};
