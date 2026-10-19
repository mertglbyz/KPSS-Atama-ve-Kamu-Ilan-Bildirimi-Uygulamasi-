import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, ErrorText, Screen } from '@/components/ui';
import { PLANS } from '@/constants/catalog';
import { isSupabaseConfigured } from '@/lib/env';
import { loadOfferings, purchaseProduct, restorePremium } from '@/lib/revenuecat';
import { useAppStore } from '@/store/useAppStore';

export default function PaywallScreen() {
  const router = useRouter();
  const mode = useAppStore((state) => state.mode);
  const setPremium = useAppStore((state) => state.setPremium);
  const setDemoPremium = useAppStore((state) => state.setDemoPremium);
  const offerings = useQuery({ queryKey: ['offerings'], queryFn: loadOfferings });
  const [selected, setSelected] = useState<(typeof PLANS)[number]['id']>('yearly');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function buy() {
    const plan = PLANS.find((item) => item.id === selected)!;
    setPending(true);
    setError(null);
    try {
      const active = await purchaseProduct(plan.productId);
      if (active) {
        setPremium(true, plan.id);
        router.replace('/(tabs)/jobs');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Satın alma tamamlanmadı');
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(420)}>
        <View className="mt-2 overflow-hidden rounded-[28px] bg-brand-700 px-5 pb-6 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            className="h-9 w-9 items-center justify-center self-end rounded-full border border-white/40"
          >
            <X color="#F4F7F8" size={16} strokeWidth={2.25} />
          </Pressable>
          <Text className="mt-1 text-center text-3xl font-bold leading-9 text-white">Profiline uygun ilanları kaçırma</Text>
          <View className="mt-4 gap-2.5">
            {[
              'Profilinle eşleşen memur, sözleşmeli ve işçi ilanları',
              'Yeni ilan yayınlandığında anlık bildirim',
              'Son 48 saat başvuru bitiş hatırlatıcıları',
              'Detaylı rakip analizi ve taban puan istatistikleri',
            ].map((item) => (
              <View key={item} className="flex-row items-start gap-2">
                <Text className="mt-0.5 text-sm text-white">•</Text>
                <Text className="flex-1 text-sm leading-5 text-white/95">{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="mt-4">
        {PLANS.map((plan) => {
          const storePrice = offerings.data?.find((item) => item.product.identifier === plan.productId)?.product.priceString;
          const active = selected === plan.id;
          return (
            <Pressable key={plan.id} onPress={() => setSelected(plan.id)} className={`mb-2 rounded-2xl border px-3.5 py-3 ${active ? 'border-brand-700 bg-brand-50 dark:bg-slate-800' : 'border-line bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-ink dark:text-white">{plan.title}</Text>
                {plan.badge ? <Text className="rounded-full bg-brand-700 px-2 py-1 text-[11px] font-semibold text-white">{plan.badge}</Text> : null}
              </View>
              <Text className="mt-0.5 text-sm font-semibold text-brand-700">{storePrice ?? plan.price}</Text>
              <Text className="text-xs text-muted">{plan.monthly} · {plan.note}</Text>
            </Pressable>
          );
        })}
        </View>
        <ErrorText text={error} />
        <Button label={pending ? 'İşleniyor' : 'Devam et'} onPress={buy} disabled={pending} />
        {mode === 'demo' || !isSupabaseConfigured ? (
          <View className="mt-3">
            <Button
              label="Örnek modda Pro arayüzünü önizle"
              variant="secondary"
              onPress={() => {
                setDemoPremium(true);
                router.replace('/(tabs)/jobs');
              }}
            />
          </View>
        ) : null}
        <Text className="mt-4 px-2 text-center text-xs leading-5 text-muted">
          Ödeme Apple veya Google hesabından alınır. Abonelik, dönem bitiminden en az 24 saat önce iptal edilmezse aynı fiyatla yenilenir.
        </Text>
        <View className="mt-5 flex-row flex-wrap items-center justify-center">
          <Pressable accessibilityRole="link" onPress={() => router.push('/legal/terms')}>
            <Text className="text-xs text-muted">Kullanım koşulları</Text>
          </Pressable>
          <Text className="px-2 text-xs text-muted">·</Text>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const active = await restorePremium();
              if (active) {
                setPremium(true);
                router.replace('/(tabs)');
              } else setError('Aktif abonelik bulunamadı.');
            }}
          >
            <Text className="text-xs text-muted">Satın alımları geri yükle</Text>
          </Pressable>
          <Text className="px-2 text-xs text-muted">·</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/legal/privacy')}>
            <Text className="text-xs text-muted">Gizlilik politikası</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}
