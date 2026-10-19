import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { fetchCards } from '@/lib/data';
import { formatDay } from '@/lib/format';

export default function ArchiveTool() {
  const cards = useQuery({ queryKey: ['archive'], queryFn: () => fetchCards('archived') });
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Geçmiş ilanlar' }} />
      {(cards.data ?? []).map((card) => (
        <Card key={card.positionId} className="mb-3">
          <Text className="font-semibold text-ink dark:text-white">{card.positionTitle}</Text>
          <Text className="mt-1 text-sm text-muted">{card.institutionName} · bitiş {formatDay(card.applicationEndDate)}</Text>
        </Card>
      ))}
      {!cards.data?.length ? <Text className="text-muted">Arşiv boş.</Text> : null}
    </Screen>
  );
}
