import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AppProviders } from '@/providers/AppProviders';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.setOptions({ duration: 350, fade: true });
SplashScreen.preventAutoHideAsync().catch(() => undefined);
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => undefined);
}, 1200);

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <ThemedStack />
      </AppProviders>
    </QueryClientProvider>
  );
}

function ThemedStack() {
  const router = useRouter();
  const segments = useSegments();
  const ready = useAppStore((state) => state.ready);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);
  const dark = useAppStore((state) => state.colorScheme) === 'dark';

  useEffect(() => {
    if (ready && completed && segments[0] === '(onboarding)' && segments[1] === 'step1-personal') router.replace('/(tabs)');
  }, [ready, completed, segments, router]);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: dark ? '#102027' : '#F4F7F8' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="position/[id]" />
    </Stack>
  );
}
