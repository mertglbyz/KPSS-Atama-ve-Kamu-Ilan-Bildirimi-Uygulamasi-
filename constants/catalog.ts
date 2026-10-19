import type { EducationLevel } from '@/types/domain';

export { DEPARTMENTS } from '@/constants/departments';

export const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
  'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
  'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
  'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
  'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
] as const;

export const LICENSE_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'M', 'T'] as const;

export const CERTIFICATES = [
  'Bilgisayar İşletmenliği',
  'Kalorifer Ateşçiliği',
  'İlk Yardım',
  'SRC1',
  'SRC2',
  'SRC3',
  'SRC4',
  'Psikoteknik',
  'Hijyen',
  'İş Güvenliği',
  'Aşçılık',
] as const;

export const KPSS_TYPES: Record<EducationLevel, string[]> = {
  Ortaöğretim: ['P94'],
  Önlisans: ['P93'],
  Lisans: [
    'P3',
    'P2',
    'P1',
    'Hukuk',
    'İktisat',
    'Maliye',
    'İşletme',
    'Muhasebe',
    'Kamu Yönetimi',
    'Uluslararası İlişkiler',
    'Çalışma Ekonomisi',
    'İstatistik',
    'Ekonometri',
    'Finans',
  ],
};

export const STUDY_TOPICS = [
  { id: 'turkce', title: 'Türkçe', items: ['Sözcükte anlam', 'Cümlede anlam', 'Paragraf', 'Yazım ve noktalama'] },
  { id: 'matematik', title: 'Matematik', items: ['Temel kavramlar', 'Problemler', 'Sayılar', 'Geometri'] },
  { id: 'tarih', title: 'Tarih', items: ['İnkılap tarihi', 'Osmanlı', 'Çağdaş Türk tarihi'] },
  { id: 'cografya', title: 'Coğrafya', items: ['Türkiye coğrafyası', 'İklim', 'Harita bilgisi'] },
  { id: 'vatandaslik', title: 'Vatandaşlık', items: ['Anayasa', 'İdare', 'Güncel'] },
  { id: 'alan', title: 'Alan bilgisi', items: ['ÖSYM konu dağılımı', 'Çıkmış sorular', 'Deneme analizi'] },
] as const;

export const AOF_SUGGESTIONS: Record<string, string[]> = {
  'Yazılım Mühendisliği': ['Yönetim Bilişim Sistemleri', 'Bilgisayar Programcılığı', 'İşletme'],
  'Bilgisayar Mühendisliği': ['Yönetim Bilişim Sistemleri', 'İşletme', 'Halkla İlişkiler ve Tanıtım'],
  İşletme: ['Kamu Yönetimi', 'Maliye', 'İktisat'],
  'Kamu Yönetimi': ['İşletme', 'Halkla İlişkiler ve Tanıtım', 'Sosyoloji'],
  Hukuk: ['Kamu Yönetimi', 'İşletme', 'Sosyoloji'],
  Hemşirelik: ['Sosyal Hizmet', 'Çocuk Gelişimi', 'İşletme'],
};

export const PRODUCT_IDS = {
  monthly: 'kpss_pro_monthly',
  quarterly: 'kpss_pro_quarterly',
  yearly: 'kpss_pro_yearly',
} as const;

export const ENTITLEMENT_ID = 'pro';

export const PLANS = [
  {
    id: 'yearly' as const,
    productId: PRODUCT_IDS.yearly,
    title: '1 Yıllık',
    price: '799,99 TL',
    monthly: 'Aylık 66,66 TL',
    badge: 'En Avantajlı',
    note: '%33 indirim',
  },
  {
    id: 'quarterly' as const,
    productId: PRODUCT_IDS.quarterly,
    title: '3 Aylık',
    price: '249,99 TL',
    monthly: 'Aylık 83,33 TL',
    badge: 'En Popüler',
    note: '%17 indirim',
  },
  {
    id: 'monthly' as const,
    productId: PRODUCT_IDS.monthly,
    title: 'Aylık',
    price: '99,99 TL',
    monthly: 'İstediğin zaman iptal et',
    badge: null,
    note: 'Standart',
  },
];
