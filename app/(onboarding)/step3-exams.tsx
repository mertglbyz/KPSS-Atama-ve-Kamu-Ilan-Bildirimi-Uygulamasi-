import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { StepFrame } from '@/components/StepFrame';
import { Choice, ErrorText, Field } from '@/components/ui';
import { KPSS_TYPES } from '@/constants/catalog';
import { parseScore } from '@/lib/format';
import { highestEducation } from '@/lib/profile';
import { advance } from '@/lib/flow';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepExams() {
  const router = useRouter();
  const editing = Boolean(useLocalSearchParams<{ edit?: string }>().edit);
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const [error, setError] = useState<string | null>(null);
  const [extraScore, setExtraScore] = useState('');
  const [checked, setChecked] = useState(false);
  const level = highestEducation(draft) ?? 'Lisans';
  const types = KPSS_TYPES[level];
  const [extraType, setExtraType] = useState(types[0] ?? 'P3');
  const kpssScore = parseScore(draft.kpssScore);
  const ydsScore = parseScore(draft.ydsScore);
  const alesScore = parseScore(draft.alesScore);
  const kpssError = draft.hasKpss
    ? !draft.kpssScore
      ? 'KPSS puanı gir. Aralık 0 ile 100.'
      : kpssScore == null || kpssScore < 0 || kpssScore > 100
        ? 'KPSS puanı 0 ile 100 arasında olmalı.'
        : null
    : null;
  const ydsError = draft.ydsScore && (ydsScore == null || ydsScore < 0 || ydsScore > 100) ? 'YDS puanı 0 ile 100 arasında olmalı.' : null;
  const alesError = draft.alesScore && (alesScore == null || alesScore < 0 || alesScore > 100) ? 'ALES puanı 0 ile 100 arasında olmalı.' : null;

  function next() {
    setChecked(true);
    if (draft.hasKpss == null) return setError('KPSS durumunu seç.');
    if (draft.hasKpss) {
      if (kpssError) return setError(kpssError);
      if (!types.includes(draft.kpssType)) return setError('Puan türünü seç.');
      if ((draft.kpssScores ?? []).some((item) => !types.includes(item.type) || parseScore(item.score) == null)) return setError('Ek KPSS puanını kontrol et.');
    }
    if (ydsError) return setError(ydsError);
    if (alesError) return setError(alesError);
    setError(null);
    void advance(router, '/(onboarding)/step4-details', editing);
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
          <Field label="KPSS puanı" kind="score" value={draft.kpssScore} onChangeText={(kpssScore) => patch({ kpssScore })} placeholder="81,1288" hint="0 ile 100 arasında. Ondalık için virgül kullan." error={(draft.kpssScore || checked) ? kpssError : null} />
          <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">Varsa ikinci puanın</Text>
          <Text className="mb-2 text-xs leading-5 text-muted dark:text-slate-300">A grubu adayları Hukuk, İktisat, Maliye gibi alan puanını da ekleyebilir. İlan o puanı istiyorsa o puanla eşleşir.</Text>
          {(draft.kpssScores ?? []).map((item) => (
            <Pressable key={`${item.type}-${item.score}`} onPress={() => patch({ kpssScores: (draft.kpssScores ?? []).filter((score) => score !== item) })}>
              <Text className="mb-2 text-sm font-semibold text-brand-700 dark:text-brand-100">{item.type}: {item.score} · kaldırmak için dokun</Text>
            </Pressable>
          ))}
          <Choice options={types} value={extraType} onChange={setExtraType} />
          <Field label="Ek KPSS puanı" kind="score" value={extraScore} onChangeText={setExtraScore} placeholder="75,2500" />
          <Pressable
            onPress={() => {
              const score = parseScore(extraScore);
              if (score == null || score < 0 || score > 100) return setError('Ek KPSS puanını 0 ile 100 arasında gir.');
              patch({ kpssScores: [...(draft.kpssScores ?? []).filter((item) => item.type !== extraType), { type: extraType, score: extraScore }] });
              setExtraScore('');
              setError(null);
            }}
          >
            <Text className="mb-3 text-sm font-semibold text-brand-700 dark:text-brand-100">Ek puanı kaydet</Text>
          </Pressable>
        </>
      ) : null}
      <Field label="YDS (isteğe bağlı)" kind="score" value={draft.ydsScore} onChangeText={(ydsScore) => patch({ ydsScore })} hint="Boş bırakılabilir. Girilirse 0 ile 100." error={ydsError} />
      <Field label="ALES (isteğe bağlı)" kind="score" value={draft.alesScore} onChangeText={(alesScore) => patch({ alesScore })} hint="Boş bırakılabilir. Girilirse 0 ile 100." error={alesError} />
      <ErrorText text={error} />
    </StepFrame>
  );
}
