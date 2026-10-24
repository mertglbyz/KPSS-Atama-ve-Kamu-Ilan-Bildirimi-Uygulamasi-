import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  CheckCircle2,
  Crown,
  EyeOff,
  Lock,
  XCircle,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { JobChips, JobNotice, JobRequirements } from '@/components/JobFacts';
import { BackButton, Button, Card, Screen } from '@/components/ui';
import { fetchPosition, upsertInteraction } from '@/lib/data';
import { evaluatePosition } from '@/lib/match';
import { toMatchProfile } from '@/lib/profile';
import { openOfficialSource, sourceLabel } from '@/lib/source';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function PositionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const draft = useProfileStore((state) => state.draft);
  const interactions = useProfileStore((state) => state.interactions);
  const setInteraction = useProfileStore((state) => state.setInteraction);

  const interaction = id ? interactions[id] : undefined;

  const position = useQuery({
    queryKey: ['position', id, userId, draft, premium],
    enabled: Boolean(id),
    queryFn: () => fetchPosition(userId ?? 'demo', id!, draft, premium),
  });

  const job = position.data;
  const verdict = job ? evaluatePosition(toMatchProfile(draft), job) : null;

  async function updateInteraction(partial: {
    is_hidden?: boolean;
    is_saved?: boolean;
  }) {
    if (!id) return;
    setInteraction(id, {
      isHidden: partial.is_hidden ?? interaction?.isHidden ?? false,
      isSaved: partial.is_saved ?? interaction?.isSaved ?? false,
      applicationStatus: interaction?.applicationStatus ?? 'none',
    });
    if (userId) {
      await upsertInteraction(userId, id, partial).catch(() => null);
    }
  }

  if (!job) {
    return (
      <Screen>
        <View className="mb-4">
          <BackButton fallback="/(tabs)/jobs" />
        </View>
        <Card>
          <Text className="text-center text-sm font-semibold text-[#5E6E76]">
            {position.isLoading ? 'İlan detayları yükleniyor...' : 'İlan bulunamadı.'}
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View className="gap-2">
          <Button
            label={`Resmi İlan Kılavuzunu Aç (${sourceLabel(job.sourceName)})`}
            onPress={() => openOfficialSource(job.sourceUrl)}
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() =>
                updateInteraction({ is_saved: !interaction?.isSaved })
              }
              className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border ${
                interaction?.isSaved
                  ? 'border-[#1A4A57] bg-[#E7F1F2]'
                  : 'border-[#E1E7EA] bg-white'
              }`}
            >
              <Bookmark size={15} color="#1A4A57" />
              <Text className="text-xs font-bold text-[#102A32]">
                {interaction?.isSaved ? 'Kaydedildi' : 'Kaydet'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                updateInteraction({ is_hidden: !interaction?.isHidden })
              }
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#E1E7EA] bg-white"
            >
              <EyeOff size={15} color="#5E6E76" />
              <Text className="text-xs font-bold text-[#5E6E76]">
                {interaction?.isHidden ? 'Gizlendi' : 'Listeden Gizle'}
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View className="mb-3 flex-row items-center justify-between">
        <BackButton fallback="/(tabs)/jobs" />
        <Text className="text-xs font-bold uppercase tracking-wider text-[#5E6E76]">
          KADRO DETAYI
        </Text>
      </View>

      <Card className="mb-3">
        <Text className="text-xs font-extrabold uppercase tracking-wider text-[#1A4A57]">
          {job.institutionName}
        </Text>
        <Text className="mt-1 text-xl font-extrabold text-[#102A32]">
          {job.positionTitle}
        </Text>
        <Text className="mt-1 text-xs text-[#5E6E76]">{job.announcementTitle}</Text>

        <View className="mt-3">
          <JobChips
            end={job.applicationEndDate}
            education={job.educationLevel}
            quota={job.quota}
            requiresKpss={job.requiresKpss}
            kpssType={job.kpssType}
            minKpssScore={job.minKpssScore}
          />
        </View>
      </Card>

      <JobNotice start={job.applicationStartDate} end={job.applicationEndDate} />

      {verdict ? (
        premium ? (
          <View
            className={`mb-3 rounded-2xl border p-4 ${
              verdict.matched
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-amber-300 bg-amber-50'
            }`}
          >
            <View className="flex-row items-center gap-2">
              {verdict.matched ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : (
                <XCircle size={18} color="#D97706" />
              )}
              <Text
                className={`text-sm font-extrabold ${
                  verdict.matched ? 'text-emerald-900' : 'text-amber-900'
                }`}
              >
                {verdict.matched
                  ? 'Profilin Bu Kadro Şartlarıyla Tam Uyumlu!'
                  : 'Bazı Kadro Şartları Profilinle Uyuşmuyor'}
              </Text>
            </View>

            {verdict.gaps && verdict.gaps.length > 0 ? (
              <View className="mt-2.5 gap-1">
                {verdict.gaps.map((gap: string, i: number) => (
                  <Text key={i} className="text-xs font-medium text-amber-900">
                    • {gap}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="mt-1.5 text-xs text-emerald-800">
                Eğitim düzeyin, puanın, yaş/boy ve belge kriterlerin bu kadroya başvurmak için yeterli görünüyor.
              </Text>
            )}
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/paywall')}
            className="mb-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Lock size={16} color="#B45309" />
                <Text className="text-sm font-extrabold text-amber-950">
                  Kişisel Şart Uygunluk Analizi (Pro)
                </Text>
              </View>
              <Crown size={16} color="#B45309" />
            </View>
            <Text className="mt-1.5 text-xs leading-4 text-amber-900">
              Profilinin bu kadrodaki yaş, boy, bölüm, puan ve sertifika şartlarını sağlayıp sağlamadığını görmek için Pro'ya geç.
            </Text>
          </Pressable>
        )
      ) : null}

      <JobRequirements job={job} />
    </Screen>
  );
}
