import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen } from '@/components/ui';

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
  const router = useRouter();
  return (
    <Screen>
      <Text className="mt-2 text-sm font-semibold text-brand-700">Adım {step}/5</Text>
      <View className="my-3 h-2 overflow-hidden rounded-full bg-brand-50">
        <View className="h-2 rounded-full bg-brand-700" style={{ width: `${(step / 5) * 100}%` }} />
      </View>
      <Text className="text-2xl font-bold text-ink dark:text-white">{title}</Text>
      <Text className="mb-5 mt-1 text-sm leading-5 text-muted">{subtitle}</Text>
      {children}
      <View className="mt-4 gap-3">
        <Button label={nextLabel} onPress={onNext} />
        {step > 1 ? <Button label="Geri" variant="ghost" onPress={() => router.back()} /> : null}
      </View>
    </Screen>
  );
}
