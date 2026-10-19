import { Text } from 'react-native';
import { Screen } from '@/components/ui';

export default function PrivacyScreen() {
  return (
    <Screen>
      <Text className="text-base leading-6 text-ink dark:text-slate-100">
        Bu metin yayına hazır bir gizlilik politikası değildir. Avukatının onayından sonra mağaza başvurusunda kullanacağın kalıcı adrese taşı.
        {'\n\n'}
        Uygulama; takma ad, yaş, boy, kilo, cinsiyet, il, eğitim, KPSS ve diğer sınav puanları, ehliyet, engellilik, güvenlik kartı, öğrencilik, SGK günü, sertifika ve bildirim tercihlerini eşleştirme için işler.
        {'\n\n'}
        Hesap Supabase Auth ile tutulur. Abonelik durumu RevenueCat üzerinden Apple veya Google hesabına bağlıdır. Anlık bildirim için Expo push token profiline yazılır.
        {'\n\n'}
        Rakip sıralaması yalnızca aynı bölümdeki puanların sırasını gösterir; diğer adayların adı veya e-postası paylaşılmaz. Ödeme kartı bilgisi bu uygulamada tutulmaz.
      </Text>
    </Screen>
  );
}
