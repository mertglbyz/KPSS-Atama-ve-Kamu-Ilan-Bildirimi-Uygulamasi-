import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Banner, Button, Card, Screen } from '@/components/ui';
import { fetchRank, fetchSummary } from '@/lib/data';
import { formatDate, formatScore, initials } from '@/lib/format';
import { isSupabaseConfigured } from '@/lib/env';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const TOOLS = [
  ['Sonuçlarım', '/tools/results'],
  ['Takvim', '/tools/calendar'],
  ['Taban puanlar', '/tools/base-scores'],
  ['KPSS planı', '/tools/kpss-plan'],
  ['CV oluştur', '/tools/cv'],
  ['Mesajlar', '/tools/messages'],
  ['İkinci üniversite', '/tools/second-university'],
  ['Önerilenler', '/tools/recommendations'],
  ['Geçmiş ilanlar', '/tools/archive'],
  ['İlinizdeki kurslar', '/tools/courses'],
  ['Bildirim ayarları', '/tools/notification-settings'],
] as const;

export default function Dashboard() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const mode = useAppStore((state) => state.mode);
  const draft = useProfileStore((state) => state.draft);
  const hiddenCount = useProfileStore((state) => Object.values(state.interactions).filter((item) => item.isHidden).length);
  const [expanded, setExpanded] = useState(false);
  const summary = useQuery({ queryKey: ['summary', userId, draft], enabled: Boolean(userId), queryFn: () => fetchSummary(userId!, draft) });
  const rank = useQuery({ queryKey: ['rank', userId, draft, premium], enabled: Boolean(userId), queryFn: () => fetchRank(userId!, draft, premium) });
  const data = summary.data;
  const tools = expanded ? TOOLS : TOOLS.slice(0, 4);

  function openMatches() {
    if (!premium) {
      router.push('/paywall');
      return;
    }
    router.push({ pathname: '/(tabs)/jobs', params: { scope: 'matches' } });
  }

  return (
    <Screen>
      <View className="mb-4 mt-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-700">
            <Text className="text-lg font-bold text-white">{initials(draft.nickname)}</Text>
          </View>
          <View>
            <Text className="text-sm text-muted">İyi günler</Text>
            <Text className="text-lg font-bold text-ink dark:text-white">{draft.nickname || 'aday'}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push('/tools/messages')} className="rounded-full bg-white px-3 py-2 dark:bg-slate-900">
          <Text className="text-sm font-semibold text-brand-700">Destek</Text>
        </Pressable>
      </View>

      {mode === 'demo' || !isSupabaseConfigured ? <Banner text="Örnek veri açık. Canlı ilanlar Supabase ve kazıyıcı bağlanınca gelir." /> : null}

      <View className="rounded-3xl bg-brand-700 p-4">
        <View className="flex-row items-end justify-between">
          <Text className="text-5xl font-bold text-white">{data?.totalPositions ?? '–'}</Text>
          {data?.newToday ? <Text className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">+ Bugün {data.newToday} yeni</Text> : null}
        </View>
        <Text className="mt-2 text-base text-white">{data ? `${data.institutionCount} kurumun güncel ilanlarını keşfet.` : 'Eşleşmeler yükleniyor.'}</Text>
        <Pressable onPress={openMatches} className="mt-4 items-center rounded-2xl bg-white py-3">
          <Text className="font-semibold text-brand-700">Uygun ilanları keşfet →</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push({ pathname: '/(tabs)/jobs', params: { scope: 'hidden' } })} className="my-3">
        <Text className="text-sm font-medium text-muted">Gizlenen ilanlar ({hiddenCount})</Text>
      </Pressable>

      <Text className="mb-3 text-sm text-muted">Son başarılı güncelleme: {formatDate(data?.lastSuccessAt)}</Text>

      <Pressable onPress={openMatches} className="mb-4 rounded-3xl bg-orange-600 p-4">
        <Text className="text-xs font-bold text-white">SON 48 SAAT · {data?.expiring48h ?? 0} İLAN</Text>
        <Text className="mt-1 text-base font-semibold text-white">Başvurusu bitmek üzere olan uygun ilanları kaçırma.</Text>
      </Pressable>

      {!draft.sgkPrimDays ? (
        <Card className="mb-4">
          <Text className="font-semibold text-ink dark:text-white">SGK geçmişini ekle</Text>
          <Text className="mt-1 text-sm text-muted">SGK şartı olan ilanları doğru görmek için prim gününü yaz.</Text>
          <Pressable onPress={() => router.push('/(onboarding)/step5-documents?edit=1')} className="mt-3">
            <Text className="font-semibold text-brand-700">Ekle</Text>
          </Pressable>
        </Card>
      ) : null}

      <View className="mb-3 flex-row flex-wrap gap-3">
        {tools.map(([label, href]) => (
          <Pressable key={href} onPress={() => router.push(href)} className="w-[48%] rounded-3xl bg-white p-4 dark:bg-slate-900">
            <Text className="font-semibold text-ink dark:text-white">{label}</Text>
          </Pressable>
        ))}
      </View>
      <Button label={expanded ? 'Daha az göster' : 'Tüm araçları gör'} variant="secondary" onPress={() => setExpanded((value) => !value)} />

      <Card className="mt-4">
        <Text className="text-sm font-semibold text-brand-700">Rakip analizi</Text>
        <Text className="mt-2 text-base leading-6 text-ink dark:text-white">
          {rank.data
            ? premium && rank.data.userRank
              ? `${rank.data.totalCandidates} aday arasında ${rank.data.userRank}. sıradasınız. KPSS puanı: ${formatScore(rank.data.userScore)}`
              : `${rank.data.totalCandidates} aday var. Sıralaman Pro pakette açılır.`
            : 'Sıralama hazırlanıyor.'}
        </Text>
        <Pressable onPress={() => router.push('/tools/competitor')} className="mt-3">
          <Text className="font-semibold text-brand-700">{premium ? 'Puan dağılımını göster' : 'Analizi incele'}</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
