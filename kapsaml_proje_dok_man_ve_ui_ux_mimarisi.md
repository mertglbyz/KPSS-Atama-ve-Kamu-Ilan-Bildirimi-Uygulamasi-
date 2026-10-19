# 📱 Kamu Personeli & KPSS Atama Bildirimleri Uygulaması - Premium Proje Dokümanı (PRD & UI/UX Mimarisi)

Bu doküman; sıradan, kalabalık ve hantal kamu ilanı uygulamalarından sıyrılarak **modern fintech ve üst düzey kariyer uygulamaları (örneğin Linear, Apple, Stripe tarzı minimalist, şık ve odaklanmış)** estetiğiyle geliştirilecek mobil uygulamanın uçtan uca teknik, işlevsel ve görsel rehberidir.

---

## 1. Tasarım Felsefesi & Modern UI/UX Standartları

Eski uygulamaların karmaşık, çok butonlu ve yorucu arayüzleri yerine şu tasarım ilkeleri benimsenecektir:
* **Minimalist & Derinlikli Arayüz (Glassmorphism & Clean Cards):** Yumuşak pastel tonlar, derinlik hissi veren hafif gölgeler (`shadow-sm`, `shadow-md`), keskin köşeler yerine modern kavisler (`rounded-2xl`, `rounded-3xl`).
* **Renk Paleti (Trust & Modernity):**
  * *Ana Renk (Primary):* Derin Gece Mavisi / İndigo (`#0F172A` ve `#2563EB`) -> Güven ve kurumsallık hissi.
  * *Vurgu Rengi (Accent):* Canlı Mint Yeşili (`#10B981`) veya Elektrik Moru -> Eşleşme başarıları, rozetler ve CTA butonları için.
  * *Arka Plan (Background):* Saf beyaz yerine hafif kirli gri/beyaz (`#F8FAFC` - Slate 50) veya şık bir Karanlık Mod (`#090D16`).
* **Odaklanmış UX (Kullanıcıyı Yormayan Akış):** Kullanıcı uygulamayı açtığında gereksiz menülerle boğulmaz. Tek bakışta **"Profilime uygun kaç güncel ilan var?"** sorusunun yanıtını görür ve kalan vakti yönetir.

---

## 2. Sadeleştirilmiş Modül Kapsamı (Scope)

Önceki uygulamalarda yer alan ve kullanıcı deneyimini dağıtan **"CV Oluştur"**, **"Mesajlar/Destek"**, **"KPSS Planı"**, **"İkinci Üniversite"** ve **"İlinizdeki Kurslar"** gibi modüller **tamamen kaldırılmıştır**. 

Uygulamanın odaklandığı **çekirdek 5 temel modül**:
1. **Akıllı Onboarding Sihirbazı (5 Adım):** Kullanıcının tüm niteliklerini (KPSS puanı, bölümü, boy/kilo, ehliyet vb.) tek seferde toplar.
2. **Kişiselleştirilmiş Dashboard (Ana Sayfa):** Eşleşen ilan sayısı, son 48 saat acil uyarıları ve rakip analizi.
3. **Akıllı İlan & Eşleşme Listesi:** Supabase RPC destekli, 4001 (düz memurluk) kuralını ve tüm özel şartları filtreleyen dinamik liste.
4. **Paywall & Abonelik Sistemi (RevenueCat):** 99.99 TL Aylık, 249.99 TL 3 Aylık, 799.99 TL Yıllık paketler.
5. **Anlık Push Bildirimler & Profil Yönetimi:** Kullanıcının niteliğine uyan ilan düştüğü an saniyeler içinde bildirim gönderimi.

---

## 3. Abonelik Paketleri ve Gelir Yapısı (Monetization & RevenueCat)

* **Mağaza ve Vergi Kesintisi:** Apple App Store / Google Play Store komisyonları, KDV ve stopaj dahil toplam kesinti oranı **%40**'tır (Geliştiriciye kalan net gelir oranı: **%60**).

| Paket Adı | RevenueCat Product ID | Satış Fiyatı (Brüt) | Aylık Denkliği | Avantaj / Rozet | Kesinti (%40) | Net Kalan Gelir (%60) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aylık Paket** | `kpss_pro_monthly` | 99.99 TL | 99.99 TL / Ay | Standart | 40.00 TL | 59.99 TL |
| **3 Aylık Paket** | `kpss_pro_quarterly` | 249.99 TL | 83.33 TL / Ay | %17 İndirim / En Popüler | 100.00 TL | 149.99 TL |
| **1 Yıllık Paket** | `kpss_pro_yearly` | 799.99 TL | 66.66 TL / Ay | %33 İndirim / En Avantajlı | 320.00 TL | 479.99 TL |

---

## 4. Supabase Veritabanı Şeması (SQL) ve Eşleştirme Motoru

Aşağıdaki SQL kodunu Supabase **SQL Editor** ekranında çalıştırarak yeni ve sadeleştirilmiş veritabanı yapısını kurabilirsiniz:

```sql
-- 1. KULLANICI PROFİLLERİ TABLOSU
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT,
  age INTEGER,
  height INTEGER,
  weight INTEGER,
  gender TEXT CHECK (gender IN ('Erkek', 'Kadın')),
  city TEXT,
  
  -- Eğitim
  primary_education_level TEXT CHECK (primary_education_level IN ('Lise', 'Önlisans', 'Lisans')),
  departments TEXT[] DEFAULT '{}', -- Örn: ARRAY['Yazılım Mühendisliği']
  
  -- Sınav
  has_kpss BOOLEAN DEFAULT false,
  kpss_type TEXT DEFAULT 'P3',
  kpss_score NUMERIC(6,4) DEFAULT 0,
  
  -- Ek Bilgiler & Özel Durumlar
  driver_licenses TEXT[] DEFAULT '{}', -- Örn: ARRAY['B']
  is_disabled BOOLEAN DEFAULT false,
  has_security_card BOOLEAN DEFAULT false,
  has_sgk_history BOOLEAN DEFAULT false,
  sgk_prim_days INTEGER DEFAULT 0,
  
  -- Abonelik
  is_premium BOOLEAN DEFAULT false,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'monthly', 'quarterly', 'yearly')) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KURUM DUYURULARI (ÜST TABLO)
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT UNIQUE,
  pdf_url TEXT,
  application_start_date TIMESTAMPTZ,
  application_end_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ALT KADROLAR VE ŞARTLAR (ALT TABLO)
CREATE TABLE public.job_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  position_title TEXT NOT NULL,
  quota INTEGER DEFAULT 1,
  cities TEXT[] DEFAULT '{}',
  
  -- Şartlar
  education_level TEXT CHECK (education_level IN ('Lise', 'Önlisans', 'Lisans')) NOT NULL,
  is_general_degree BOOLEAN DEFAULT false, -- 4001 / Düz Memurluk Kuralı
  allowed_departments TEXT[] DEFAULT '{}',
  requires_kpss BOOLEAN DEFAULT true,
  kpss_type TEXT,
  min_kpss_score NUMERIC(6,4) DEFAULT 0,
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 99,
  allowed_genders TEXT[] DEFAULT ARRAY['Erkek', 'Kadın'],
  min_height_male INTEGER DEFAULT 0,
  min_height_female INTEGER DEFAULT 0,
  required_licenses TEXT[] DEFAULT '{}',
  requires_security_card BOOLEAN DEFAULT false,
  requires_disability BOOLEAN DEFAULT false,
  min_sgk_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KULLANICI İLAN ETKİLEŞİMLERİ (Gizlenen / Kaydedilenler)
CREATE TABLE public.user_job_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_position_id UUID REFERENCES public.job_positions(id) ON DELETE CASCADE,
  is_hidden BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  UNIQUE(user_id, job_position_id)
);

-- 5. AKILLI EŞLEŞTİRME RPC FONKSİYONU (4001 ve Tüm Kriterler Dahil)
CREATE OR REPLACE FUNCTION public.get_matched_positions(p_user_id UUID)
RETURNS TABLE (
  position_id UUID,
  announcement_id UUID,
  institution_name TEXT,
  announcement_title TEXT,
  position_title TEXT,
  quota INTEGER,
  application_end_date TIMESTAMPTZ,
  min_kpss_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  u public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO u FROM public.profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT 
    jp.id AS position_id,
    a.id AS announcement_id,
    a.institution_name,
    a.title AS announcement_title,
    jp.position_title,
    jp.quota,
    a.application_end_date,
    jp.min_kpss_score
  FROM public.job_positions jp
  JOIN public.announcements a ON a.id = jp.announcement_id
  LEFT JOIN public.user_job_interactions uji 
    ON uji.job_position_id = jp.id AND uji.user_id = p_user_id
  WHERE a.status = 'published'
    AND a.application_end_date >= NOW()
    AND COALESCE(uji.is_hidden, false) = false
    -- Eğitim ve 4001 Düz Memurluk Kontrolü
    AND jp.education_level = u.primary_education_level
    AND (jp.is_general_degree = true OR jp.allowed_departments && u.departments)
    -- KPSS Puanı Kontrolü
    AND (jp.requires_kpss = false OR (u.has_kpss = true AND u.kpss_score >= jp.min_kpss_score))
    -- Yaş ve Fiziki Şartlar
    AND (u.age IS NULL OR (u.age >= jp.min_age AND u.age <= jp.max_age))
    AND (u.gender IS NULL OR u.gender = ANY(jp.allowed_genders))
    AND (
      u.height IS NULL OR
      (u.gender = 'Erkek' AND u.height >= jp.min_height_male) OR
      (u.gender = 'Kadın' AND u.height >= jp.min_height_female)
    )
    -- Ehliyet ve SGK
    AND (jp.required_licenses <@ u.driver_licenses)
    AND (jp.requires_security_card = false OR u.has_security_card = true)
    AND (u.sgk_prim_days >= jp.min_sgk_days);
END;
$$;
```

---

## 5. API ve Sunucu Maliyet Analizi

* **Gemini 2.5 Flash API (PDF Ayrıştırma):** Günde ortalama 20 yeni ilan $\rightarrow$ Aylık ~600 ilan $\rightarrow$ **Aylık Toplam Maliyet: $\approx \$0.99$**.
* **Supabase & Altyapı:** Başlangıçta ücretsiz tier, sonrasında düşük maliyetli Pro plan (`$25/ay`).
* **Toplam Gider:** Projenin ilk aşamasında sunucu giderleri neredeyse sıfıra yakındır.

---

## 6. Cursor IDE İçin Yeni Klasör Yapısı

```
kpss-atama-app/
├── app/
│   ├── (onboarding)/             # 5 Adımlı Minimalist Onboarding Akışı
│   ├── (tabs)/                   # Alt Navigasyon (Ana Sayfa, İlanlar, Bildirimler, Profil, Hesap)
│   ├── paywall.tsx               # 99.99 TL / 249.99 TL / 799.99 TL RevenueCat Paywall Ekranı
│   └── job-detail.tsx            # İlan detay ve başvuru şartları modalı
├── components/                   # Modern UI bileşenleri (GlassCard, CustomButton vb.)
├── lib/                          # Supabase ve RevenueCat entegrasyonları
└── PROJECT_SPEC.md               # Bu güncel doküman
```

### Cursor IDE'ye Verilecek Yeni Prompt Önerisi:
> `@PROJECT_SPEC.md dosyasını incele. Eski modülleri (CV, mesajlar, kpss planı vb.) tamamen unut. Tasarımı çok daha şık, minimalist, fintech tarzında (Apple/Stripe estetiği, yumuşak gölgeler, modern kartlar) yeniden yapılandır. Onboarding akışını, minimalist Ana Sayfa (Dashboard) tasarımı ve RevenueCat Paywall ekranını bu standartlarda kodla.`