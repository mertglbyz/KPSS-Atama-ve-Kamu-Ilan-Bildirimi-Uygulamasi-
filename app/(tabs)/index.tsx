import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Banner, Card, Screen } from '@/components/ui';
import { fetchDistribution, fetchRank, fetchSummary } from '@/lib/data';
import { formatDate, formatScore, initials, parseScore } from '@/lib/format';
import { isSupabaseConfigured } from '@/lib/env';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function Dashboard() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const mode = useAppStore((state) => state.mode);
  const draft = useProfileStore((state) => state.draft);
  const [showDistribution, setShowDistribution] = useState(false);
  const summary = useQuery({ queryKey: ['summary', userId, draft], enabled: Boolean(userId), queryFn: () => fetchSummary(userId!, draft) });
  const rank = useQuery({ queryKey: ['rank', userId, draft, premium], enabled: Boolean(userId), queryFn: () => fetchRank(userId!, draft, premium) });
  const department = draft.educations.find((item) => item.department)?.department || 'Bölümünüz';
  const data = summary.data;
  const totalCandidates = rank.data?.totalCandidates ?? 0;
  const userRank = rank.data?.userRank;
  const score = rank.data?.userScore || parseScore(draft.kpssScore) || 0;
  const buckets = useQuery({
    queryKey: ['dist', userId, department, premium],
    enabled: Boolean(userId) && showDistribution,
    queryFn: () => fetchDistribution(userId!, department, premium),
  });
  const maxBucket = Math.max(...(buckets.data ?? []).map((bucket) => bucket.count), 1);

  function openMatches() {
    if (!premium) {
      router.push('/paywall');
      return;
    }
    router.push({ pathname: '/(tabs)/jobs', params: { scope: 'matches' } });
  }

  return (
    <Screen>
      <View className="mb-6 mt-2 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-ink">
          <Text className="text-lg font-bold text-white">{initials(draft.nickname)}</Text>
        </View>
        <View>
          <Text className="text-xs font-semibold tracking-[2px] text-muted">İYİ GÜNLER</Text>
          <Text className="text-xl font-bold text-ink dark:text-white">{draft.nickname || 'aday'}</Text>
        </View>
      </View>

      {mode === 'demo' || !isSupabaseConfigured ? <Banner text="Örnek veri açık. Canlı ilanlar Supabase ve kazıyıcı bağlanınca gelir." /> : null}

      <View className="rounded-3xl bg-ink p-5" style={{ shadowColor: '#111827', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 }}>
        <Text className="text-xs font-semibold tracking-[2px] text-slate-300">SANA UYGUN</Text>
        <View className="mt-2 flex-row items-end justify-between">
          <Text className="text-6xl font-bold text-white">{data?.totalPositions ?? '–'}</Text>
          {data?.newToday ? <Text className="mb-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">+{data.newToday} bugün</Text> : null}
        </View>
        <Text className="mt-2 text-base text-slate-300">{data ? `${data.institutionCount} kurumda güncel ilan var.` : 'Eşleşmeler yükleniyor.'}</Text>
        <Pressable accessibilityRole="button" onPress={openMatches} className="mt-5 items-center rounded-2xl bg-white py-4">
          <Text className="font-semibold text-ink">Uygun ilanları keşfet</Text>
        </Pressable>
      </View>

      <Text className="mb-4 mt-3 text-xs text-muted">Son güncelleme {formatDate(data?.lastSuccessAt)}</Text>

      <Pressable accessibilityRole="button" onPress={openMatches} className="mb-4 rounded-3xl border border-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <Text className="text-xs font-semibold tracking-wide text-brand-700">SON 48 SAAT</Text>
        <Text className="mt-2 text-3xl font-bold text-ink dark:text-white">{data?.expiring48h ?? 0}</Text>
        <Text className="mt-1 text-sm text-muted">Başvurusu bitmek üzere olan uygun ilan.</Text>
      </Pressable>

      {!draft.sgkPrimDays ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/(onboarding)/step5-documents?edit=1')} className="mb-4">
          <Text className="text-sm font-semibold text-brand-700">SGK prim gününü ekle</Text>
        </Pressable>
      ) : null}

      <View className="mb-3">
        <Text className="text-lg font-bold text-ink dark:text-white">Rakip analizi</Text>
        <Text className="mt-1 text-sm text-muted">KPSS puanınız ve bölüm bazında aday sıralamanız.</Text>
      </View>
      <Card>
        <Text className="mb-3 font-semibold text-ink dark:text-white">{department}</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-brand-50 px-3 py-4 dark:bg-slate-800">
            <Text className="text-xs text-muted">{totalCandidates.toLocaleString('tr-TR')} aday arasında</Text>
            <Text className="mt-1 text-4xl font-bold text-ink dark:text-white">{userRank ? `${userRank.toLocaleString('tr-TR')}.` : '—'}</Text>
            <Text className="text-sm text-muted">sıradasınız</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-line bg-white px-3 py-4 dark:border-slate-700 dark:bg-slate-900">
            <Text className="text-xs text-muted">KPSS puanı</Text>
            <Text className="mt-1 text-4xl font-bold text-brand-700">{draft.hasKpss ? formatScore(score) : '—'}</Text>
            <Text className="text-sm text-muted">100 üzerinden</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setShowDistribution((value) => !value)} className="mt-4">
          <Text className="font-semibold text-brand-700">{showDistribution ? 'Puan dağılımını gizle' : 'Puan dağılımını göster'}</Text>
        </Pressable>
        {showDistribution ? (
          <View className="mt-3 gap-2">
            {(buckets.data ?? []).length === 0 ? <Text className="text-sm text-muted">Bu bölüm için henüz dağılım yok.</Text> : null}
            {(buckets.data ?? []).map((bucket) => (
              <View key={bucket.label}>
                <Text className="text-xs text-muted">{bucket.label} · {bucket.count}</Text>
                <View className="mt-1 h-2 overflow-hidden rounded-full bg-brand-50">
                  <View className="h-2 rounded-full bg-brand-700" style={{ width: `${(bucket.count / maxBucket) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/jobs', params: { scope: 'archive' } })} className="mt-4">
        <Text className="text-sm font-semibold text-brand-700">Geçmiş ilanlar</Text>
      </Pressable>
    </Screen>
  );
}
