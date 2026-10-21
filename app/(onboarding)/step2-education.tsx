import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SelectField } from '@/components/SelectField';
import { StepFrame } from '@/components/StepFrame';
import { Button, ErrorText } from '@/components/ui';
import { DEPARTMENTS } from '@/constants/catalog';
import type { EducationLevel } from '@/types/domain';
import { advance } from '@/lib/flow';
import { useProfileStore } from '@/store/useProfileStore';

const LEVELS: { id: EducationLevel; title: string; caption: string }[] = [
  { id: 'Ortaöğretim', title: 'Ortaöğretim', caption: 'P94 · lise ve meslek lisesi' },
  { id: 'Önlisans', title: 'Önlisans', caption: 'P93 · meslek yüksekokulu' },
  { id: 'Lisans', title: 'Lisans', caption: 'P1, P2, P3 ve A grubu alan puanı' },
];

export default function StepEducation() {
  const router = useRouter();
  const editing = Boolean(useLocalSearchParams<{ edit?: string }>().edit);
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
    void advance(router, '/(onboarding)/step3-exams', editing);
  }

  return (
    <StepFrame step={2} title="Eğitim" subtitle="Ortaöğretim, önlisans ve lisans bölümlerinin tamamı listede. İkinci mezuniyetini de ekleyebilirsin." onNext={next}>
      {educations.map((education, index) => {
        const level = (education.level as string) === 'Lise' ? 'Ortaöğretim' : education.level;
        return (
          <View key={`${level}-${index}`} className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-ink dark:text-white">Eğitim {index + 1}</Text>
            <View className="mb-3 gap-2">
              {LEVELS.map((item) => {
                const active = level === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => setEducation(index, { level: item.id, department: '' })}
                    className={`rounded-2xl border px-4 py-3 ${active ? 'border-brand-700 bg-brand-700' : 'border-line bg-white dark:bg-slate-900'}`}
                  >
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-ink dark:text-white'}`}>{item.title}</Text>
                    <Text className={`mt-0.5 text-xs ${active ? 'text-white/80' : 'text-muted dark:text-slate-300'}`}>{item.caption}</Text>
                  </Pressable>
                );
              })}
            </View>
            <SelectField
              label="Bölüm"
              value={education.department}
              options={DEPARTMENTS[level]}
              placeholder="Bölümünü ara"
              onChange={(department) => setEducation(index, { level, department })}
            />
            {educations.length > 1 ? <Button label="Bu eğitimi sil" variant="ghost" onPress={() => removeEducation(index)} /> : null}
          </View>
        );
      })}
      <Button label="Başka eğitim ekle" variant="secondary" onPress={addEducation} />
      <ErrorText text={error} />
    </StepFrame>
  );
}
