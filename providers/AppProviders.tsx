import { ReactNode, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export function AppProviders({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
    }, 1000);
    setColorScheme(useAppStore.getState().colorScheme);

    const state = useAppStore.getState();
    const userId = state.demoUserId ?? `cihaz-${Date.now().toString(36)}`;
    if (!state.demoUserId) state.setDemoSession(userId, '');
    state.setReady({
      mode: 'demo',
      userId,
      email: null,
      isPremium: state.demoPremium,
      plan: state.demoPremium ? 'yearly' : 'free',
    });

    return () => clearTimeout(timer);
  }, [setColorScheme]);

  return children;
}
