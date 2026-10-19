import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { fetchCards } from '@/lib/data';
import { formatDay } from '@/lib/format';

export default function CalendarTool() {
  const cards = useQuery({ queryKey: ['cards'], queryFn: () => fetchCards('active') });
  const groups = new Map<string, string[]>();
  for (const card of cards.data ?? []) {
    const day = formatDay(card.applicationEndDate);
    groups.set(day, [...(groups.get(day) ?? []), `${card.institutionName} · ${card.positionTitle}`]);
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Takvim' }} />
      {[...groups.entries()].map(([day, items]) => (
        <Card key={day} className="mb-3">
          <Text className="font-semibold text-brand-700">{day}</Text>
          {items.map((item) => (
            <Text key={item} className="mt-2 text-sm text-ink dark:text-slate-100">{item}</Text>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
