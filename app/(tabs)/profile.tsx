import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Card, Screen, Title } from '@/components/ui';
import { formatScore, parseScore } from '@/lib/format';
import { useProfileStore } from '@/store/useProfileStore';

const LINKS = [
  ['Kişisel bilgiler', '/(onboarding)/step1-personal'],
  ['Eğitim', '/(onboarding)/step2-education'],
  ['Sınavlar', '/(onboarding)/step3-exams'],
  ['Ehliyet ve özel durum', '/(onboarding)/step4-details'],
  ['Belgeler ve SGK', '/(onboarding)/step5-documents'],
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const draft = useProfileStore((state) => state.draft);
  const score = parseScore(draft.kpssScore);

  return (
    <Screen>
      <Title subtitle="Eşleşme bu özete göre çalışır.">Profil</Title>
      <Card className="mb-4">
        <Text className="text-xl font-bold text-ink dark:text-white">{draft.nickname}</Text>
        <Text className="mt-2 text-sm leading-6 text-muted dark:text-slate-300">
          {draft.age} yaş · {draft.gender} · {draft.city}
          {'\n'}
          {draft.educations.map((item) => `${item.level} / ${item.department}`).join('\n')}
          {'\n'}
          KPSS {draft.hasKpss ? `${draft.kpssType} ${score == null ? '' : formatScore(score)}` : 'yok'}
          {'\n'}
          Ehliyet: {draft.driverLicenses.join(', ') || 'yok'} · SGK: {draft.sgkPrimDays || '0'} gün
        </Text>
      </Card>
      {LINKS.map(([label, href]) => (
        <Pressable key={href} onPress={() => router.push(`${href}?edit=1`)} className="mb-2 rounded-2xl bg-white px-4 py-4 dark:bg-slate-900">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-ink dark:text-white">{label}</Text>
            <Text className="text-brand-700 dark:text-brand-100">Düzenle</Text>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
