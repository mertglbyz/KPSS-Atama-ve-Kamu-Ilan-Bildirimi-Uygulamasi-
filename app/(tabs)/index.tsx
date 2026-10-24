import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Clock,
  Crown,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Banner, Card, Screen } from '@/components/ui';
import { fetchDistribution, fetchRank, fetchSummary } from '@/lib/data';
import { formatScore, initials } from '@/lib/format';
import { highestEducation } from '@/lib/profile';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function HomeScreen() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const plan = useAppStore((state) => state.plan);
  const draft = useProfileStore((state) => state.draft);

  const primaryDept =
    draft.educations[0]?.department || 'Genel Kamu Yönetimi';
  const topLevel = highestEducation(draft);

  const summary = useQuery({
    queryKey: ['summary', userId, draft],
    queryFn: () => fetchSummary(userId ?? 'demo', draft),
  });

  const rank = useQuery({
    queryKey: ['rank', userId, draft, premium],
    queryFn: () => fetchRank(userId ?? 'demo', draft, premium),
  });

  const buckets = useQuery({
    queryKey: ['dist', userId, primaryDept, premium],
    queryFn: () => fetchDistribution(userId ?? 'demo', primaryDept, premium),
  });

  const maxBucket = Math.max(
    ...(buckets.data?.map((b) => b.count) ?? [1]),
    1
  );

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          className="flex-row items-center gap-3"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#1A4A57]">
            <Text className="text-base font-extrabold text-white">
              {initials(draft.nickname || 'Aday')}
            </Text>
          </View>
          <View>
            <Text className="text-lg font-extrabold text-[#102A32]">
              Merhaba, {draft.nickname || 'Aday'}
            </Text>
            <Text className="text-xs font-medium text-[#5E6E76]">
              {topLevel} •{' '}
              {draft.hasKpss
                ? `${draft.kpssType}: ${draft.kpssScore} Puan`
                : 'KPSS Şartsız Aday'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/paywall')}
          className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
            premium
              ? 'bg-[#1A4A57]'
              : 'border border-amber-300 bg-amber-50'
          }`}
        >
          <Crown size={13} color={premium ? '#FDE68A' : '#B45309'} />
          <Text
            className={`text-[11px] font-extrabold ${
              premium ? 'text-amber-200' : 'text-amber-900'
            }`}
          >
            {premium ? 'PRO AKTİF' : "PRO'YA GEÇ"}
          </Text>
        </Pressable>
      </View>

      {!draft.onboardingCompleted ? (
        <Pressable onPress={() => router.push('/(onboarding)/step1-personal')}>
          <Banner text="Profil bilgilerin henüz eksik. Sana tam uyan memur ve işçi kadrolarını görmek için dokun ve tamamla." />
        </Pressable>
      ) : null}

      <View className="mb-4 rounded-3xl bg-[#1A4A57] p-5 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={15} color="#FDE68A" />
            <Text className="text-xs font-bold uppercase tracking-wider text-amber-200">
              CANLI EŞLEŞME DURUMU
            </Text>
          </View>
          <Text className="text-[11px] font-medium text-white/75">
            {summary.data?.institutionCount ?? 0} Kurum
          </Text>
        </View>

        <View className="mt-3 flex-row items-baseline gap-2">
          <Text className="text-4xl font-extrabold text-white">
            {summary.data?.totalPositions ?? 0}
          </Text>
          <Text className="text-sm font-semibold text-white/85">
            kadro şartlarınla uyumlu
          </Text>
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <Pressable
            onPress={() => router.push('/(tabs)/jobs')}
            className="flex-1 rounded-2xl bg-white/10 p-3"
          >
            <View className="flex-row items-center gap-1.5">
              <Briefcase size={13} color="#A7F3D0" />
              <Text className="text-[11px] font-semibold text-white/80">
                Bugün Eklenen
              </Text>
            </View>
            <Text className="mt-1 text-lg font-extrabold text-white">
              +{summary.data?.newToday ?? 0} İlan
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/jobs')}
            className="flex-1 rounded-2xl bg-white/10 p-3"
          >
            <View className="flex-row items-center gap-1.5">
              <Clock size={13} color="#FDE68A" />
              <Text className="text-[11px] font-semibold text-white/80">
                Son 48 Saat
              </Text>
            </View>
            <Text className="mt-1 text-lg font-extrabold text-amber-200">
              {summary.data?.expiring48h ?? 0} İlan
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/jobs')}
          className="mt-3.5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3 active:opacity-90"
        >
          <Text className="text-xs font-extrabold text-[#102A32]">
            Bana Uygun İlanları İncele
          </Text>
          <ArrowRight size={15} color="#102A32" />
        </Pressable>
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#E7F1F2]">
              <Trophy size={16} color="#1A4A57" />
            </View>
            <View>
              <Text className="text-sm font-extrabold text-[#102A32]">
                Bölüm İçi Rakip Sıralaması
              </Text>
              <Text numberOfLines={1} className="text-xs text-[#5E6E76]">
                {primaryDept}
              </Text>
            </View>
          </View>

          {premium ? (
            <View className="rounded-full bg-emerald-100 px-2.5 py-1">
              <Text className="text-[10px] font-extrabold text-emerald-800">
                PRO VERİSİ
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1">
              <Lock size={11} color="#92400E" />
              <Text className="text-[10px] font-extrabold text-amber-900">
                PRO ÖZELLİK
              </Text>
            </View>
          )}
        </View>

        {premium ? (
          <View className="mt-3.5 rounded-2xl bg-[#F4F7F8] p-3.5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-[#5E6E76]">Tahmini Sıralaman</Text>
                <Text className="mt-0.5 text-2xl font-extrabold text-[#1A4A57]">
                  {rank.data?.userRank ? `${rank.data.userRank}. Sıra` : 'Hesaplanıyor'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-[#5E6E76]">Toplam Rakip Aday</Text>
                <Text className="mt-0.5 text-base font-bold text-[#102A32]">
                  {rank.data?.totalCandidates ?? 0} Kişi
                </Text>
              </View>
            </View>
            <Text className="mt-2 text-[11px] text-[#5E6E76]">
              Baz alınan puanın: {formatScore(rank.data?.userScore ?? Number(draft.kpssScore || 0))} ({plan.toUpperCase()} aboneliği ile canlı güncellenir)
            </Text>
          </View>
        ) : (
          <View className="mt-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFB] p-3.5">
            <Text className="text-xs font-semibold leading-4 text-[#102A32]">
              Mezun olduğun bölümdeki {rank.data?.totalCandidates ?? 240}+ aday arasında kaçıncı sırada olduğunu görmek için Pro'ya geç.
            </Text>
            <Pressable
              onPress={() => router.push('/paywall')}
              className="mt-2.5 h-9 flex-row items-center justify-center gap-1.5 rounded-xl bg-[#1A4A57] px-3"
            >
              <Crown size={13} color="#FDE68A" />
              <Text className="text-xs font-bold text-white">
                Sıralamamı ve Rakiplerimi Gör
              </Text>
            </Pressable>
          </View>
        )}
      </Card>

      <Card className="mb-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#E7F1F2]">
              <BarChart3 size={16} color="#1A4A57" />
            </View>
            <View>
              <Text className="text-sm font-extrabold text-[#102A32]">
                Aday Puan Dağılımı
              </Text>
              <Text className="text-xs text-[#5E6E76]">
                Aynı kadroları hedefleyen adayların puan yığılması
              </Text>
            </View>
          </View>
        </View>

        {premium ? (
          <View className="gap-2">
            {(buckets.data ?? []).map((bucket) => {
              const widthPct = Math.max(
                Math.round((bucket.count / maxBucket) * 100),
                8
              );
              return (
                <View key={bucket.label} className="flex-row items-center gap-2.5">
                  <Text className="w-16 text-xs font-bold text-[#5E6E76]">
                    {bucket.label}
                  </Text>
                  <View className="h-6 flex-1 overflow-hidden rounded-lg bg-[#F4F7F8]">
                    <View
                      style={{ width: `${widthPct}%` }}
                      className="h-full rounded-lg bg-[#1A4A57]"
                    />
                  </View>
                  <Text className="w-12 text-right text-xs font-extrabold text-[#102A32]">
                    {bucket.count}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/paywall')}
            className="items-center rounded-2xl bg-[#F4F7F8] p-4"
          >
            <Lock size={20} color="#1A4A57" />
            <Text className="mt-1.5 text-xs font-bold text-[#102A32]">
              Puan Dağılım Grafiği Pro Üyelere Özeldir
            </Text>
            <Text className="mt-0.5 text-center text-[11px] text-[#5E6E76]">
              Hangi puan aralığında kaç rakibin olduğunu görmek için dokun.
            </Text>
          </Pressable>
        )}
      </Card>
    </Screen>
  );
}
