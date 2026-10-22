import '@/lib/appearance';
import '@/lib/lock-font-scale';
import '@/lib/boot-splash';
import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SplashGate } from '@/components/SplashGate';
import { AppProviders } from '@/providers/AppProviders';
import { useAppStore } from '@/store/useAppStore';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <SplashGate>
          <ThemedStack />
        </SplashGate>
      </AppProviders>
    </QueryClientProvider>
  );
}

function ThemedStack() {
  const dark = useAppStore((state) => state.colorScheme) === 'dark';

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: dark ? '#102027' : '#F4F7F8' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="position/[id]" />
      </Stack>
    </>
  );
}
