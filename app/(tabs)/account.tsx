import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Button, Card, ErrorText, Screen, Title, ToggleRow } from '@/components/ui';
import { deleteAccount } from '@/lib/data';
import { restorePremium } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const PLAN_LABEL = { free: 'Ücretsiz', monthly: 'Aylık Pro', quarterly: '3 Aylık Pro', yearly: 'Yıllık Pro' };

export default function AccountScreen() {
  const router = useRouter();
  const email = useAppStore((state) => state.email);
  const plan = useAppStore((state) => state.plan);
  const mode = useAppStore((state) => state.mode);
  const colorScheme = useAppStore((state) => state.colorScheme);
  const setColorScheme = useAppStore((state) => state.setColorScheme);
  const setPremium = useAppStore((state) => state.setPremium);
  const clearDemoSession = useAppStore((state) => state.clearDemoSession);
  const reset = useProfileStore((state) => state.reset);
  const nativewind = useColorScheme();
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    clearDemoSession();
    reset();
    router.replace('/(auth)/login');
  }

  async function restore() {
    setError(null);
    try {
      const active = await restorePremium();
      if (active) setPremium(true);
      else setError('Geri yüklenecek aktif abonelik bulunamadı.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Geri yükleme başarısız');
    }
  }

  async function remove() {
    setError(null);
    try {
      if (mode === 'live') await deleteAccount();
      await logout();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Hesap silinemedi');
    }
  }

  return (
    <Screen>
      <Title subtitle="Abonelik, görünüm ve oturum.">Hesap</Title>
      <Card className="mb-4">
        <Text className="text-sm text-muted">{email}</Text>
        <Text className="mt-1 text-lg font-bold text-ink dark:text-white">{PLAN_LABEL[plan]}</Text>
        <Text className="mt-1 text-sm text-muted">{mode === 'demo' ? 'Örnek oturum' : 'Supabase oturumu'}</Text>
      </Card>
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
        <Button label="Aboneliği yönet" onPress={() => router.push('/paywall')} />
        <Button label="Satın alımları geri yükle" variant="secondary" onPress={restore} />
        <Button label="Gizlilik politikası" variant="ghost" onPress={() => router.push('/legal/privacy')} />
        <Button label="Kullanım koşulları" variant="ghost" onPress={() => router.push('/legal/terms')} />
        <Button label="Çıkış yap" variant="secondary" onPress={logout} />
        <Button label="Hesabı sil" variant="ghost" onPress={remove} />
      </View>
      <ErrorText text={error} />
    </Screen>
  );
}
