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

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <SplashGate>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F4F7F8' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="paywall"
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="position/[id]" />
          </Stack>
        </SplashGate>
      </AppProviders>
    </QueryClientProvider>
  );
}
