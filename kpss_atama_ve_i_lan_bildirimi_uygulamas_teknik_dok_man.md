# 📱 KPSS Atama ve Kamu İlan Bildirimi Uygulaması - Kapsamlı Proje Dokümanı (PRD & Teknik Mimari)

Bu doküman, Türkiye'deki kamu personel alımı ilanlarını (Memur, Sözleşmeli Personel, Kamu İşçisi, Akademik, Askeri/Polis/Zabıta) resmi kaynaklardan otomatik toplayan, PDF kılavuzlarını yapay zeka ile ayrıştıran ve kullanıcının profil bilgileriyle (KPSS puanı, bölüm, yaş, boy/kilo, ehliyet, SGK günü vb.) eşleştirerek anlık bildirim gönderen mobil uygulamanın uçtan uca teknik ve işlevsel rehberidir.

---

## 1. İş Modeli, Abonelik Paketleri ve Gelir Yapısı (Monetization)

* **Model:** Freemium (Ücretsiz İndirme + Onboarding Sonrası Paywall).
* **Mağaza ve Vergi Kesintisi:** Apple App Store / Google Play Store komisyonları, KDV ve stopaj dahil toplam kesinti oranı **$\%40$** olarak hesaplanmıştır (Geliştiriciye kalan net gelir oranı: **$\%60$**).

### 1.1. Abonelik Paketleri ve Net Gelir Tablosu (RevenueCat Yapılandırması)

| Paket Adı | RevenueCat Product ID | Satış Fiyatı (Brüt) | Aylık Denkliği | Kullanıcı Tasarrufu | Kesinti ($\%40$) | Net Kalan Gelir ($\%60$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aylık Paket** | `kpss_pro_monthly` | $99.99\text{ TL}$ | $99.99\text{ TL / Ay}$ | Standart | $40.00\text{ TL}$ | **$59.99\text{ TL}$** |
| **3 Aylık Paket** | `kpss_pro_quarterly` | $249.99\text{ TL}$ | $83.33\text{ TL / Ay}$ | $\%17\text{ İndirim}$ | $100.00\text{ TL}$ | **$149.99\text{ TL}$** |
| **1 Yıllık Paket** | `kpss_pro_yearly` | $799.99\text{ TL}$ | $66.66\text{ TL / Ay}$ | $\%33\text{ İndirim}$ | $320.00\text{ TL}$ | **$479.99\text{ TL}$** |

> **Paywall (Ödeme Ekranı) Stratejisi:** Paywall ekranında **3 Aylık ($249.99\text{ TL}$)** veya **1 Yıllık ($799.99\text{ TL}$)** paket varsayılan olarak seçili (Highlighted / "En Popüler" veya "En Avantajlı" rozetiyle) gelir. KPSS hazırlık ve tercih süreci ortalama 6-12 ay sürdüğü için kullanıcıların 3 aylık ve yıllık paketlere yönelmesi teşvik edilir.

### 1.2. Psikolojik Dönüşüm Kurgusu (User Funnel)

1. Kullanıcı uygulamayı indirir ve 5 adımlı detaylı **Onboarding** sürecinde tüm kişisel, eğitim, sınav ve belge bilgilerini girer (Zaman Yatırımı / Sunk Cost Etkisi).
2. Sistem arka planda gerçek veritabanı sorgusunu çalıştırır ve kullanıcıya: *"Profiline uygun **6 kurumda 15 güncel ilan** bulundu! Başvurusu bitmek üzere olan **1 ilan** var."* mesajını gösterir.
3. Kullanıcı **"Uygun İlanları Keşfet"** butonuna tıkladığında veya anlık bildirimleri aktif etmek istediğinde **Paywall (Abonelik Ekranı)** açılır.
4. Ücretsiz kullanıcılar genel araçları (Rakip Analizi, KPSS Planı, Taban Puanlar) kısıtlı görebilir; ancak **Kişiye Özel Eşleşen İlan Detayları** ve **Anlık Push Bildirimleri** sadece Pro abonelere açıktır.

---

## 2. Teknoloji Yığını (Vibe Coding & Cursor IDE Uyumlu)

Cursor IDE ile en hızlı ve hatasız kod üretimi için **Full-Stack TypeScript** mimarisi seçilmiştir:

* **Mobil Uygulama (Frontend):** React Native (Expo SDK 52+), Expo Router (Dosya tabanlı navigasyon), TypeScript.
* **UI & Tasarım:** NativeWind v4 (Tailwind CSS), Lucide React Native (İkonlar), React Native Reanimated (Akıcı geçişler ve Paywall animasyonları).
* **Durum Yönetimi & Veri Çekme:** Zustand (Global State) + TanStack Query (React Query - önbellekleme ve hızlı veri yönetimi).
* **Backend & Veritabanı:** Supabase (PostgreSQL, Supabase Auth, Edge Functions, `pg_cron`).
* **İlan Kazıma (Scraper) & AI Ayrıştırma:** Node.js (TypeScript) + Playwright/Cheerio + **Google Gemini 2.5 Flash API** (`responseSchema` ile PDF'ten doğrudan JSON üretimi).
* **Ödeme & Abonelik Yönetimi:** RevenueCat (`react-native-purchases` ve `react-native-purchases-ui`).
* **Anlık Bildirimler:** Expo Push Notifications + Supabase Webhook / Edge Functions.

---

## 3. Uygulama Ekranları ve Tüm İşlevler (Fonksiyonel Gereksinimler)

### 3.1. Onboarding ve Profil Düzenleme (5 Adımlı Sihirbaz)

Kullanıcı ilk kayıtta veya "Profil -> Profili Düzenle" menüsünde 5 adımlı (`1/5` -> `5/5`) ilerleme çubuğuna sahip şu formları doldurur:

1. **Adım 1/5 - Kişisel Bilgiler:**
   * `Takma Ad (Nickname)`: Gerçek isim zorunlu değildir (Örn: `mertglbyz` - Rakip analizinde anonimlik sağlar).
   * `Yaş`: Sayısal (Zabıta, koruma ve güvenlik, uzman erbaş vb. yaş şartlı ilanlar için zorunlu).
   * `Boy (cm)` ve `Kilo (kg - İsteğe Bağlı)`: Fiziki yeterlilik ve boy/kilo endeksi şartı olan kadrolar için.
   * `Cinsiyet`: Erkek / Kadın (Cinsiyete özel boy şartları ve yurt yönetim memuru gibi cinsiyet ayrımlı kadrolar için).
   * `İl`: Kullanıcının yaşadığı şehir (Yerel işçi alımları, İŞKUR ikametgah şartlı ilanlar ve "İlinizdeki Kurslar" için).

2. **Adım 2/5 - Eğitim Bilgileri:**
   * `Temel Eğitim Seviyesi`: Ortaöğretim (Lise), Önlisans, Lisans (KPSS puanının ait olduğu seviye).
   * `Bölüm`: Seçilen seviyeye ait bölüm listesi (Örn: `Yazılım Mühendisliği`).
   * `+ Başka Eğitim Ekle`: Kullanıcının bitirdiği ikinci üniversite veya üst öğrenim varsa eklemesini sağlar (İlan filtresi tüm mezuniyetleri dikkate alır).

3. **Adım 3/5 - Sınav Bilgileri:**
   * `KPSS Durumu`: "Puanım Yok" / "Puanım Var" seçimi (KPSS şartsız kamu işçisi veya kura ilanları için "Puanım Yok" seçilebilir).
   * `KPSS Puan Türü`: Lisans (`P3`, `P1`, `P2` vb.), Önlisans (`P93`), Ortaöğretim (`P94`).
   * `KPSS Puanı`: Ondalıklı sayı (Örn: `81,1288`).
   * `Diğer Sınav Puanları (İsteğe Bağlı)`: `YDS Puanı` ve `ALES Puanı`.

4. **Adım 4/5 - Ek Bilgiler (Ehliyet ve Özel Durumlar):**
   * `Ehliyet Sınıfları`: Çoklu seçim butonları (`A`, `B`, `C`, `D`, `E`, `F`, `G`, `M`, `T`).
   * `Özel Durumlar (Toggle Switch'ler)`:
     * `Engelli Durumu`: EKPSS veya engelli işçi kadroları için.
     * `Güvenlik Görevlisi Kartı`: Silahlı veya silahsız özel güvenlik kimlik kartı olanlar için.
     * `Öğrencilik Durumu`: Örgün veya açıköğretim aktif öğrenci kaydı.
     * `Sigortalı Çalışma Geçmişi (SGK)`: Deneyim veya prim günü şartlı ilanlar için.

5. **Adım 5/5 - Belgeler / Sertifikalar ve SGK Prim Günü:**
   * Kullanıcının sahip olduğu MEB onaylı sertifikalar (Bilgisayar İşletmenliği, Kalorifer Ateşçiliği, İlk Yardım, SRC Belgeleri vb.) ve toplam SGK prim günü sayısı.

### 3.2. Paywall (Abonelik) Ekranı Bileşenleri

Onboarding bittiğinde veya ücretsiz kullanıcı kilitli bir özelliğe tıkladığında açılan ekran:
* **Dinamik Başlık:** *"Profiline uygun [X] güncel ilanı kaçırma!"*
* **Değer Önerileri (Checklist):**
  * "Profilinle $\%100$ eşleşen memur, sözleşmeli ve işçi ilanları"
  * "Yeni ilan yayınlandığında saniyeler içinde anlık bildirim"
  * "Son 48 saat başvuru bitiş hatırlatıcıları"
  * "Detaylı rakip analizi ve taban puan istatistikleri"
* **Paket Seçim Kartları:**
  * **1 Yıllık:** $799.99\text{ TL}$ (Aylık $66.66\text{ TL}$'ye gelir - **$\%33$ İndirim / En Avantajlı** rozeti)
  * **3 Aylık:** $249.99\text{ TL}$ (Aylık $83.33\text{ TL}$'ye gelir - **En Popüler** rozeti)
  * **Aylık:** $99.99\text{ TL}$ (İstediğin zaman iptal et)
* **Alt Bilgi:** "Satın Alımları Geri Yükle (Restore Purchases)", Kullanım Koşulları ve Gizlilik Politikası linkleri (App Store onayı için zorunlu).

### 3.3. Ana Sayfa (Dashboard) Bileşenleri

* **Üst Bilgi (Header):** Kullanıcı avatarı (baş harf), "İyi günler [kullanıcı_adı]" ve sağ üstte "Mesajlar / Destek" butonu.
* **Ana Eşleşme Kartı (Hero Card):**
  * Büyük fontla eşleşen toplam alt kadro sayısı (Örn: `15`) ve yanında `+ Bugün X yeni` rozeti.
  * Alt açıklama: *"6 kurumun güncel ilanlarını keşfet."*
  * CTA Butonu: **"Uygun ilanları keşfet ->"**
  * Kartın hemen altında: `Gizlenen ilanlar (0)` kısayolu.
* **Sistem Durum Bilgisi:** *"Son başarılı güncelleme: GG.AA.YYYY SS:DD"* (Kullanıcıya sistemin sürekli canlı ve güncel olduğu güvenini verir).
* **Acil Uyarı Kartı (FOMO):**
  * `SON 48 SAAT [X İLAN]`: *"Başvurusu bitmek üzere olan uygun ilanları kaçırma."* (Kırmızı/Turuncu dikkat çekici kart).
* **Profil Tamamlama Hatırlatıcısı:**
  * Örn: *"SGK geçmişini ekle - SGK şartı olan ilanları doğru görmek için prim gününü yaz. [Ekle]"*
* **Hızlı Menü (Grid Kartlar - "Tüm araçları gör / Daha az göster" Açılır Yapı):**
  1. **Sonuçlarım:** Kullanıcının "Başvurdum" olarak işaretlediği veya kaydettiği ilanların sonuç açıklama takibi.
  2. **Takvim:** Güncel ilanların başvuru başlangıç/bitiş ve sınav tarihlerinin takvim görünümü.
  3. **Taban Puanlar:** ÖSYM merkezi atama (KPSS-1 / KPSS-2) ve kurumsal alımların geçmiş yıllardaki minimum kapanış puanları.
  4. **KPSS Planı:** Hedef puana göre çalışma ve konu takip aracı.
  5. **CV Oluştur:** Kamu ve belediye şirket başvurularında (İŞKUR kurum dışı kamu işçi alımları) istenen standart özgeçmiş PDF oluşturucu.
  6. **Mesajlar:** Uygulama içi başvuru desteği ve soru-cevap alanı.
  7. **İkinci Üniversite:** Kullanıcının mevcut bölümüne göre sınavsız okuyabileceği, ataması yüksek Açıköğretim (AÖF/ATA-AÖF/AUZEF) bölümü önerileri.
  8. **Önerilenler:** "Şu sertifikayı (örn. Bilgisayar İşletmenliği veya B Sınıfı Ehliyet) alırsan başvurabileceğin ilan sayısı 15'ten 28'e çıkar" şeklinde akıllı kariyer tavsiyeleri.
  9. **Geçmiş İlanlar:** Başvuru süresi dolmuş alımların arşivi.
  10. **İlinizdeki Kurslar:** Kullanıcının şehrindeki İSMEK/Halk Eğitim/Belediye sertifika kursları.
  11. **Bildirim Ayarları:** Yeni ilan, son 48 saat uyarısı ve sonuç bildirim tercihleri.
* **Rakip Analizi Kartı:**
  * Kullanıcının kendi bölümündeki (Örn: `Yazılım Mühendisliği`) uygulama içi diğer adaylar arasındaki gerçek zamanlı sıralaması (Örn: *"22 aday arasında 8. sıradasınız | KPSS Puanı: 81,13"*).
  * "Puan dağılımını göster" (Grafik/Histogram) ve "Analizi incele" butonu.

### 3.4. Alt Navigasyon (Bottom Tab Bar)

1. **Ana sayfa:** Dashboard.
2. **İlanlar:** Tüm İlanlar / Bana Uygun İlanlar / Favoriler sekmeleri ve gelişmiş filtreleme.
3. **Bildirimler:** Geçmiş push bildirimlerinin uygulama içi listesi.
4. **Profil:** 5 adımlı profil bilgilerinin özeti ve düzenleme ekranı.
5. **Hesap:** Abonelik durumu (RevenueCat müşteri yönetimi), karanlık mod, gizlilik politikası, çıkış yap.

---

## 4. Supabase Veritabanı Şeması (SQL) ve Eşleştirme Motoru

Aşağıdaki SQL kodunu Supabase **SQL Editor** ekranına yapıştırarak tüm veritabanı yapısını ve eşleştirme fonksiyonlarını tek seferde kurabilirsin:

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
  departments TEXT[] DEFAULT '{}', -- Örn: ARRAY['Yazılım Mühendisliği', 'Bilgisayar Programcılığı']
  
  -- Sınav
  has_kpss BOOLEAN DEFAULT false,
  kpss_type TEXT DEFAULT 'P3', -- P3, P93, P94
  kpss_score NUMERIC(6,4) DEFAULT 0,
  yds_score NUMERIC(5,2) DEFAULT 0,
  ales_score NUMERIC(6,4) DEFAULT 0,
  
  -- Ek Bilgiler & Özel Durumlar
  driver_licenses TEXT[] DEFAULT '{}', -- Örn: ARRAY['B']
  is_disabled BOOLEAN DEFAULT false,
  has_security_card BOOLEAN DEFAULT false,
  security_card_type TEXT CHECK (security_card_type IN ('Yok', 'Silahsız', 'Silahlı')) DEFAULT 'Yok',
  is_student BOOLEAN DEFAULT false,
  has_sgk_history BOOLEAN DEFAULT false,
  sgk_prim_days INTEGER DEFAULT 0,
  certificates TEXT[] DEFAULT '{}',
  
  -- Abonelik ve Bildirim
  is_premium BOOLEAN DEFAULT false,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'monthly', 'quarterly', 'yearly')) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KURUM DUYURULARI (ÜST TABLO - Örn: "Adalet Bakanlığı 1.200 Personel Alımı")
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name TEXT NOT NULL, -- Örn: "Adalet Bakanlığı"
  title TEXT NOT NULL,
  source_name TEXT, -- 'kariyerkapisi', 'ilan_gov_tr', 'iskur', 'resmigazete'
  source_url TEXT UNIQUE,
  pdf_url TEXT,
  application_start_date TIMESTAMPTZ,
  application_end_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ALT KADROLAR VE ŞARTLAR (ALT TABLO - İlanın içindeki her bir kadro satırı)
CREATE TABLE public.job_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  position_title TEXT NOT NULL, -- Örn: "Mühendis", "Büro Personeli", "Zabıta Memuru"
  quota INTEGER DEFAULT 1, -- Kontenjan
  cities TEXT[] DEFAULT '{}', -- ARRAY['İzmir', 'Ankara'] veya ARRAY['Tüm Türkiye']
  
  -- Aranan Eğitim Şartları
  education_level TEXT CHECK (education_level IN ('Lise', 'Önlisans', 'Lisans')) NOT NULL,
  is_general_degree BOOLEAN DEFAULT false, -- 4001 / Herhangi bir lisans/önlisans/lise mezunu mu?
  allowed_departments TEXT[] DEFAULT '{}', -- Özel bölüm şartı varsa
  
  -- Aranan Sınav Şartları
  requires_kpss BOOLEAN DEFAULT true,
  kpss_type TEXT, -- P3, P93, P94
  min_kpss_score NUMERIC(6,4) DEFAULT 0,
  min_yds_score NUMERIC(5,2) DEFAULT 0,
  
  -- Aranan Fiziksel ve Kişisel Şartlar
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 99, -- Örn: 35 yaşından gün almamış olmak -> 34
  allowed_genders TEXT[] DEFAULT ARRAY['Erkek', 'Kadın'],
  min_height_male INTEGER DEFAULT 0,
  min_height_female INTEGER DEFAULT 0,
  
  -- Aranan Ek Belge Şartları
  required_licenses TEXT[] DEFAULT '{}',
  requires_security_card BOOLEAN DEFAULT false,
  requires_disability BOOLEAN DEFAULT false,
  min_sgk_days INTEGER DEFAULT 0,
  required_certificates TEXT[] DEFAULT '{}',
  raw_requirements_text TEXT, -- Yapay zekanın çıkardığı orijinal şart metni
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GİZLENEN VE KAYDEDİLEN İLANLAR
CREATE TABLE public.user_job_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_position_id UUID REFERENCES public.job_positions(id) ON DELETE CASCADE,
  is_hidden BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  application_status TEXT CHECK (application_status IN ('none', 'applied', 'accepted', 'rejected')) DEFAULT 'none',
  UNIQUE(user_id, job_position_id)
);

-- 5. KULLANICIYA UYGUN İLANLARI EŞLEŞTİREN RPC FONKSİYONU
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
    -- 1. Eğitim Seviyesi ve Bölüm Eşleşmesi (4001 Düz Memurluk Dahil)
    AND jp.education_level = u.primary_education_level
    AND (jp.is_general_degree = true OR jp.allowed_departments && u.departments)
    -- 2. KPSS Puan Eşleşmesi
    AND (jp.requires_kpss = false OR (u.has_kpss = true AND u.kpss_score >= jp.min_kpss_score))
    -- 3. Yaş Eşleşmesi
    AND (u.age IS NULL OR (u.age >= jp.min_age AND u.age <= jp.max_age))
    -- 4. Cinsiyet ve Boy Eşleşmesi
    AND (u.gender IS NULL OR u.gender = ANY(jp.allowed_genders))
    AND (
      u.height IS NULL OR
      (u.gender = 'Erkek' AND u.height >= jp.min_height_male) OR
      (u.gender = 'Kadın' AND u.height >= jp.min_height_female)
    )
    -- 5. Ehliyet Eşleşmesi (İstenen ehliyetler kullanıcının ehliyetlerinde var mı?)
    AND (jp.required_licenses <@ u.driver_licenses)
    -- 6. Özel Güvenlik, Engelli ve SGK Şartları
    AND (jp.requires_security_card = false OR u.has_security_card = true)
    AND (jp.requires_disability = false OR u.is_disabled = true)
    AND (u.sgk_prim_days >= jp.min_sgk_days);
END;
$$;

-- 6. RAKİP ANALİZİ RPC FONKSİYONU (Bölüm Bazında Sıralama)
CREATE OR REPLACE FUNCTION public.get_competitor_rank(p_user_id UUID, p_department TEXT)
RETURNS TABLE (
  total_candidates BIGINT,
  user_rank BIGINT,
  user_score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH ranked_users AS (
    SELECT 
      id,
      kpss_score,
      RANK() OVER (ORDER BY kpss_score DESC) as rnk,
      COUNT(*) OVER () as total_cnt
    FROM public.profiles
    WHERE p_department = ANY(departments)
      AND has_kpss = true
      AND kpss_score > 0
  )
  SELECT total_cnt, rnk, kpss_score
  FROM ranked_users
  WHERE id = p_user_id;
$$;
```

---

## 5. Otomatik Veri Çekme (Scraper) ve AI PDF Ayrıştırma Mimarisi

Kamu sitelerinde ilanlar metin veya PDF tablosu içinde yayınlandığı için **2 aşamalı bir Boru Hattı (Pipeline)** kullanılır:

### 5.1. Hedef Kaynaklar ve Çekim Yöntemi

1. **`ilan.gov.tr` (Basın İlan Kurumu):** "Personel Alımı" kategorisinin arka plan JSON endpoint'i her 4 saatte bir taranır.
2. **`kamuilan.sbb.gov.tr` & `isealimkariyerkapisi.cbiko.gov.tr`:** Yeni duyuru linkleri ve PDF ekleri indirilir.
3. **`yerelyonetimler.csb.gov.tr` & `iskur.gov.tr`:** Belediye zabıta, itfaiye ve kamu işçisi alımı duyuruları çekilir.

### 5.2. Gemini 2.5 Flash ile PDF ve Tablo Okuma (`responseSchema`)

İndirilen PDF veya HTML tablo, doğrudan **Google Gemini 2.5 Flash API**'ye gönderilir. Gemini, PDF içindeki karmaşık tabloları görsel ve metinsel olarak okuyup doğrudan `job_positions` tablosuna uygun JSON dizisi üretir:

```typescript
// scraper-worker/parsePdfWithGemini.ts
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseJobAnnouncementPdf(pdfBuffer: Buffer, announcementText: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      `Aşağıdaki kamu personel alımı ilan metnini ve ekteki PDF kılavuzunu analiz et.
       İlandaki her bir kadro/unvan satırını ayrı bir JSON öğesi olarak çıkar.
       Bölüm isimlerini standartlaştır (Örn: 'Yazılım Mühendisliği', 'Bilgisayar Mühendisliği').
       Eğer 'Herhangi bir lisans programından mezun olmak' diyorsa is_general_degree = true yap.
       Ek Metin: ${announcementText}`
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          institution_name: { type: Type.STRING },
          application_start_date: { type: Type.STRING },
          application_end_date: { type: Type.STRING },
          positions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                position_title: { type: Type.STRING },
                quota: { type: Type.INTEGER },
                cities: { type: Type.ARRAY, items: { type: Type.STRING } },
                education_level: { type: Type.STRING, enum: ["Lise", "Önlisans", "Lisans"] },
                is_general_degree: { type: Type.BOOLEAN },
                allowed_departments: { type: Type.ARRAY, items: { type: Type.STRING } },
                requires_kpss: { type: Type.BOOLEAN },
                kpss_type: { type: Type.STRING },
                min_kpss_score: { type: Type.NUMBER },
                min_age: { type: Type.INTEGER },
                max_age: { type: Type.INTEGER },
                min_height_male: { type: Type.INTEGER },
                min_height_female: { type: Type.INTEGER },
                required_licenses: { type: Type.ARRAY, items: { type: Type.STRING } },
                requires_security_card: { type: Type.BOOLEAN },
                requires_disability: { type: Type.BOOLEAN },
                min_sgk_days: { type: Type.INTEGER },
                raw_requirements_text: { type: Type.STRING }
              },
              required: ["position_title", "education_level", "is_general_degree"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text!);
}
```

---

## 6. API, Sunucu Maliyet Analizi ve Net Kârlılık Simülasyonu

Bu uygulamanın en büyük avantajı, **yapay zekanın her kullanıcı için ayrı ayrı değil, sadece yeni bir kamu ilanı yayınlandığında (merkezi olarak 1 kez)** çalışmasıdır. İlan bir kez ayrıştırılıp Supabase'e kaydedildikten sonra binlerce kullanıcıya ücretsiz SQL sorgusuyla sunulur.

### 6.1. Yapay Zeka (Gemini 2.5 Flash API) Maliyeti

* Türkiye'de günde ortalama $15$ ile $25$ arasında yeni kamu ilanı/kılavuzu yayınlanır (Ayda yaklaşık $600$ ilan).
* Ortalama bir PDF kılavuzu + ilan metni yaklaşık $5{,}000\text{ girdi token'ı (input tokens)}$ ve ayrıştırılmış JSON çıktısı yaklaşık $1{,}500\text{ çıktı token'ı (output tokens)}$ tüketir.
* Aylık toplam tüketim:

  $$
  \text{Girdi} = 600 \times 5{,}000 = 3{,}000{,}000\text{ Token (3M Token)}
  $$

  $$
  \text{Çıktı} = 600 \times 1{,}500 = 900{,}000\text{ Token (0.9M Token)}
  $$

* **Gemini 2.5 Flash Fiyatlandırması:** $1\text{ Milyon}$ girdi token'ı $\approx \$0.15$, $1\text{ Milyon}$ çıktı token'ı $\approx \$0.60$'dır.
* **Aylık Toplam AI Maliyeti:**

  $$
  \text{Maliyet} = (3 \times \$0.15) + (0.9 \times \$0.60) = \$0.45 + \$0.54 = \$0.99\text{ / Ay}
  $$

### 6.2. Tüm Altyapı Giderleri Tablosu

| Hizmet / Katman | Başlangıç Aşaması ($0 - 5{,}000$ Kullanıcı) | Büyüme Aşaması ($10{,}000 - 50{,}000$ Kullanıcı) | Açıklama |
| :--- | :--- | :--- | :--- |
| **Supabase (Veritabanı & Auth)** | $\$0\text{ / Ay}$ (Free Tier) | $\$25\text{ / Ay}$ (Pro Plan) | $500\text{ MB}$ veritabanı ve aylık $50{,}000$ aktif kullanıcıya kadar ücretsizdir. |
| **Gemini 2.5 Flash API (PDF Okuma)** | $\$0 - \$1\text{ / Ay}$ | $\$2 - \$3\text{ / Ay}$ | Ayda $600+$ PDF kılavuzu ayrıştırma maliyeti. |
| **Scraper Bot Sunucusu** | $\$0\text{ / Ay}$ (GitHub Actions) | $\$4.5\text{ / Ay}$ (Hetzner VPS) | Başlangıçta GitHub Actions Cron ile ücretsiz çalışır. |
| **RevenueCat (Ödeme Altyapısı)** | $\$0\text{ / Ay}$ | $\$0\text{ / Ay}$ | Aylık $\$2{,}500$ ciroya kadar tamamen ücretsizdir, sonrasında $\%1$ alır. |
| **Expo Push Notifications** | $\$0\text{ / Ay}$ | $\$0\text{ / Ay}$ | Anlık bildirim gönderimi tamamen ücretsizdir. |
| **Apple & Google Geliştirici Hesabı** | Google: $\$25$ (Tek seferlik) / Apple: $\$99\text{ / Yıl}$ | Sabit | Mağaza yayın maliyetleri. |
| **TOPLAM AYLIK SUNUCU GİDERİ** | **$\approx \$1\text{ / Ay}$** | **$\approx \$32\text{ / Ay}$** | Sunucu ve API maliyeti neredeyse sıfıra yakındır. |

### 6.3. $\%40$ Kesinti Sonrası Net Gelir Simülasyonu (Örnek: $500$ Aktif Satış / Ay)

Uygulamanın ayda toplam $500$ yeni abonelik satışı yakaladığı mütevazı bir senaryoda ($\%50$ Aylık, $\%30$ 3 Aylık, $\%20$ Yıllık paket dağılımı ile):

1. **Aylık Paket ($250\text{ Kullanıcı} \times 99.99\text{ TL}$):**
   * Brüt Ciro: $24{,}997.50\text{ TL}$
   * $\%40$ Kesinti Sonrası Net: **$14{,}998.50\text{ TL}$**
2. **3 Aylık Paket ($150\text{ Kullanıcı} \times 249.99\text{ TL}$):**
   * Brüt Ciro: $37{,}498.50\text{ TL}$
   * $\%40$ Kesinti Sonrası Net: **$22{,}499.10\text{ TL}$**
3. **1 Yıllık Paket ($100\text{ Kullanıcı} \times 799.99\text{ TL}$):**
   * Brüt Ciro: $79{,}999.00\text{ TL}$
   * $\%40$ Kesinti Sonrası Net: **$47{,}999.40\text{ TL}$**

* **Toplam Brüt Ciro:** $142{,}495.00\text{ TL}$
* **Toplam Kesintiler ($\%40$ Mağaza + Vergi):** $-56{,}998.00\text{ TL}$
* **Sana Kalan Net Gelir ($\%60$):** **$85{,}497.00\text{ TL / Ay}$** (Altyapı maliyeti olan $\approx \$1 - \$32$ düşüldüğünde neredeyse tamamı net kârdır).

---

## 7. Cursor IDE İçin Proje Klasör Yapısı ve Başlangıç Planı

Cursor IDE'de projeyi açtığında yapay zeka ajanının (`Composer` / `Agent` modu) aşağıdaki klasör mimarisini oluşturmasını iste:

```text
kpss-atama-app/
├── app/                          # Expo Router ekranları
│   ├── (auth)/                   # Giriş ve Kayıt ekranları
│   ├── (onboarding)/             # 5 Adımlı Onboarding Sihirbazı
│   │   ├── step1-personal.tsx    # Kişisel Bilgiler (Yaş, Boy, Kilo, İl)
│   │   ├── step2-education.tsx   # Eğitim ve Bölüm Seçimi
│   │   ├── step3-exams.tsx       # KPSS, YDS, ALES Puanları
│   │   ├── step4-details.tsx     # Ehliyet ve Özel Durum Switch'leri
│   │   └── step5-documents.tsx   # SGK Prim Günü ve Sertifikalar
│   ├── (tabs)/                   # Alt Navigasyon Sekmeleri
│   │   ├── index.tsx             # Ana Sayfa (Hero Card, Son 48 Saat, Hızlı Menü, Rakip Analizi)
│   │   ├── jobs.tsx              # Uygun İlanlar ve Filtreleme
│   │   ├── notifications.tsx     # Bildirim Geçmişi
│   │   ├── profile.tsx           # Profil Özeti ve Düzenleme
│   │   └── account.tsx           # Abonelik ve Hesap Ayarları
│   ├── paywall.tsx               # 99.99 TL / 249.99 TL / 799.99 TL Paywall Modal Ekranı
│   └── tools/                    # Hızlı Menü Araçları (Takvim, Taban Puanlar, CV Oluştur vb.)
├── components/                   # Tekrar kullanılabilir UI bileşenleri
├── lib/
│   ├── supabase.ts               # Supabase istemci bağlantısı
│   └── revenuecat.ts             # RevenueCat abonelik kontrol fonksiyonları
├── store/
│   └── useProfileStore.ts        # Zustand ile Onboarding ve kullanıcı profil state'i
├── scraper-worker/               # İlan çekici ve Gemini 2.5 Flash PDF ayrıştırıcı servis
└── PROJECT_SPEC.md               # Bu doküman (Cursor referans dosyası)
```

### Cursor IDE'ye Vereceğin İlk Prompt:
> `@PROJECT_SPEC.md dosyasını tamamen oku ve mimariyi anla. İlk adım olarak Expo Router, NativeWind v4, Zustand ve Supabase bağlantılarını içeren proje iskeletini kur. Ardından dokümandaki Bölüm 3.1'de yer alan 5 adımlı Onboarding ekranlarını ve Bölüm 3.3'teki Ana Sayfa (Dashboard) tasarımını modern, temiz bir mavi-beyaz kurumsal arayüzle kodla.`