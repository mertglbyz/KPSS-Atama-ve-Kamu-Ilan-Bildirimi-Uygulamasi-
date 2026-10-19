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
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold tracking-[2px] text-brand-700">ADIM {step} / 5</Text>
        <View className="flex-row gap-1.5">
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} className={`h-1.5 w-6 rounded-full ${item <= step ? 'bg-brand-700' : 'bg-line'}`} />
          ))}
        </View>
      </View>
      <Text className="mt-4 text-3xl font-bold text-ink dark:text-white">{title}</Text>
      <Text className="mb-5 mt-2 text-sm leading-6 text-muted">{subtitle}</Text>
      {children}
      <View className="mt-5 gap-2">
        <Button label={nextLabel} onPress={onNext} />
        {step > 1 ? <Button label="Geri" variant="ghost" onPress={() => router.back()} /> : null}
      </View>
    </Screen>
  );
}
