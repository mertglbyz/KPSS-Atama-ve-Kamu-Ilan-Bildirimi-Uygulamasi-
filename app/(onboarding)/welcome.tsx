import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Button, Screen } from '@/components/ui';

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen
      footer={
        <Button label="Bilgileri girmeye başla" onPress={() => router.replace('/(onboarding)/step1-personal')} />
      }
    >
      <Text className="mt-8 text-xs font-semibold tracking-[2px] text-brand-700 dark:text-brand-100">KPSS ATAMA</Text>
      <Text className="mt-3 text-3xl font-bold text-ink dark:text-white">Merhaba</Text>
      <Text className="mt-4 text-base leading-7 text-muted dark:text-slate-300">
        Sana uygun kadroları ayırabilmemiz için birkaç bilgiye ihtiyacımız var. Eğitim, sınav ve belgeler ilan şartlarıyla karşılaştırılır. Uymadığın ilan elenir.
      </Text>
    </Screen>
  );
}
