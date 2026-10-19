import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Button, Card, ErrorText, Screen, Title, ToggleRow } from '@/components/ui';
import { saveProfile } from '@/lib/data';
import { emptyDraft } from '@/lib/profile';
import { registerPushToken } from '@/lib/notifications';
import { restorePremium } from '@/lib/revenuecat';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const PLAN_LABEL = { free: 'Ücretsiz', monthly: 'Aylık Pro', quarterly: '3 Aylık Pro', yearly: 'Yıllık Pro' };

export default function AccountScreen() {
  const router = useRouter();
  const plan = useAppStore((state) => state.plan);
  const mode = useAppStore((state) => state.mode);
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const colorScheme = useAppStore((state) => state.colorScheme);
  const setColorScheme = useAppStore((state) => state.setColorScheme);
  const setPremium = useAppStore((state) => state.setPremium);
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const reset = useProfileStore((state) => state.reset);
  const nativewind = useColorScheme();
  const [message, setMessage] = useState<string | null>(null);

  async function persist(partial: Partial<typeof draft>) {
    const next = { ...draft, ...partial };
    patch(partial);
    if (mode === 'live' && userId) await saveProfile(userId, next);
  }

  async function restore() {
    setMessage(null);
    try {
      const active = await restorePremium();
      if (active) setPremium(true);
      else setMessage('Geri yüklenecek aktif abonelik bulunamadı.');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Geri yükleme başarısız');
    }
  }

  return (
    <Screen>
      <Title subtitle="Abonelik, bildirim ve görünüm. Hesap açmana gerek yok.">Ayarlar</Title>
      <Card className="mb-5">
        <Text className="text-xs font-semibold tracking-[2px] text-brand-700">PLAN</Text>
        <Text className="mt-1 text-2xl font-bold text-ink dark:text-white">{PLAN_LABEL[plan]}</Text>
      </Card>
      <Text className="mb-2 text-sm font-semibold text-ink dark:text-white">Bildirimler</Text>
      <ToggleRow label="Yeni ilan" value={draft.notifyNewJobs} onValueChange={(notifyNewJobs) => persist({ notifyNewJobs })} />
      <ToggleRow label="Son 48 saat" value={draft.notifyDeadline} onValueChange={(notifyDeadline) => persist({ notifyDeadline })} />
      <ToggleRow label="Sonuç bildirimi" value={draft.notifyResults} onValueChange={(notifyResults) => persist({ notifyResults })} />
      <ToggleRow
        label="Karanlık mod"
        value={colorScheme === 'dark'}
        onValueChange={(value) => {
          const next = value ? 'dark' : 'light';
          setColorScheme(next);
          nativewind.setColorScheme(next);
        }}
      />
      <View className="mt-2 gap-3">
        <Button
          label="Anlık bildirimleri aç"
          onPress={async () => {
            if (!premium) {
              router.push('/paywall');
              return;
            }
            if (!userId) return;
            const token = await registerPushToken(userId);
            setMessage(token ? 'Bildirim anahtarı kaydedildi.' : 'Bu platformda bildirim izni alınamadı.');
          }}
        />
        <Button label="Aboneliği yönet" variant="secondary" onPress={() => router.push('/paywall')} />
        <Button label="Satın alımları geri yükle" variant="ghost" onPress={restore} />
        <Button label="Gizlilik politikası" variant="ghost" onPress={() => router.push('/legal/privacy')} />
        <Button label="Kullanım koşulları" variant="ghost" onPress={() => router.push('/legal/terms')} />
        <Button
          label="Profili sıfırla"
          variant="secondary"
          onPress={() => {
            const cleared = emptyDraft();
            if (mode === 'live' && userId) void saveProfile(userId, cleared);
            reset();
            router.replace('/(onboarding)/step1-personal');
          }}
        />
      </View>
      <ErrorText text={message} />
    </Screen>
  );
}
