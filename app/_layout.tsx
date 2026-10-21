import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AppProviders } from '@/providers/AppProviders';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const ready = useAppStore((state) => state.ready);
  const hydrated = useProfileStore((state) => state.hydrated);

  useEffect(() => {
    if (loaded && ready && hydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, ready, hydrated]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <ThemedStack />
      </AppProviders>
    </QueryClientProvider>
  );
}

function ThemedStack() {
  const dark = useAppStore((state) => state.colorScheme) === 'dark';
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
