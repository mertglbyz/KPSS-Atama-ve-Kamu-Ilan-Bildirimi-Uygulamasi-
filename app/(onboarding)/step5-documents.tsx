import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { StepFrame } from '@/components/StepFrame';
import { Chip, ErrorText, Field } from '@/components/ui';
import { CERTIFICATE_GROUPS } from '@/constants/catalog';
import { saveProfile } from '@/lib/data';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepDocuments() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const toggleList = useProfileStore((state) => state.toggleList);
  const userId = useAppStore((state) => state.userId);
  const mode = useAppStore((state) => state.mode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const days = Number(draft.sgkPrimDays || 0);
  const daysError = draft.sgkPrimDays && (Number.isNaN(days) || days < 0 || days > 20000) ? 'SGK prim günü 0 ile 20000 arasında olmalı.' : null;

  async function next() {
    const askSgk = draft.hasSgkHistory;
    if (askSgk && daysError) {
      setError(daysError);
      return;
    }
    setPending(true);
    const returnToProfile = draft.onboardingCompleted || Boolean(params.edit);
    const nextDraft = { ...draft, onboardingCompleted: true, sgkPrimDays: askSgk ? String(days || '') : '' };
    patch({ onboardingCompleted: true, sgkPrimDays: nextDraft.sgkPrimDays });
    try {
      if (mode === 'live' && userId) await saveProfile(userId, nextDraft);
      router.replace(returnToProfile ? '/(tabs)/profile' : '/(onboarding)/result');
    } catch (caught) {
      patch({ onboardingCompleted: draft.onboardingCompleted });
      setError(caught instanceof Error ? caught.message : 'Profil kaydedilemedi');
    } finally {
      setPending(false);
    }
  }

  return (
    <StepFrame step={5} title="Belgeler ve SGK" subtitle="Sertifika ve prim günü, şartlı kadroları doğru elemek için kullanılır." onNext={next} nextLabel={pending ? 'Kaydediliyor' : 'Profili tamamla'}>
      {draft.hasSgkHistory ? (
        <Field label="SGK prim günü" kind="integer" maxDigits={5} maxValue={20000} value={draft.sgkPrimDays} onChangeText={(sgkPrimDays) => patch({ sgkPrimDays })} hint="0 ile 20000 arasında." error={daysError} />
      ) : (
        <Text className="mb-4 text-sm leading-5 text-muted dark:text-slate-300">Sigortalı çalışma geçmişin kapalı. Prim günü bu yüzden sorulmuyor.</Text>
      )}
      {CERTIFICATE_GROUPS.map((group) => (
        <View key={group.title} className="mb-4">
          <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">{group.title}</Text>
          <View className="flex-row flex-wrap gap-2">
            {group.items.map((certificate) => (
              <Chip key={certificate} label={certificate} active={draft.certificates.includes(certificate)} onPress={() => toggleList('certificates', certificate)} />
            ))}
          </View>
        </View>
      ))}
      <ErrorText text={error} />
    </StepFrame>
  );
}
