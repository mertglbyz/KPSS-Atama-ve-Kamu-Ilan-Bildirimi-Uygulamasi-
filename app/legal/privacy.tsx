import { Text } from 'react-native';
import { BackButton, Screen, Title } from '@/components/ui';

function Block({ heading, body }: { heading: string; body: string }) {
  return (
    <>
      <Text className="mb-1 mt-5 text-base font-semibold text-ink dark:text-white">{heading}</Text>
      <Text className="text-sm leading-6 text-ink dark:text-slate-200">{body}</Text>
    </>
  );
}

export default function PrivacyScreen() {
  return (
    <Screen>
      <BackButton fallback="/paywall" />
      <Title subtitle="Yürürlük: 19 Ekim 2026">Gizlilik politikası</Title>
      <Text className="text-sm leading-6 text-ink dark:text-slate-200">
        Bu politika KPSS Atama uygulaması için geçerlidir. Veri sorumlusu: Mert Gülbeyaz. Başvuru adresi: gulbeyazm6@gmail.com.
      </Text>
      <Block
        heading="İşlenen veriler"
        body="Takma ad, yaş, boy, kilo, cinsiyet, yaşadığın il, öğrenim düzeyi, bölüm, KPSS puan türü ve puanı, ek KPSS puanları, YDS, ALES, ehliyet sınıfı, engellilik, güvenlik kartı, öğrencilik, SGK prim günü, sertifika, bildirim tercihi ve bildirim anahtarı. E-posta ve şifre toplanmaz. Ödeme kartı bilgisi uygulamada tutulmaz."
      />
      <Block
        heading="Amaç"
        body="Veriler, ilan şartlarıyla profilini karşılaştırmak, uygun ilanı göstermek ve bildirim göndermek için işlenir. Puan sırası yalnızca aynı bölümdeki sıralamayı göstermek için kullanılır. Başka bir adayın kimliği paylaşılmaz. Veriler satılmaz."
      />
      <Block
        heading="Hukuki sebep ve süre"
        body="İşleme, uygulamanın çalışması ve abonelik sözleşmesinin ifası için gerekir. Profil, hesabı silene kadar veya silme talebinden sonra makul süre içinde tutulur. Yasal saklama yükümlülüğü varsa o süre uygulanır."
      />
      <Block
        heading="Aktarılan hizmetler"
        body="Profil Supabase altyapısında tutulur. Bildirim Expo üzerinden iletilir. Abonelik doğrulaması Apple, Google ve RevenueCat üzerinden yapılır. Bu hizmetler veriyi kendi sözleşmelerine göre işler."
      />
      <Block
        heading="Hakların"
        body="6698 sayılı Kanun kapsamındaki erişim, düzeltme, silme ve itiraz taleplerini gulbeyazm6@gmail.com adresine yazabilirsin. Başvurular en geç otuz gün içinde yanıtlanır."
      />
    </Screen>
  );
}
