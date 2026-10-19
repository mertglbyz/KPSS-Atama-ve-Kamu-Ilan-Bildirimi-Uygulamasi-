# KPSS Atama

Kamu personel ilanlarını toplayan, profille eşleştiren ve Pro abonelere bildirim gönderen Expo uygulaması.

Anahtar yokken uygulama örnek veriyle açılır. Canlı ilan, ödeme ve push için aşağıdaki hesaplar gerekir. Ayrıntılı kurulum adımları proje sahibinin yapacakları listesindedir; kod bu depoya hazır bağlanmıştır.

## Çalıştırma

```bash
npm install
cp .env.example .env
npx expo start
```

Web için `npm run web`. Satın alma Expo Go içinde çalışmaz; mağaza derlemesi `eas build` ile alınır.

## Parçalar

- `app/` Expo Router ekranları: giriş, 5 adımlı profil, ana sayfa, ilanlar, paywall, araçlar
- `supabase/migrations` şema, RLS ve eşleştirme fonksiyonları
- `supabase/functions` yeni ilan bildirimi, RevenueCat webhook, hesap silme
- `scraper-worker` ilan.gov.tr ve kamu sayfaları + Gemini ayrıştırma
- `.github/workflows/scrape-announcements.yml` dört saatte bir kazıma

## Gizli anahtarlar

`EXPO_PUBLIC_` ile başlayan değerler uygulamaya gömülür. Servis rolü anahtarı, Gemini anahtarı ve RevenueCat webhook sırrı yalnızca sunucu tarafında durur.
