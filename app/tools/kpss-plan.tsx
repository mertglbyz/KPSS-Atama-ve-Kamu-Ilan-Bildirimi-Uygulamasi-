import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { STUDY_TOPICS } from '@/constants/catalog';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function PlanTool() {
  const router = useRouter();
  const premium = useAppStore((state) => state.isPremium);
  const studied = useProfileStore((state) => state.studied);
  const toggle = useProfileStore((state) => state.toggleStudied);
  const flat = STUDY_TOPICS.flatMap((group) => group.items.map((item, index) => ({ id: `${group.id}-${index}`, group: group.title, item })));
  const visible = premium ? flat : flat.slice(0, 3);
  const done = flat.filter((topic) => studied[topic.id]).length;
  return (
    <Screen>
      <Stack.Screen options={{ title: 'KPSS planı' }} />
      <Text className="mb-3 text-sm text-muted">{done}/{flat.length} konu işaretlendi. Ücretsiz planda ilk üç konu açık.</Text>
      {visible.map((topic) => (
        <Pressable key={topic.id} onPress={() => toggle(topic.id)} className="mb-2 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
          <View>
            <Text className="text-xs text-brand-700">{topic.group}</Text>
            <Text className="font-medium text-ink dark:text-white">{topic.item}</Text>
          </View>
          <Text className="text-brand-700">{studied[topic.id] ? '✓' : '○'}</Text>
        </Pressable>
      ))}
      {premium ? null : <Button label="Planın devamı Pro'da" onPress={() => router.push('/paywall')} />}
    </Screen>
  );
}
