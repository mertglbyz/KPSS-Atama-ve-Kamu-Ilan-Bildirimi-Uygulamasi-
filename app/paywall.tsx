import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, ErrorText, Screen } from '@/components/ui';
import { PLANS } from '@/constants/catalog';
import { fetchSummary } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/env';
import { loadOfferings, presentStorePaywall, purchaseProduct, restorePremium } from '@/lib/revenuecat';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function PaywallScreen() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const mode = useAppStore((state) => state.mode);
  const setPremium = useAppStore((state) => state.setPremium);
  const setDemoPremium = useAppStore((state) => state.setDemoPremium);
  const draft = useProfileStore((state) => state.draft);
  const summary = useQuery({ queryKey: ['summary', userId, draft], enabled: Boolean(userId), queryFn: () => fetchSummary(userId!, draft) });
  const offerings = useQuery({ queryKey: ['offerings'], queryFn: loadOfferings });
  const [selected, setSelected] = useState<(typeof PLANS)[number]['id']>('yearly');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const count = summary.data?.totalPositions ?? 0;

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
        <Text className="mt-3 text-3xl font-bold leading-9 text-ink dark:text-white">Profiline uygun {count} güncel ilanı kaçırma</Text>
        <View className="my-4 gap-2">
          {[
            'Profilinle eşleşen memur, sözleşmeli ve işçi ilanları',
            'Yeni ilan yayınlandığında anlık bildirim',
            'Son 48 saat başvuru bitiş hatırlatıcıları',
            'Detaylı rakip analizi ve taban puan istatistikleri',
          ].map((item) => (
            <Text key={item} className="text-sm text-ink dark:text-slate-200">✓ {item}</Text>
          ))}
        </View>
        {PLANS.map((plan) => {
          const storePrice = offerings.data?.find((item) => item.product.identifier === plan.productId)?.product.priceString;
          const active = selected === plan.id;
          return (
            <Pressable key={plan.id} onPress={() => setSelected(plan.id)} className={`mb-3 rounded-3xl border p-4 ${active ? 'border-brand-700 bg-brand-50 dark:bg-slate-800' : 'border-line bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-ink dark:text-white">{plan.title}</Text>
                {plan.badge ? <Text className="rounded-full bg-brand-700 px-2 py-1 text-xs font-semibold text-white">{plan.badge}</Text> : null}
              </View>
              <Text className="mt-1 text-base font-semibold text-brand-700">{storePrice ?? plan.price}</Text>
              <Text className="text-sm text-muted">{plan.monthly} · {plan.note}</Text>
            </Pressable>
          );
        })}
        <ErrorText text={error} />
        <Button label={pending ? 'İşleniyor' : 'Devam et'} onPress={buy} disabled={pending} />
        <View className="mt-3 gap-2">
          <Button
            label="Satın alımları geri yükle"
            variant="ghost"
            onPress={async () => {
              const active = await restorePremium();
              if (active) {
                setPremium(true);
                router.replace('/(tabs)');
              } else setError('Aktif abonelik bulunamadı.');
            }}
          />
          {Platform.OS !== 'web' ? <Button label="Mağaza paywall'unu aç" variant="secondary" onPress={() => presentStorePaywall()} /> : null}
          {mode === 'demo' || !isSupabaseConfigured ? (
            <Button
              label="Örnek modda Pro arayüzünü önizle"
              variant="secondary"
              onPress={() => {
                setDemoPremium(true);
                router.replace('/(tabs)/jobs');
              }}
            />
          ) : null}
          <Button label="Şimdilik ücretsiz devam et" variant="ghost" onPress={() => router.replace('/(tabs)')} />
          <Text className="text-center text-xs text-muted">
            Abonelik mağaza hesabın üzerinden yenilenir ve iptal edilir. Vitrin fiyatları Türkiye için planlanan fiyatlardır; ödeme anında mağaza fiyatı geçerlidir.
          </Text>
          <Pressable onPress={() => router.push('/legal/terms')}>
            <Text className="text-center text-sm font-semibold text-brand-700">Kullanım koşulları ve gizlilik</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}
