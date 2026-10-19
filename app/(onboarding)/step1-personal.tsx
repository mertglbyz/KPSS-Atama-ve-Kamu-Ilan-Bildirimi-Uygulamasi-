import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SelectField } from '@/components/SelectField';
import { StepFrame } from '@/components/StepFrame';
import { Choice, ErrorText, Field } from '@/components/ui';
import { CITIES } from '@/constants/catalog';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepPersonal() {
  const router = useRouter();
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const [error, setError] = useState<string | null>(null);
  const age = Number(draft.age);
  const height = Number(draft.height);
  const weight = Number(draft.weight);

  function next() {
    if (draft.nickname.trim().length < 2) return setError('Takma ad en az 2 karakter olsun.');
    if (!age || age < 17 || age > 70) return setError('Yaşı 17 ile 70 arasında gir.');
    if (draft.height && (height < 140 || height > 220)) return setError('Boyu santimetre olarak gir.');
    if (draft.weight && (weight < 35 || weight > 220)) return setError('Kilo değerini kontrol et.');
    if (!draft.gender) return setError('Cinsiyet seç.');
    if (!draft.city) return setError('İl seç.');
    setError(null);
    router.push('/(onboarding)/step2-education');
  }

  return (
    <StepFrame step={1} title="Kişisel bilgiler" subtitle="Yaş, boy ve il; zabıta, güvenlik ve yerel işçi ilanlarında kullanılıyor." onNext={next}>
      <Field label="Takma ad" value={draft.nickname} onChangeText={(nickname) => patch({ nickname })} placeholder="mertglbyz" />
      <Field label="Yaş" value={draft.age} onChangeText={(ageValue) => patch({ age: ageValue })} keyboardType="number-pad" />
      <Field label="Boy (cm)" value={draft.height} onChangeText={(heightValue) => patch({ height: heightValue })} keyboardType="number-pad" />
      <Field label="Kilo (kg, isteğe bağlı)" value={draft.weight} onChangeText={(weightValue) => patch({ weight: weightValue })} keyboardType="number-pad" />
      <Choice options={['Erkek', 'Kadın']} value={draft.gender} onChange={(gender) => patch({ gender: gender as 'Erkek' | 'Kadın' })} />
      <SelectField label="İl" value={draft.city} options={CITIES} onChange={(city) => patch({ city })} />
      <ErrorText text={error} />
    </StepFrame>
  );
}
