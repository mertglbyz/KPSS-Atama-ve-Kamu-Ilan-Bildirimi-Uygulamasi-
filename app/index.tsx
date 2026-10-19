import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function Gate() {
  const ready = useAppStore((state) => state.ready);
  const userId = useAppStore((state) => state.userId);
  const hydrated = useProfileStore((state) => state.hydrated);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);

  if (!ready || !hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-base text-muted">KPSS Atama hazırlanıyor</Text>
      </View>
    );
  }
  if (!userId) return <Redirect href="/(auth)/login" />;
  if (!completed) return <Redirect href="/(onboarding)/step1-personal" />;
  return <Redirect href="/(tabs)" />;
}
