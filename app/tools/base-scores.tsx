import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';
import { fetchBaseScores } from '@/lib/data';
import { formatScore } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export default function BaseScoresTool() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const scores = useQuery({ queryKey: ['scores', userId, premium], enabled: Boolean(userId), queryFn: () => fetchBaseScores(userId!, premium) });
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Taban puanlar' }} />
      <Text className="mb-3 text-sm text-muted">Örnek arşiv. Resmi ÖSYM kapanış puanlarını kendi tablonla değiştir.</Text>
      {(scores.data ?? []).map((score) => (
        <Card key={score.id} className="mb-3">
          <Text className="font-semibold text-ink dark:text-white">{score.year} · {score.positionTitle}</Text>
          <Text className="mt-1 text-sm text-muted">{score.institutionName} · {score.department} · {score.kpssType}</Text>
          <Text className="mt-2 text-lg font-bold text-brand-700">{formatScore(score.minScore)}</Text>
        </Card>
      ))}
      {premium ? null : <Button label="Tüm arşivi Pro'da aç" onPress={() => router.push('/paywall')} />}
    </Screen>
  );
}
