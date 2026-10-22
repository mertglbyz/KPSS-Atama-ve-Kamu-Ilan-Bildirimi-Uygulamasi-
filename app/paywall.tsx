import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, ErrorText, Screen } from '@/components/ui';
import { PLANS } from '@/constants/catalog';
import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { isSupabaseConfigured } from '@/lib/env';
import { loadOfferings, purchaseProduct, restorePremium } from '@/lib/revenuecat';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS = [
  'Profilinle eşleşen memur, sözleşmeli ve işçi ilanları',
  'Yeni ilan yayınlandığında anlık bildirim',
  'Son 48 saat başvuru bitiş hatırlatıcıları',
  'Detaylı rakip analizi ve taban puan istatistikleri',
];

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

  async function restore() {
    setError(null);
    const active = await restorePremium();
    if (active) {
      setPremium(true);
      router.replace('/(tabs)');
    } else setError('Aktif abonelik bulunamadı.');
  }

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(320)}>
        <View className="overflow-hidden rounded-3xl bg-brand-700 px-4 pb-4 pt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            hitSlop={10}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            className="h-8 w-8 items-center justify-center self-end rounded-full border border-white/40"
          >
            <X color="#F4F7F8" size={16} strokeWidth={2.25} />
          </Pressable>
          <Text className="text-center text-2xl font-bold leading-7 text-white">Profiline uygun ilanları kaçırma</Text>
          <View className="mt-3 gap-1.5">
            {BENEFITS.map((item) => (
              <View key={item} className="flex-row items-start gap-2">
                <Text className="text-sm leading-5 text-white">•</Text>
                <Text className="flex-1 text-[13px] leading-5 text-white/95">{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="mt-3">
          {PLANS.map((plan) => {
            const storePrice = offerings.data?.find((item) => item.product.identifier === plan.productId)?.product.priceString;
            const active = selected === plan.id;
            return (
              <Pressable
                key={plan.id}
                accessibilityRole="button"
                onPress={() => setSelected(plan.id)}
                className={`mb-2 rounded-2xl border px-3.5 py-2.5 ${active ? 'border-brand-700 bg-brand-50 dark:bg-slate-800' : 'border-line bg-white dark:border-slate-800 dark:bg-slate-900'}`}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-base font-bold text-ink dark:text-white">{plan.title}</Text>
                  {plan.badge ? <Text className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">{plan.badge}</Text> : null}
                </View>
                <Text className="text-sm font-semibold text-brand-700 dark:text-brand-100">{storePrice ?? plan.price}</Text>
                <Text className="text-xs text-muted dark:text-slate-300">{plan.monthly} · {plan.note}</Text>
              </Pressable>
            );
          })}
        </View>
        <ErrorText text={error} />
        <Button label={pending ? 'İşleniyor' : 'Devam et'} onPress={buy} disabled={pending} />
        {mode === 'demo' || !isSupabaseConfigured ? (
          <View className="mt-2">
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
        <Text className="mt-3 px-1 text-center text-[11px] leading-4 text-muted dark:text-slate-300">
          Ödeme Apple veya Google hesabından alınır. Abonelik, dönem bitiminden en az 24 saat önce iptal edilmezse yenilenir.
        </Text>
        <View className="mt-3 flex-row flex-wrap items-center justify-center gap-y-1">
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => void Linking.openURL(TERMS_URL)}>
            <Text className="text-[11px] text-muted dark:text-slate-300">Kullanım koşulları</Text>
          </Pressable>
          <Text className="px-1.5 text-[11px] text-muted dark:text-slate-300">·</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void restore()}>
            <Text className="text-[11px] text-muted dark:text-slate-300">Satın alımları geri yükle</Text>
          </Pressable>
          <Text className="px-1.5 text-[11px] text-muted dark:text-slate-300">·</Text>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => void Linking.openURL(PRIVACY_URL)}>
            <Text className="text-[11px] text-muted dark:text-slate-300">Gizlilik politikası</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}
