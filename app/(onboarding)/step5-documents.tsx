import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { StepFrame } from '@/components/StepFrame';
import { Chip, ErrorText, Field } from '@/components/ui';
import { CERTIFICATES } from '@/constants/catalog';
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

  async function next() {
    const days = Number(draft.sgkPrimDays || 0);
    if (draft.sgkPrimDays && (Number.isNaN(days) || days < 0 || days > 20000)) {
      setError('SGK prim gününü kontrol et.');
      return;
    }
    if (!userId) return;
    setPending(true);
    const returnToProfile = draft.onboardingCompleted || Boolean(params.edit);
    const nextDraft = { ...draft, onboardingCompleted: true, sgkPrimDays: String(days || '') };
    patch({ onboardingCompleted: true });
    try {
      if (mode === 'live') await saveProfile(userId, nextDraft);
      router.replace(returnToProfile ? '/(tabs)/profile' : '/(onboarding)/result');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Profil kaydedilemedi');
    } finally {
      setPending(false);
    }
  }

  return (
    <StepFrame step={5} title="Belgeler ve SGK" subtitle="Sertifika ve prim günü, şartlı kadroları doğru elemek için kullanılır." onNext={next} nextLabel={pending ? 'Kaydediliyor' : 'Profili tamamla'}>
      <Field label="SGK prim günü" kind="integer" maxDigits={5} maxValue={20000} value={draft.sgkPrimDays} onChangeText={(sgkPrimDays) => patch({ sgkPrimDays, hasSgkHistory: Number(sgkPrimDays) > 0 })} />
      <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">Sertifikalar</Text>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {CERTIFICATES.map((certificate) => (
          <Chip key={certificate} label={certificate} active={draft.certificates.includes(certificate)} onPress={() => toggleList('certificates', certificate)} />
        ))}
      </View>
      <ErrorText text={error} />
    </StepFrame>
  );
}
