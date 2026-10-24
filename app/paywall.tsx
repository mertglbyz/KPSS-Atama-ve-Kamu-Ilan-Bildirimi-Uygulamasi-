import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, Check, Clock, Crown, ShieldCheck, SlidersHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorText } from '@/components/ui';
import { PLANS } from '@/constants/catalog';
import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { isSupabaseConfigured } from '@/lib/env';
import { loadOfferings, purchaseProduct, restorePremium } from '@/lib/revenuecat';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS = [
  {
    icon: Bell,
    title: 'Eşleşen ilanlar',
    desc: 'Memur, sözleşmeli ve işçi kadroları profiline göre ayrılır.',
  },
  {
    icon: Clock,
    title: 'Bitiş hatırlatıcısı',
    desc: 'Son 48 saatte kapanan başvurular tek listede durur.',
  },
  {
    icon: ShieldCheck,
    title: 'Şart elemesi',
    desc: 'Yaş, boy, ehliyet ve belge uymayan kadro listeden çıkar.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Rakip analizi',
    desc: 'Taban puan, sıralama ve kontenjan ayrıntısı açılır.',
  },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 760;

  const mode = useAppStore((state) => state.mode);
  const isPremium = useAppStore((state) => state.isPremium);
  const currentPlan = useAppStore((state) => state.plan);
  const setPremium = useAppStore((state) => state.setPremium);
  const setDemoPremium = useAppStore((state) => state.setDemoPremium);

  const [selectedId, setSelectedId] = useState<'yearly' | 'quarterly' | 'monthly'>(
    currentPlan !== 'free' ? currentPlan : 'yearly'
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useQuery({
    queryKey: ['offerings'],
    queryFn: loadOfferings,
  });

  const selectedPlan = PLANS.find((p) => p.id === selectedId) ?? PLANS[0];

  function closePaywall() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  async function buy() {
    setError(null);
    setPending(true);
    try {
      if (!isSupabaseConfigured || mode === 'demo') {
        setDemoPremium(true);
        setPremium(true, selectedPlan.id);
        closePaywall();
        return;
      }
      const active = await purchaseProduct(selectedPlan.productId);
      if (active) {
        setPremium(true, selectedPlan.id);
        closePaywall();
      } else {
        setError('Satın alma işlemi tamamlanamadı.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme sırasında bir sorun oluştu.');
    } finally {
      setPending(false);
    }
  }

  async function restore() {
    setError(null);
    setPending(true);
    try {
      if (!isSupabaseConfigured || mode === 'demo') {
        setDemoPremium(true);
        setPremium(true, 'yearly');
        closePaywall();
        return;
      }
      const active = await restorePremium();
      if (active) {
        setPremium(true, 'yearly');
        closePaywall();
      } else {
        setError('Bu hesaba tanımlı aktif bir abonelik bulunamadı.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geri yükleme başarısız oldu.');
    } finally {
      setPending(false);
    }
  }

  function switchToFree() {
    setDemoPremium(false);
    setPremium(false, 'free');
    closePaywall();
  }

  return (
    <SafeAreaView className="flex-1 bg-[#133B47]" edges={['top']}>
      <View className="px-5 pb-3 pt-1.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            <Crown size={13} color="#FDE68A" />
            <Text className="text-[11px] font-bold tracking-wider text-amber-200">
              {isPremium ? 'AKTİF PRO ÜYELİK' : 'KPSS ATAMA PRO'}
            </Text>
          </View>

          <Pressable
            onPress={closePaywall}
            hitSlop={12}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/15 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text
          className={`mt-2 text-center font-extrabold text-white ${
            isSmallScreen ? 'text-lg leading-6' : 'text-xl leading-7'
          }`}
        >
          Profiline uygun ilanları kaçırma
        </Text>
        <Text className="mt-0.5 text-center text-xs leading-4 text-white/80">
          Eşleşen kadrolar, bitiş hatırlatıcısı ve şart elemesi tek yerde.
        </Text>
      </View>

      <SafeAreaView
        className="flex-1 justify-between rounded-t-[28px] bg-white px-4 pt-3.5"
        edges={['bottom']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 6 }}
        >
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.title}
                  className="w-[48.8%] rounded-2xl border border-[#E6ECEF] bg-[#F8FAFB] p-2.5"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-[#E3EFF1]">
                      <Icon size={13} color="#1A4A57" />
                    </View>
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-xs font-extrabold text-[#102A32]"
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    className="mt-1 text-[10.5px] leading-3.5 text-[#5E6E76]"
                  >
                    {item.desc}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="mt-2.5 gap-2">
            {PLANS.map((plan) => {
              const active = plan.id === selectedId;
              const isCurrent = isPremium && currentPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedId(plan.id)}
                  className={`flex-row items-center justify-between rounded-2xl border px-3.5 ${
                    isSmallScreen ? 'py-2' : 'py-2.5'
                  } ${
                    active
                      ? 'border-2 border-[#1A4A57] bg-[#F2F8F9]'
                      : 'border-[#E1E7EA] bg-white'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                        active ? 'border-[#1A4A57]' : 'border-[#CBD5E1]'
                      }`}
                    >
                      {active ? (
                        <View className="h-2.5 w-2.5 rounded-full bg-[#1A4A57]" />
                      ) : null}
                    </View>

                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-extrabold text-[#102A32]">
                          {plan.title}
                        </Text>
                        {isCurrent ? (
                          <View className="rounded-md bg-[#1A4A57] px-1.5 py-0.5">
                            <Text className="text-[9px] font-bold text-white">
                              MEVCUT PLANIN
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-xs text-[#5E6E76]">{plan.monthly}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-base font-extrabold text-[#102A32]">
                      {plan.price}
                    </Text>
                    {plan.note && plan.note !== 'Standart' ? (
                      <View className="mt-0.5 rounded-full bg-[#DCFCE7] px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-[#15803D]">
                          {plan.note.replace('indirim', 'tasarruf')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-t border-[#E8EEF0] bg-white pt-2 pb-1">
          <ErrorText text={error} />

          <Pressable
            onPress={buy}
            disabled={pending}
            className={`h-11 flex-row items-center justify-center rounded-2xl bg-[#1A4A57] px-4 shadow-sm active:opacity-90 ${
              pending ? 'opacity-60' : ''
            }`}
          >
            {pending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-sm font-extrabold text-white">
                  {isPremium && currentPlan === selectedPlan.id
                    ? 'Bu Plan Zaten Aktif (Devam Et)'
                    : `${selectedPlan.title} Planla Başla • ${selectedPlan.price}`}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={isPremium ? switchToFree : closePaywall}
            disabled={pending}
            className="mt-1 py-1 items-center justify-center"
          >
            <Text className="text-xs font-semibold text-[#5E6E76]">
              {isPremium
                ? 'Ücretsiz (Standart) Sürüme Geç'
                : 'Şimdilik ücretsiz sürümle devam et'}
            </Text>
          </Pressable>

          <Text className="mt-0.5 px-2 text-center text-[10px] leading-3.5 text-[#7A8B94]">
            Ödeme Apple/Google hesabınızdan tahsil edilir. Dönem bitiminden en az 24 saat önce
            iptal edilmediği sürece otomatik yenilenir.
          </Text>

          <View className="mt-1 flex-row items-center justify-center gap-3">
            <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
              <Text className="text-[11px] font-bold text-[#1A4A57] underline">
                Kullanım Koşulları
              </Text>
            </Pressable>
            <Text className="text-[11px] text-[#94A3B8]">•</Text>
            <Pressable onPress={restore} disabled={pending} hitSlop={8}>
              <Text className="text-[11px] font-bold text-[#1A4A57] underline">
                Satın Alımları Geri Yükle
              </Text>
            </Pressable>
            <Text className="text-[11px] text-[#94A3B8]">•</Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text className="text-[11px] font-bold text-[#1A4A57] underline">
                Gizlilik Politikası
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
