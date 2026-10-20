import { BackButton, Screen, Title } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <BackButton fallback="/" />
      <Title subtitle="Adres kayıtlı bir ekrana çıkmıyor.">Bu ekran yok</Title>
    </Screen>
  );
}
