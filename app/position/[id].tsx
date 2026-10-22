import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { JobChips, JobNotice, JobRequirements } from '@/components/JobFacts';
import { BackButton, Button, Card, Screen } from '@/components/ui';
import { openOfficialSource } from '@/lib/source';
import { fetchPosition, upsertInteraction } from '@/lib/data';
import { evaluatePosition } from '@/lib/match';
import { toMatchProfile } from '@/lib/profile';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function PositionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const draft = useProfileStore((state) => state.draft);
  const interaction = useProfileStore((state) => (id ? state.interactions[id] : undefined));
  const setInteraction = useProfileStore((state) => state.setInteraction);
  const position = useQuery({
    queryKey: ['position', id, premium],
    enabled: Boolean(id && userId),
    queryFn: () => fetchPosition(userId!, id!, draft, premium),
  });
  const job = position.data;
  const verdict = job && premium ? evaluatePosition(toMatchProfile(draft), job) : null;

  async function update(partial: { is_hidden?: boolean; is_saved?: boolean }) {
    if (!id) return;
    setInteraction(id, {
      isHidden: partial.is_hidden ?? interaction?.isHidden ?? false,
      isSaved: partial.is_saved ?? interaction?.isSaved ?? false,
      applicationStatus: interaction?.applicationStatus ?? 'none',
    });
    if (userId) await upsertInteraction(userId, id, partial);
  }

  function hide() {
    void update({ is_hidden: true });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/jobs');
  }

  if (!job) {
    return (
      <Screen>
        <BackButton fallback="/(tabs)/jobs" />
        <Text className="mt-6 text-muted dark:text-slate-300">{position.isLoading ? 'İlan yükleniyor' : 'İlan bulunamadı'}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton fallback="/(tabs)/jobs" />
      <Text className="text-sm font-semibold text-brand-700 dark:text-brand-100">{job.institutionName}</Text>
      <Text className="mt-1 text-2xl font-bold text-ink dark:text-white">{job.positionTitle}</Text>
      <Text className="mt-2 text-sm text-muted dark:text-slate-300">{job.announcementTitle}</Text>
      <JobNotice start={job.applicationStartDate} end={job.applicationEndDate} />
      <JobChips end={job.applicationEndDate} education={job.educationLevel} quota={job.quota} requiresKpss={job.requiresKpss} kpssType={job.kpssType} minKpssScore={job.minKpssScore} />
      {premium && verdict ? (
        <Card className="mt-4">
          <Text className="font-semibold text-ink dark:text-white">{verdict.matched ? 'Profilinle uyumlu' : 'Profilinle uymuyor'}</Text>
          {verdict.gaps.length ? <Text className="mt-2 text-sm leading-5 text-muted dark:text-slate-300">{verdict.gaps.join(' · ')}</Text> : null}
        </Card>
      ) : null}
      <Card className="mt-4">
        <JobRequirements job={job} />
      </Card>
      {job.sourceUrl ? (
        <View className="mt-3">
          <Button label="Resmi ilanı aç" onPress={() => void openOfficialSource(job.sourceName, job.sourceUrl, job.announcementTitle, job.institutionName, job.applicationStartDate)} />
          <Text className="mt-2 text-center text-xs text-muted dark:text-slate-300">İlanın yayınlandığı sitede tam metni ve ekleri görürsün.</Text>
        </View>
      ) : null}
      <View className="mt-4 gap-3">
        <Button label={interaction?.isSaved ? 'Favoriden çıkar' : 'Favorilere ekle'} variant="secondary" onPress={() => void update({ is_saved: !interaction?.isSaved })} />
        <Button label="Gizle" variant="ghost" onPress={hide} />
      </View>
    </Screen>
  );
}
