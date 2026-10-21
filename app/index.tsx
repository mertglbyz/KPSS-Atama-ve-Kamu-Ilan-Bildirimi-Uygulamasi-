import { Redirect } from 'expo-router';
import { useProfileStore } from '@/store/useProfileStore';

export default function Gate() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);

  if (!hydrated) return null;
  if (!completed) return <Redirect href="/(onboarding)/step1-personal" />;
  return <Redirect href="/(tabs)" />;
}
