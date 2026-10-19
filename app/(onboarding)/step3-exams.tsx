import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { StepFrame } from '@/components/StepFrame';
import { Choice, ErrorText, Field } from '@/components/ui';
import { KPSS_TYPES } from '@/constants/catalog';
import { parseScore } from '@/lib/format';
import { highestEducation } from '@/lib/profile';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepExams() {
  const router = useRouter();
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const [error, setError] = useState<string | null>(null);
  const level = highestEducation(draft) ?? 'Lisans';
  const types = KPSS_TYPES[level];

  function next() {
    if (draft.hasKpss == null) return setError('KPSS durumunu seç.');
    if (draft.hasKpss) {
      const score = parseScore(draft.kpssScore);
      if (score == null || score < 0 || score > 100) return setError('KPSS puanını 0 ile 100 arasında gir. Ondalık için virgül kullanabilirsin.');
      if (!types.includes(draft.kpssType)) return setError('Puan türünü seç.');
    }
    const yds = parseScore(draft.ydsScore);
    const ales = parseScore(draft.alesScore);
    if (draft.ydsScore && (yds == null || yds < 0 || yds > 100)) return setError('YDS puanını kontrol et.');
    if (draft.alesScore && (ales == null || ales < 0 || ales > 100)) return setError('ALES puanını kontrol et.');
    router.push('/(onboarding)/step4-details');
  }

  return (
    <StepFrame step={3} title="Sınav bilgileri" subtitle="Puanın yoksa KPSS şartsız işçi ve kura ilanları yine de eşleşebilir." onNext={next}>
      <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">KPSS durumu</Text>
      <Choice
        options={['Puanım var', 'Puanım yok']}
        value={draft.hasKpss == null ? '' : draft.hasKpss ? 'Puanım var' : 'Puanım yok'}
        onChange={(value) => patch({ hasKpss: value === 'Puanım var', kpssType: types[0] })}
      />
      {draft.hasKpss ? (
        <>
          <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">Puan türü</Text>
          <Choice options={types} value={draft.kpssType} onChange={(kpssType) => patch({ kpssType })} />
          <Field label="KPSS puanı" value={draft.kpssScore} onChangeText={(kpssScore) => patch({ kpssScore })} placeholder="81,1288" keyboardType="decimal-pad" />
        </>
      ) : null}
      <Field label="YDS (isteğe bağlı)" value={draft.ydsScore} onChangeText={(ydsScore) => patch({ ydsScore })} keyboardType="decimal-pad" />
      <Field label="ALES (isteğe bağlı)" value={draft.alesScore} onChangeText={(alesScore) => patch({ alesScore })} keyboardType="decimal-pad" />
      <ErrorText text={error} />
    </StepFrame>
  );
}
