import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { localTips } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/env';
import { useProfileStore } from '@/store/useProfileStore';

export default function RecommendationsTool() {
  const draft = useProfileStore((state) => state.draft);
  const tips = localTips(draft);
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Önerilenler' }} />
      <Text className="mb-3 text-sm text-muted">
        {isSupabaseConfigured ? 'Öneriler şu an örnek ilan setiyle hesaplanır. Canlı kadro tablosu bağlanınca aynı kural onun üzerinde çalışır.' : 'Örnek ilan setine göre, tek bir belge eklenirse açılan kadrolar.'}
      </Text>
      {tips.length === 0 ? <Text className="text-muted">Bu profil için ek belge yeni eşleşme açmıyor.</Text> : null}
      {tips.map((tip) => (
        <Card key={tip.title} className="mb-3">
          <Text className="font-semibold text-ink dark:text-white">{tip.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">{tip.detail}</Text>
        </Card>
      ))}
    </Screen>
  );
}
