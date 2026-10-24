import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { BackButton, Button, Screen, Title } from '@/components/ui';

const STEP_LABELS: Record<number, string> = {
  1: 'Kişisel Bilgiler',
  2: 'Eğitim & Bölüm',
  3: 'Sınav Puanları',
  4: 'Ehliyet & Özel Şartlar',
  5: 'Deneyim & Sertifikalar',
};

export function StepFrame({
  step,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Devam et',
}: {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
}) {
  const totalSteps = 5;

  return (
    <Screen footer={<Button label={nextLabel} onPress={onNext} />}>
      <View className="mb-3 flex-row items-center justify-between">
        <BackButton fallback="/(onboarding)/welcome" />
        <View className="items-end">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-[#1A4A57]">
            Adım {step} / {totalSteps}
          </Text>
          <Text className="text-xs font-medium text-[#5E6E76]">
            {STEP_LABELS[step] ?? ''}
          </Text>
        </View>
      </View>

      <View className="mb-5 flex-row gap-1.5">
        {Array.from({ length: totalSteps }, (_, idx) => {
          const current = idx + 1;
          const completed = current <= step;
          return (
            <View
              key={current}
              className={`h-1.5 flex-1 rounded-full ${
                completed ? 'bg-[#1A4A57]' : 'bg-[#E1E7EA]'
              }`}
            />
          );
        })}
      </View>

      <Title subtitle={subtitle}>{title}</Title>
      <View className="flex-1">{children}</View>
    </Screen>
  );
}
