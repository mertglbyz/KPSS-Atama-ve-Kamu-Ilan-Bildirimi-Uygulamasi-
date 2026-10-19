import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useProfileStore } from '@/store/useProfileStore';
import { useAppStore } from '@/store/useAppStore';

export default function Gate() {
  const ready = useAppStore((state) => state.ready);
  const hydrated = useProfileStore((state) => state.hydrated);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);

  if (!ready || !hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-xs font-semibold tracking-[3px] text-brand-700">KPSS ATAMA</Text>
        <Text className="mt-3 text-lg text-ink">Profilin hazırlanıyor</Text>
      </View>
    );
  }
  if (!completed) return <Redirect href="/(onboarding)/step1-personal" />;
  return <Redirect href="/(tabs)" />;
}
