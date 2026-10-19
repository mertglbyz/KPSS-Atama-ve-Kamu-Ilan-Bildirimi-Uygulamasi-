# KPSS Atama

Türkiye’deki kamu personel ilanlarını toplayan, adayın profiliyle eşleştiren ve Pro abonelere anlık bildirim gönderen mobil uygulama. Giriş ekranı yoktur. Profil bu cihazda tutulur.

Tasarım, kalabalık araç menüsü yerine tek bakışta “profilime uygun kaç ilan var?” sorusuna cevap veren sade bir fintech düzenidir: gece mavisi (`#0F172A`), indigo (`#2563EB`), mint (`#10B981`) ve açık gri zemin (`#F8FAFC`). Karanlık zemin `#090D16`.

## Ne var, ne yok

Çekirdek akış beş parçadır:

1. Beş adımlı profil: kişisel bilgiler, eğitim, sınav, ehliyet ve özel durum, belgeler ve SGK.
2. Ana sayfa: eşleşen ilan sayısı, son 48 saat ve rakip analizi.
3. İlanlar: tümü, bana uygun, favoriler ve gizlenenler.
4. Paywall: aylık 99,99 TL, 3 aylık 249,99 TL, yıllık 799,99 TL.
5. Bildirim tercihleri ve profil, Ayarlar ve Profil sekmelerinde.

Şu modüller kasıtlı olarak yoktur: CV oluşturma, mesajlar ve destek, KPSS çalışma planı, ikinci üniversite önerisi, ilinizdeki kurslar, takvim, taban puan arşivi ve öneri kartları. Eski teknik dokümanda geçen bu araçlar yeni arayüzde yer almaz.

Uygulamada e-posta veya şifre ile giriş yoktur. İlk açılışta profil sihirbazı gelir. Profil tamamlanınca ana sayfa açılır. “Profili sıfırla” aynı cihazdaki formu temizler.

## Teknoloji

| Katman | Seçim |
| :--- | :--- |
| Uygulama | Expo SDK 58, Expo Router, TypeScript |
| Arayüz | NativeWind 4, Lucide, Reanimated |
| Durum | Zustand (cihazda kalıcı profil) ve TanStack Query |
| Veri | Supabase PostgreSQL, Auth şeması hazır, Edge Functions |
| Kazıma | `scraper-worker`: ilan.gov.tr, kamu sayfaları, Gemini 2.5 Flash |
| Ödeme | RevenueCat (`kpss_pro_monthly`, `kpss_pro_quarterly`, `kpss_pro_yearly`, entitlement `pro`) |
| Bildirim | Expo Push, dört saatte bir GitHub Actions |

Anahtar yokken uygulama örnek ilanlarla açılır. `.env` doldurulunca ve mağaza derlemesi alınca canlı veri ve satın alma devreye girer. Satın alma Expo Go içinde çalışmaz.

## Klasörler

```text
app/(onboarding)/     5 adımlı profil
app/(tabs)/           Ana sayfa, ilanlar, bildirimler, profil, ayarlar
app/paywall.tsx       Abonelik ekranı
app/position/[id].tsx İlan ayrıntısı
components/           Kart, buton, adım çerçevesi, bölüm seçici
constants/departments.ts
                      204 ortaöğretim, 261 önlisans, 351 lisans bölümü
lib/                  Eşleştirme, Supabase, RevenueCat, demo veri
store/                Profil ve cihaz kimliği
supabase/migrations/  Şema, RLS, eşleştirme fonksiyonları
supabase/functions/   Yeni ilan bildirimi, RevenueCat webhook, hesap silme
scraper-worker/       İlan toplama ve PDF ayrıştırma
.github/workflows/    Dört saatte bir kazıma
```

Ortaöğretim listesi MEB mesleki alan ve dalları ile lise türlerini kapsar. Önlisans ve lisans listesi YÖK Atlas program gruplarından gelir. Eğitim adımındaki arama bu listenin tamamında çalışır.

## Yerelde çalıştırma

```bash
npm install
copy .env.example .env
npm start
```

Web için `npm run web`. Tür denetimi `npm run typecheck`. Eşleştirme kontrolü `npx tsx scripts/check-match.ts`.

Windows’ta `copy` kullanın. macOS ve Linux’ta `cp .env.example .env`.

Anahtarlar boşken kayıt ekranı çıkmaz. Profili doldurunca örnek eşleşme sayısı görünür. “Örnek modda Pro arayüzünü önizle” gerçek satın alma değildir; yalnızca kilitli kadro ayrıntısını bu cihazda açar.

## Ortam değişkenleri

Uygulama yalnızca `EXPO_PUBLIC_` ile başlayan değerleri görür. Bunlar mağaza derlemesine gömülür. Servis rolü, Gemini ve webhook sırrı mobil koda yazılmaz.

`.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=https://PROJE.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=anon-veya-publishable-anahtar
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
```

GitHub Actions sırları:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```

Edge Function sırrı, Supabase panelinde:

```text
REVENUECAT_WEBHOOK_SECRET
```

## Supabase

1. Yeni proje açın.
2. SQL Editor’da `supabase/migrations/20261019170000_init.sql` dosyasının tamamını çalıştırın. Bu dosya profilleri, ilanları, eşleştirmeyi ve satır güvenliğini kurar. İsterseniz ardından `supabase/seed.sql` ile örnek kadro ekleyin.
3. Authentication içinde e-posta sağlayıcısını geliştirme için doğrulamasız bırakabilirsiniz. Uygulama şu an oturum açmaz; şema ileride hesap bağlamak için durur.
4. Project Settings → API içinden URL, anon anahtar ve service role anahtarını alın. Service role yalnızca kazıyıcı ve fonksiyonlarda kullanılır.
5. Üç fonksiyonu yayınlayın: `notify-matches`, `revenuecat-webhook`, `delete-account`.
6. Database → Webhooks ile `public.job_positions` INSERT olayını `notify-matches` fonksiyonuna, service role anahtarıyla bağlayın.

Eşleştirme eğitim seviyesi, bölüm veya 4001 genel kadro, KPSS türü ve puan, yaş, cinsiyet, boy, ehliyet, güvenlik kartı, engel, SGK günü, sertifika, il ve YDS şartlarına bakar. Ücretsiz planda ana sayfa sayıyı gösterir. Kadro şartı, “bana uygun” listesi, anlık bildirim ve ayrıntılı rakip sırası Pro’dadır. Kullanıcı `is_premium` alanını kendi isteğiyle güncelleyemez.

`Lise` ve `Ortaöğretim` eşleştirmede aynı seviye sayılır. Arayüz “Ortaöğretim” yazar.

## RevenueCat, Apple ve Google

1. Apple Developer (yıllık 99 USD) ve Google Play Console (tek seferlik 25 USD) hesaplarını açın.
2. Paket kimliği `com.mertglbyz.kpssatama`.
3. Üç aboneliği her iki mağazada oluşturun: `kpss_pro_monthly` 99,99 TL, `kpss_pro_quarterly` 249,99 TL, `kpss_pro_yearly` 799,99 TL.
4. RevenueCat’te entitlement adı tam olarak `pro` olsun. Üç ürün tek offering içinde durur. Yıllık paket varsayılan seçilidir.
5. Public SDK anahtarlarını `.env` dosyasına yazın.
6. Webhook adresi `https://PROJE.supabase.co/functions/v1/revenuecat-webhook`. Authorization başlığı `Bearer` ve webhook sırrıdır.
7. Derleme: `npm install -g eas-cli`, `eas login`, `eas build`. Önce sandbox satın alma deneyin.

Mağaza fiyatı, ekrandaki vitrin fiyatının önüne geçer. Kart bilgisi uygulamada tutulmaz.

## Kazıyıcı

`scraper-worker` ilan.gov.tr `AdsByFilter` ucunu ve kariyer kapısı, kamu ilan, yerel yönetimler ve İŞKUR sayfalarını dener. Yeni kaydı Gemini 2.5 Flash ile kadro satırlarına ayırır, Supabase’e yazar ve Pro kullanıcılara Expo push gönderir. Bir kaynak hata verirse tur durmaz.

Elle deneme:

```bash
cd scraper-worker
copy .env.example .env
npm install
npm run scrape
```

GitHub Actions workflow’u `.github/workflows/scrape-announcements.yml` her dört saatte bir ve elle çalışır. `ilan.gov.tr` bazı ağlarda 403 döner. Actions logunda 403 görürseniz kazıyıcıyı bir VPS’e alın.

## Eşleştirmenin bu cihazda kalması

Profil Zustand ile AsyncStorage’da durur. Cihaz kimliği satın alma ve bildirim anahtarı için üretilir. Supabase anahtarı olsa bile uygulama oturum açmadığı için ilan listesi ve eşleşme örnek veriden gelir. Canlı katalog, kullanıcı hesabı bağlandığında `get_matched_positions` ve `list_job_cards` fonksiyonlarıyla açılır. Bu kasıtlıdır: giriş ekranı yoktur.

## Sizin tamamlamanız gerekenler

- Supabase projesini açıp migration SQL’ini çalıştırmak.
- `.env` içine anon anahtarı ve URL yazmak. Service role’u uygulamaya koymamak.
- Edge function’ları yayınlayıp webhook sırrını ve veritabanı webhook’unu bağlamak.
- App Store Connect ve Play Console ürünlerini RevenueCat entitlement `pro` ile eşlemek.
- Gemini anahtarını ve Supabase service role’u GitHub Actions sırlarına eklemek.
- Gizlilik ve kullanım metinlerini avukata onaylatıp mağazanın istediği herkese açık adreste yayınlamak. Uygulama içindeki metinler taslaktır.
- İlk kazıma turunu elle çalıştırıp 403 olup olmadığına bakmak.

## Doğrulama

`npm run typecheck` tür denetimini çalıştırır. Web’de profil, ana sayfa, ilan araması ve paywall uçtan uca açılır. Mint renkli “Uygun ilanları keşfet” butonu ücretsiz planda paywall’a, Pro planda eşleşen ilanlara gider.
