import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Card, Choice, Screen, Title } from '@/components/ui';
import { fetchCards, fetchMatches } from '@/lib/data';
import { formatDay } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const SCOPES = [
  ['all', 'Tümü'],
  ['matches', 'Bana uygun'],
  ['saved', 'Favoriler'],
  ['hidden', 'Gizlenen'],
] as const;

export default function JobsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const initial = SCOPES.some(([id]) => id === params.scope) ? (params.scope as (typeof SCOPES)[number][0]) : 'all';
  const [scope, setScope] = useState<(typeof SCOPES)[number][0]>(initial);
  useEffect(() => {
    if (SCOPES.some(([id]) => id === params.scope)) setScope(params.scope as (typeof SCOPES)[number][0]);
  }, [params.scope]);
  const [query, setQuery] = useState('');
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const draft = useProfileStore((state) => state.draft);
  const interactions = useProfileStore((state) => state.interactions);
  const cards = useQuery({ queryKey: ['cards'], queryFn: () => fetchCards('active') });
  const matches = useQuery({ queryKey: ['matches', userId, draft, premium], enabled: Boolean(userId), queryFn: () => fetchMatches(userId!, draft, premium) });

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
          meta: `${job.quota} kontenjan · ${formatDay(job.applicationEndDate)}`,
        }));
    }
    return (cards.data ?? [])
      .filter((card) => {
        const interaction = interactions[card.positionId];
        if (scope === 'saved') return interaction?.isSaved;
        if (scope === 'hidden') return interaction?.isHidden;
        return !interaction?.isHidden;
      })
      .filter((card) => `${card.institutionName} ${card.positionTitle}`.toLocaleLowerCase('tr-TR').includes(needle))
      .map((card) => ({
        id: card.positionId,
        title: card.positionTitle,
        institution: card.institutionName,
        meta: `${card.educationLevel} · ${card.cities.slice(0, 2).join(', ') || 'Tüm Türkiye'} · ${formatDay(card.applicationEndDate)}`,
      }));
  }, [cards.data, interactions, matches.data, query, scope]);

  return (
    <Screen>
      <Title subtitle="Herkese açık ilan kartları ve, Pro ise, profiline uyan kadrolar.">İlanlar</Title>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Kurum veya unvan ara"
        placeholderTextColor="#94A3B8"
        className="mb-3 rounded-2xl border border-line bg-white px-4 py-3 text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
      <Choice options={SCOPES.map(([, label]) => label)} value={SCOPES.find(([id]) => id === scope)?.[1] ?? 'Tümü'} onChange={(label) => setScope(SCOPES.find(([, name]) => name === label)?.[0] ?? 'all')} />
      {scope === 'matches' && !premium ? (
        <Card>
          <Text className="text-lg font-semibold text-ink dark:text-white">Kişiye özel kadrolar kilitli</Text>
          <Text className="mt-2 text-sm leading-5 text-muted">Eşleşme sayısı ana sayfada görünür. Unvan, şart ve başvuru ayrıntısı Pro abonelikle açılır.</Text>
          <View className="mt-4">
            <Button label="Pro'yu aç" onPress={() => router.push('/paywall')} />
          </View>
        </Card>
      ) : rows.length === 0 ? (
        <Text className="mt-6 text-muted">{cards.isLoading ? 'İlanlar yükleniyor.' : 'Bu görünümde ilan yok.'}</Text>
      ) : (
        rows.map((row) => (
          <Pressable key={row.id} onPress={() => router.push(`/position/${row.id}`)} className="mb-3 rounded-3xl border border-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Text className="text-xs font-semibold text-brand-700">{row.institution}</Text>
            <Text className="mt-1 text-lg font-bold text-ink dark:text-white">{row.title}</Text>
            <Text className="mt-1 text-sm text-muted">{row.meta}</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
