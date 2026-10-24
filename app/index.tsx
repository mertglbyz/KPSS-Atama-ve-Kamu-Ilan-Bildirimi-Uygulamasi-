import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useProfileStore } from '@/store/useProfileStore';

export default function Gate() {
  const hydrated = useProfileStore((state) => state.hydrated);

  if (!hydrated) return <View className="flex-1 bg-canvas dark:bg-slate-950" />;
  // Test boyunca kurulum her açılışta gösterilir.
  return <Redirect href="/(onboarding)/welcome" />;
}
