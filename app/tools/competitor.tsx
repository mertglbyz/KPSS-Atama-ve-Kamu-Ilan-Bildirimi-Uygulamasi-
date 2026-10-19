import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';
import { fetchDistribution, fetchRank } from '@/lib/data';
import { formatScore } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function CompetitorTool() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const draft = useProfileStore((state) => state.draft);
  const department = draft.educations[0]?.department ?? '';
  const rank = useQuery({ queryKey: ['rank', userId, draft, premium], enabled: Boolean(userId), queryFn: () => fetchRank(userId!, draft, premium) });
  const buckets = useQuery({ queryKey: ['dist', userId, department, premium], enabled: Boolean(userId), queryFn: () => fetchDistribution(userId!, department, premium) });
  const max = Math.max(...(buckets.data ?? []).map((bucket) => bucket.count), 1);
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Rakip analizi' }} />
      <Card>
        <Text className="text-sm text-muted">{department || 'Bölüm seçilmedi'}</Text>
        <Text className="mt-2 text-lg font-bold text-ink dark:text-white">
          {rank.data?.unlocked && rank.data.userRank
            ? `${rank.data.totalCandidates} aday arasında ${rank.data.userRank}. sıra · ${formatScore(rank.data.userScore)}`
            : `${rank.data?.totalCandidates ?? 0} aday. Ayrıntılı sıra Pro'da.`}
        </Text>
      </Card>
      {premium ? (
        <View className="mt-4 gap-2">
          {(buckets.data ?? []).map((bucket) => (
            <View key={bucket.label}>
              <Text className="text-xs text-muted">{bucket.label} · {bucket.count}</Text>
              <View className="mt-1 h-3 overflow-hidden rounded-full bg-brand-50">
                <View className="h-3 rounded-full bg-brand-700" style={{ width: `${(bucket.count / max) * 100}%` }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="mt-4">
          <Button label="Dağılımı aç" onPress={() => router.push('/paywall')} />
        </View>
      )}
    </Screen>
  );
}
