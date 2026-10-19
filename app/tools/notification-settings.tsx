import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, ErrorText, Screen, ToggleRow } from '@/components/ui';
import { saveProfile } from '@/lib/data';
import { registerPushToken } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function NotificationSettings() {
  const router = useRouter();
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const mode = useAppStore((state) => state.mode);
  const [error, setError] = useState<string | null>(null);

  async function persist(partial: Partial<typeof draft>) {
    const next = { ...draft, ...partial };
    patch(partial);
    if (mode === 'live' && userId) await saveProfile(userId, next);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bildirim ayarları' }} />
      <ToggleRow label="Yeni ilan" value={draft.notifyNewJobs} onValueChange={(notifyNewJobs) => persist({ notifyNewJobs })} />
      <ToggleRow label="Son 48 saat" value={draft.notifyDeadline} onValueChange={(notifyDeadline) => persist({ notifyDeadline })} />
      <ToggleRow label="Sonuç bildirimi" value={draft.notifyResults} onValueChange={(notifyResults) => persist({ notifyResults })} />
      <View className="mt-3">
        <Button
          label="Anlık bildirimleri aç"
          onPress={async () => {
            if (!premium) {
              router.push('/paywall');
              return;
            }
            if (!userId) return;
            const token = await registerPushToken(userId);
            setError(token ? 'Bu cihazın bildirim anahtarı kaydedildi.' : 'Bildirim izni alınamadı veya bu platform desteklemiyor.');
          }}
        />
      </View>
      <ErrorText text={error} />
    </Screen>
  );
}
