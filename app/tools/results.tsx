import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { DEMO_JOBS } from '@/lib/demo-data';
import { useProfileStore } from '@/store/useProfileStore';

export default function ResultsTool() {
  const interactions = useProfileStore((state) => state.interactions);
  const applied = Object.entries(interactions).filter(([, value]) => value.applicationStatus !== 'none');
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Sonuçlarım' }} />
      {applied.length === 0 ? <Text className="text-muted">Başvurdum dediğin ilanlar burada izlenir.</Text> : null}
      {applied.map(([id, value]) => {
        const job = DEMO_JOBS.find((item) => item.id === id);
        return (
          <Card key={id} className="mb-3">
            <Text className="font-semibold text-ink dark:text-white">{job?.positionTitle ?? id}</Text>
            <Text className="mt-1 text-sm text-muted">{label(value.applicationStatus)} · Sonuç açıklaması geldiğinde bu kart güncellenir.</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

function label(status: string) {
  if (status === 'applied') return 'Başvuruldu';
  if (status === 'accepted') return 'Kabul';
  if (status === 'rejected') return 'Olumsuz';
  return 'Beklemede';
}
