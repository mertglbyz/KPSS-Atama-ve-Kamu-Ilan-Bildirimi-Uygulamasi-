import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { searchText } from '@/lib/input';
import { CardActions, JobChips, JobNotice } from '@/components/JobFacts';
import { openOfficialSource, sourceLabel } from '@/lib/source';
import { Button, Card, Choice, Screen, Title } from '@/components/ui';
import { fetchCards, fetchMatches, upsertInteraction } from '@/lib/data';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const SCOPES = [
  ['all', 'Tümü'],
  ['matches', 'Bana uygun'],
  ['saved', 'Favoriler'],
  ['archive', 'Geçmiş'],
  ['hidden', 'Gizlenen'],
] as const;

export default function JobsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const requested = SCOPES.some(([id]) => id === params.scope) ? (params.scope as (typeof SCOPES)[number][0]) : null;
  const [scope, setScope] = useState<(typeof SCOPES)[number][0]>(requested ?? 'all');
  const [seenScope, setSeenScope] = useState(requested);
  if (requested !== seenScope) {
    setSeenScope(requested);
    if (requested) setScope(requested);
  }
  const [query, setQuery] = useState('');
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const draft = useProfileStore((state) => state.draft);
  const interactions = useProfileStore((state) => state.interactions);
  const setInteraction = useProfileStore((state) => state.setInteraction);
  const cards = useQuery({ queryKey: ['cards'], queryFn: () => fetchCards('active') });
  const archive = useQuery({ queryKey: ['archive'], queryFn: () => fetchCards('archived'), enabled: scope === 'archive' });
  const matches = useQuery({ queryKey: ['matches', userId, draft, premium], enabled: Boolean(userId), queryFn: () => fetchMatches(userId!, draft, premium) });
  const matchIds = useMemo(() => new Set((matches.data ?? []).map((job) => job.id)), [matches.data]);

  const rows = useMemo(() => {
    const needle = query.toLocaleLowerCase('tr-TR');
    if (scope === 'matches') {
      return (matches.data ?? [])
        .filter((job) => !interactions[job.id]?.isHidden)
        .filter((job) => `${job.institutionName} ${job.positionTitle}`.toLocaleLowerCase('tr-TR').includes(needle))
        .map((job) => ({
          id: job.id,
          title: job.positionTitle,
          institution: job.institutionName,
          end: job.applicationEndDate,
          start: job.applicationStartDate,
          education: job.educationLevel,
          quota: job.quota,
          requiresKpss: job.requiresKpss,
          kpssType: job.kpssType,
          minKpssScore: job.minKpssScore,
          sourceUrl: job.sourceUrl,
          sourceName: job.sourceName,
          announcement: job.announcementTitle,
        }));
    }
    const source = scope === 'archive' ? archive.data ?? [] : cards.data ?? [];
    return source
      .filter((card) => {
        const interaction = interactions[card.positionId];
        if (scope === 'archive') return true;
        if (scope === 'saved') return interaction?.isSaved;
        if (scope === 'hidden') return interaction?.isHidden;
        return !interaction?.isHidden;
      })
      .filter((card) => `${card.institutionName} ${card.positionTitle}`.toLocaleLowerCase('tr-TR').includes(needle))
      .map((card) => ({
        id: card.positionId,
        title: card.positionTitle,
        institution: card.institutionName,
        end: card.applicationEndDate,
        start: card.applicationStartDate,
        education: card.educationLevel,
        quota: card.quota,
        requiresKpss: card.requiresKpss,
        kpssType: card.kpssType,
        minKpssScore: card.minKpssScore,
        sourceUrl: card.sourceUrl,
        sourceName: card.sourceName,
        announcement: card.announcementTitle,
      }));
  }, [archive.data, cards.data, interactions, matches.data, query, scope]);

  return (
    <Screen>
      <Title subtitle="Herkese açık ilan kartları. Pro abonelikte profiline uyan kadrolar da açılır.">İlanlar</Title>
      <TextInput
        value={query}
        onChangeText={(next) => setQuery(searchText(next))}
        autoCorrect={false}
        maxLength={60}
        placeholder="Kurum veya unvan ara"
        placeholderTextColor="#94A3B8"
        className="mb-3 rounded-2xl border border-line bg-white px-4 py-3 text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
      <Choice options={SCOPES.map(([, label]) => label)} value={SCOPES.find(([id]) => id === scope)?.[1] ?? 'Tümü'} onChange={(label) => setScope(SCOPES.find(([, name]) => name === label)?.[0] ?? 'all')} />
      {scope === 'matches' && !premium ? (
        <Card>
          <Text className="text-lg font-semibold text-ink dark:text-white">Kişiye özel kadrolar kilitli</Text>
          <Text className="mt-2 text-sm leading-5 text-muted dark:text-slate-300">Eşleşme sayısı ana sayfada görünür. Unvan, şart ve başvuru ayrıntısı Pro abonelikle açılır.</Text>
          <View className="mt-4">
            <Button label="Pro'ya geç" onPress={() => router.push('/paywall')} />
          </View>
        </Card>
      ) : rows.length === 0 ? (
        <Text className="mt-6 text-muted dark:text-slate-300">{cards.isLoading || archive.isLoading ? 'İlanlar yükleniyor.' : 'Bu görünümde ilan yok.'}</Text>
      ) : (
        rows.map((row) => {
          const interaction = interactions[row.id];
          function remember(partial: { is_saved?: boolean; is_hidden?: boolean }) {
            setInteraction(row.id, {
              isSaved: partial.is_saved ?? interaction?.isSaved ?? false,
              isHidden: partial.is_hidden ?? interaction?.isHidden ?? false,
              applicationStatus: interaction?.applicationStatus ?? 'none',
            });
            if (userId) void upsertInteraction(userId, row.id, partial);
          }
          return (
            <View key={row.id} className="mb-3 rounded-3xl border border-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Pressable accessibilityRole="button" onPress={() => router.push(`/position/${row.id}`)}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-brand-700 dark:text-brand-100">{row.institution}</Text>
                  <Text className="mt-1 text-lg font-bold text-ink dark:text-white">{row.title}</Text>
                </View>
                {matchIds.has(row.id) ? <Text className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Uygun</Text> : null}
              </View>
              <JobNotice start={row.start} end={row.end} />
              <JobChips end={row.end} education={row.education} quota={row.quota} requiresKpss={row.requiresKpss} kpssType={row.kpssType} minKpssScore={row.minKpssScore} />
              </Pressable>
              <CardActions
                saved={Boolean(interaction?.isSaved)}
                hidden={Boolean(interaction?.isHidden)}
                onSave={() => remember({ is_saved: !interaction?.isSaved })}
                onHide={() => remember({ is_hidden: !interaction?.isHidden })}
                onOpen={() => router.push(`/position/${row.id}`)}
              />
              {row.sourceUrl ? (
                <Pressable accessibilityRole="link" onPress={() => void openOfficialSource(row.sourceName, row.sourceUrl, row.announcement, row.institution, row.start)} className="mt-3">
                  <Text className="text-sm font-semibold text-brand-700 dark:text-brand-100">{sourceLabel(row.sourceName)} sitesinde aç</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </Screen>
  );
}
