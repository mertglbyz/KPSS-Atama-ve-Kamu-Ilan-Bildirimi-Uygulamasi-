import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useProfileStore } from '@/store/useProfileStore';

export default function Gate() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);

  if (!hydrated) return <View className="flex-1 bg-canvas dark:bg-slate-950" />;
  if (!completed) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(tabs)" />;
}
