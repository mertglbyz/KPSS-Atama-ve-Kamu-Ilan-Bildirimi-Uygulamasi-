import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SelectField } from '@/components/SelectField';
import { StepFrame } from '@/components/StepFrame';
import { Button, Choice, ErrorText } from '@/components/ui';
import { DEPARTMENTS } from '@/constants/catalog';
import type { EducationLevel } from '@/types/domain';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepEducation() {
  const router = useRouter();
  const educations = useProfileStore((state) => state.draft.educations);
  const setEducation = useProfileStore((state) => state.setEducation);
  const addEducation = useProfileStore((state) => state.addEducation);
  const removeEducation = useProfileStore((state) => state.removeEducation);
  const [error, setError] = useState<string | null>(null);

  function next() {
    if (educations.some((item) => !item.department)) {
      setError('Her eğitim satırında bölüm seç.');
      return;
    }
    router.push('/(onboarding)/step3-exams');
  }

  return (
    <StepFrame step={2} title="Eğitim bilgileri" subtitle="İkinci bir mezuniyetin varsa ekle. Eşleşme tüm bölümlerini dikkate alır." onNext={next}>
      {educations.map((education, index) => (
        <View key={`${education.level}-${index}`} className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-ink dark:text-white">Eğitim {index + 1}</Text>
          <Choice
            options={['Lise', 'Önlisans', 'Lisans']}
            value={education.level}
            onChange={(level) => setEducation(index, { level: level as EducationLevel, department: '' })}
          />
          <SelectField
            label="Bölüm"
            value={education.department}
            options={DEPARTMENTS[education.level]}
            onChange={(department) => setEducation(index, { ...education, department })}
          />
          {educations.length > 1 ? <Button label="Bu eğitimi sil" variant="ghost" onPress={() => removeEducation(index)} /> : null}
        </View>
      ))}
      <Button label="+ Başka eğitim ekle" variant="secondary" onPress={addEducation} />
      <ErrorText text={error} />
    </StepFrame>
  );
}
