import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { BackButton, Button, Card, Screen, Title } from '@/components/ui';
import { fetchSummary } from '@/lib/data';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function OnboardingResult() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const draft = useProfileStore((state) => state.draft);
  const summary = useQuery({
    queryKey: ['summary', userId, draft],
    enabled: Boolean(userId),
    queryFn: () => fetchSummary(userId!, draft),
  });
  const data = summary.data;
  const message = data
    ? `Profiline uygun ${data.institutionCount} kurumda ${data.totalPositions} güncel ilan bulundu. Başvurusu bitmek üzere olan ${data.expiring48h} ilan var.`
    : 'Eşleşmeler hesaplanıyor.';

  return (
    <Screen
      footer={
        <View className="gap-3">
          <Button label="Uygun ilanları keşfet" onPress={() => router.push('/paywall')} />
          <Button label="İlanlara geç" variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </View>
      }
    >
      <BackButton fallback="/(onboarding)/step5-documents" />
      <Title subtitle="Sıradaki adım, sana uyan ilanları açmak.">Profilin hazır</Title>
      <Card>
        <Text className="text-lg font-semibold leading-7 text-ink dark:text-white">{message}</Text>
      </Card>
    </Screen>
  );
}
