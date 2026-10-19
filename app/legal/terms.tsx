import { Text } from 'react-native';
import { Screen } from '@/components/ui';

export default function TermsScreen() {
  return (
    <Screen>
      <Text className="text-base leading-6 text-ink dark:text-slate-100">
        Bu metin taslaktır. Mağaza incelemesinden önce kullanım koşullarını kendi şirket bilgilerinle yayınla.
        {'\n\n'}
        KPSS Atama, resmi ilanları tarar ve kullanıcının girdiği profile göre aday listesi üretir. Eşleşme bir başvuru hakkı veya resmi kabul değildir. İlanın kaynağı ve başvuru adresi her kayıtta gösterilir; son kontrolü kullanıcı ilanın resmi sayfasından yapar.
        {'\n\n'}
        Pro abonelik aylık, 3 aylık veya yıllık yenilenir. İptal, satın almanın yapıldığı Apple veya Google hesabından yapılır. Ücretsiz planda genel ilan kartları ve kısıtlı araçlar açıktır. Kişiye özel kadro ayrıntıları ve anlık bildirimler Pro kapsamındadır.
      </Text>
    </Screen>
  );
}
