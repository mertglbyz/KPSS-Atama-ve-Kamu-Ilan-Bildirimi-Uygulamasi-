import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { Button, Card, Screen, Title, ToggleRow } from '@/components/ui';
import { deleteAccount, saveProfile } from '@/lib/data';
import { emptyDraft } from '@/lib/profile';
import { registerPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
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
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const reset = useProfileStore((state) => state.reset);
  const [message, setMessage] = useState<string | null>(null);
  const [phoneOn, setPhoneOn] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || mode !== 'live' || !userId || !supabase) return;
    void supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setPhoneOn(Boolean(data?.expo_push_token)));
  }, [mode, userId]);

  async function persist(partial: Partial<typeof draft>) {
    const next = { ...draft, ...partial };
    patch(partial);
    if (mode === 'live' && userId) await saveProfile(userId, next);
  }

  async function setPhone(next: boolean) {
    setMessage(null);
    if (!next) {
      setPhoneOn(false);
      if (mode === 'live' && userId && supabase) {
        await supabase.from('profiles').update({ expo_push_token: null, updated_at: new Date().toISOString() }).eq('id', userId);
      }
      setMessage('Telefon bildirimleri kapatıldı. Aşağıdaki seçimler durur, haber gitmez.');
      return;
    }
    if (!premium) {
      router.push('/paywall');
      return;
    }
    if (!userId) return;
    const token = await registerPushToken(userId);
    setPhoneOn(Boolean(token));
    setMessage(token ? 'Telefon bildirimleri açıldı.' : 'Telefon izin vermedi.');
  }

  return (
    <Screen>
      <Title subtitle="Abonelik, bildirim ve görünüm.">Ayarlar</Title>
      <Card className="mb-5">
        <Text className="text-xs font-semibold tracking-[2px] text-brand-700 dark:text-brand-100">PLAN</Text>
        <Text className="mt-1 text-2xl font-bold text-ink dark:text-white">{PLAN_LABEL[plan]}</Text>
      </Card>
      <Text className="mb-2 text-sm font-semibold text-ink dark:text-white">Bildirimler</Text>
      <ToggleRow
        label="Telefon bildirimleri"
        detail={phoneOn ? 'Telefon izin verdi. Aşağıdan hangi haberin geleceğini seç.' : 'Kapalıyken haber gelmez. Açınca telefon izin ister.'}
        value={phoneOn}
        onValueChange={(value) => void setPhone(value)}
      />
      <ToggleRow label="Yeni ilan" detail="Profiline uyan yeni kadro" value={draft.notifyNewJobs} onValueChange={(notifyNewJobs) => persist({ notifyNewJobs })} />
      <ToggleRow label="Son 48 saat" detail="Başvurusu bitmek üzere olan ilan" value={draft.notifyDeadline} onValueChange={(notifyDeadline) => persist({ notifyDeadline })} />
      <ToggleRow label="Sonuç bildirimi" detail="İlan düzeltmesi veya iptali" value={draft.notifyResults} onValueChange={(notifyResults) => persist({ notifyResults })} />
      <Text className="mb-2 mt-4 text-sm font-semibold text-ink dark:text-white">Görünüm</Text>
      <ToggleRow
        label="Karanlık mod"
        value={colorScheme === 'dark'}
        onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
      />
      <View className="mt-2 gap-3">
        <Button label="Aboneliği yönet" variant="secondary" onPress={() => router.push('/paywall')} />
        <Button
          label="Profili sıfırla"
          variant="secondary"
          onPress={() => {
            Alert.alert('Profili sıfırla', 'Girdiğin bilgiler silinir ve kurulum baştan açılır.', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sıfırla',
                style: 'destructive',
                onPress: () => {
                  const cleared = emptyDraft();
                  if (mode === 'live' && userId) void saveProfile(userId, cleared);
                  reset();
                  router.replace('/(onboarding)/step1-personal');
                },
              },
            ]);
          }}
        />
        <Button
          label="Hesabı ve veriyi sil"
          variant="ghost"
          onPress={() => {
            Alert.alert('Hesabı sil', 'Profilin, eşleşmelerin ve bildirimlerin silinir. Bu işlem geri alınmaz.', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sil',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    setMessage(null);
                    try {
                      if (mode === 'live') await deleteAccount();
                      if (supabase) await supabase.auth.signOut();
                      reset();
                      const created = supabase ? await supabase.auth.signInAnonymously() : null;
                      const session = created?.data.session;
                      if (session) {
                        useAppStore.getState().setReady({
                          mode: 'live',
                          userId: session.user.id,
                          email: null,
                          isPremium: false,
                          plan: 'free',
                        });
                      }
                      router.replace('/(onboarding)/step1-personal');
                    } catch (caught) {
                      setMessage(caught instanceof Error ? caught.message : 'Hesap silinemedi.');
                    }
                  })();
                },
              },
            ]);
          }}
        />
      </View>
      {message ? <Text className="mt-3 text-sm text-muted dark:text-slate-300">{message}</Text> : null}
    </Screen>
  );
}
