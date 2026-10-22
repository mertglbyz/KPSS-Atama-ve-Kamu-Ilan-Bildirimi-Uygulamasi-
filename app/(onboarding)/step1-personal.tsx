import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { SelectField } from '@/components/SelectField';
import { StepFrame } from '@/components/StepFrame';
import { Choice, ErrorText, Field } from '@/components/ui';
import { CITIES } from '@/constants/catalog';
import { advance } from '@/lib/flow';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepPersonal() {
  const router = useRouter();
  const editing = Boolean(useLocalSearchParams<{ edit?: string }>().edit);
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const age = Number(draft.age);
  const height = Number(draft.height);
  const weight = Number(draft.weight);
  const nameError = draft.nickname.trim().length < 2 ? 'Ad en az 2 karakter olmalı.' : null;
  const ageError = !draft.age ? 'Yaş gir. Aralık 17 ile 70.' : age < 17 || age > 70 ? 'Yaş 17 ile 70 arasında olmalı.' : null;
  const heightError = !draft.height ? 'Boy gir. Aralık 140 ile 220 cm.' : height < 140 || height > 220 ? 'Boy 140 ile 220 cm arasında olmalı.' : null;
  const weightError = draft.weight && (weight < 35 || weight > 220) ? 'Kilo 35 ile 220 kg arasında olmalı.' : null;
  const genderError = !draft.gender ? 'Cinsiyet seç.' : null;
  const cityError = !draft.city ? 'İl seç.' : null;

  function next() {
    setChecked(true);
    const message = nameError || ageError || heightError || weightError || genderError || cityError;
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    void advance(router, '/(onboarding)/step2-education', editing);
  }

  return (
    <StepFrame step={1} title="Kişisel bilgiler" subtitle="Yaş, boy ve il; zabıta, güvenlik ve yerel işçi ilanlarında kullanılıyor." onNext={next}>
      <Field label="Ad" value={draft.nickname} onChangeText={(nickname) => patch({ nickname })} hint="En az 2 karakter." error={draft.nickname || checked ? nameError : null} />
      <Field label="Yaş" kind="integer" maxDigits={2} maxValue={70} value={draft.age} onChangeText={(ageValue) => patch({ age: ageValue })} hint="17 ile 70 arasında." error={draft.age || checked ? ageError : null} />
      <Field label="Boy (cm)" kind="integer" maxDigits={3} maxValue={220} value={draft.height} onChangeText={(heightValue) => patch({ height: heightValue })} hint="140 ile 220 cm arasında." error={draft.height || checked ? heightError : null} />
      <Field label="Kilo (kg, isteğe bağlı)" kind="integer" maxDigits={3} maxValue={220} value={draft.weight} onChangeText={(weightValue) => patch({ weight: weightValue })} hint="Boş bırakılabilir. Girilirse 35 ile 220 kg." error={weightError} />
      <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">Cinsiyet</Text>
      <Choice options={['Erkek', 'Kadın']} value={draft.gender} onChange={(gender) => patch({ gender: gender as 'Erkek' | 'Kadın' })} />
      {checked && genderError ? <ErrorText text={genderError} /> : null}
      <SelectField label="İl" value={draft.city} options={CITIES} onChange={(city) => patch({ city })} />
      {checked && cityError ? <ErrorText text={cityError} /> : null}
      <ErrorText text={error} />
    </StepFrame>
  );
}
