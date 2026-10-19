import { ReactNode, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { isSupabaseConfigured } from '@/lib/env';
import { loadProfile } from '@/lib/data';
import { syncPremium } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

async function hydrate(userId: string, email: string | null) {
  const profile = await loadProfile(userId);
  if (profile) useProfileStore.getState().replaceDraft(profile.draft);
  let premium = profile?.isPremium ?? false;
  let plan = profile?.plan ?? 'free';
  try {
    if (await syncPremium(userId)) {
      premium = true;
      if (plan === 'free') plan = 'yearly';
    }
  } catch {
    // Mağaza anahtarı yoksa veritabanındaki abonelik bayrağı kullanılır.
  }
  useAppStore.getState().setReady({ mode: 'live', userId, email, isPremium: premium, plan });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
    }, 1000);
    setColorScheme(useAppStore.getState().colorScheme);

    let unsubscribe = () => {};
    async function boot() {
      if (!isSupabaseConfigured || !supabase) {
        const state = useAppStore.getState();
        state.setReady({
          mode: 'demo',
          userId: state.demoUserId,
          email: state.demoEmail,
          isPremium: state.demoPremium,
          plan: state.demoPremium ? 'yearly' : 'free',
        });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) await hydrate(data.session.user.id, data.session.user.email ?? null);
      else useAppStore.getState().setReady({ mode: 'live', userId: null, email: null, isPremium: false });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          useAppStore.getState().setReady({ mode: 'live', userId: null, email: null, isPremium: false });
          return;
        }
        void hydrate(session.user.id, session.user.email ?? null);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    }
    void boot();
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [setColorScheme]);

  return children;
}
