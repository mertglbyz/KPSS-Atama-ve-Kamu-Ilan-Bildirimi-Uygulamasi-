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

export default function TermsScreen() {
  return (
    <Screen>
      <BackButton fallback="/paywall" />
      <Title subtitle="Yürürlük: 19 Ekim 2026">Kullanım koşulları</Title>
      <Text className="text-sm leading-6 text-ink dark:text-slate-200">
        Bu koşullar KPSS Atama uygulamasını kullanırken geçerlidir. Uygulamayı sunan: Mert Gülbeyaz. Yazışma: gulbeyazm6@gmail.com. Uygulama bir kamu kurumu uygulaması değildir.
      </Text>
      <Block
        heading="Hizmet"
        body="Uygulama, kamu kurumlarının yayımladığı personel ilanlarını tarar ve girdiğin profile göre listeler. Listede yer almak başvuru hakkı, sınav hakkı veya atama kararı değildir. İlanın geçerli metni, ilanın yayınlandığı resmi sitededir. Başvurudan önce o metni kontrol etmek kullanıcının sorumluluğundadır."
      />
      <Block
        heading="Güncelleme ve iptal"
        body="İlan düzeltmesi veya iptali resmi kaynakta yayımlandığında kayıt güncellenmeye çalışılır. Kaynağın gecikmesi, eksik yayını veya erişim kesintisi nedeniyle liste ile resmi metin farklı olabilir."
      />
      <Block
        heading="Profil bilgisi"
        body="Eşleşme; öğrenim, bölüm, KPSS puan türü ve puanı, yaş, boy, kilo ve ilanda yazan diğer şartlara göre yapılır. Eksik veya yanlış girilen bilgi hatalı sonuç doğurabilir."
      />
      <Block
        heading="Abonelik"
        body="Pro; aylık, üç aylık veya yıllık yenilenen bir aboneliktir. Ödeme Apple veya Google hesabından alınır. Abonelik, dönem bitiminden en az yirmi dört saat önce iptal edilmezse aynı hesap üzerinden yenilenir. İptal ve iade, satın almanın yapıldığı mağaza kurallarına tabidir. Kişiye özel kadro ayrıntısı ve anlık bildirim Pro kapsamındadır."
      />
      <Block
        heading="Kullanım sınırı"
        body="Uygulama kötüye kullanılamaz, kaynak sitelerin erişimini engelleyecek biçimde kullanılamaz ve içeriği resmi ilan gibi yeniden yayımlanamaz."
      />
    </Screen>
  );
}
