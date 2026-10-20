import { ReactNode, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { isSupabaseConfigured } from '@/lib/env';
import { fromProfileRow, toProfileUpdate } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

function waitForProfileHydration() {
  if (useProfileStore.getState().hydrated) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const unsubscribe = useProfileStore.subscribe((state) => {
      if (!state.hydrated) return;
      unsubscribe();
      resolve();
    });
    setTimeout(() => {
      unsubscribe();
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
      resolve();
    }, 1500);
  });
}

function openDemo() {
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
}

export function AppProviders({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
    }, 1600);
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const applyScheme = (scheme: 'light' | 'dark') => {
      const timerId = setTimeout(() => {
        pending.delete(timerId);
        setColorScheme(scheme);
      }, 0);
      pending.add(timerId);
    };
    applyScheme(useAppStore.getState().colorScheme);
    const stopScheme = useAppStore.subscribe((state, previous) => {
      if (state.colorScheme !== previous.colorScheme) applyScheme(state.colorScheme);
    });
    let unsubscribe = () => {};

    async function boot() {
      await waitForProfileHydration();
      if (!isSupabaseConfigured || !supabase) {
        openDemo();
        return;
      }

      const existing = await supabase.auth.getSession();
      let session = existing.data.session;
      if (!session) {
        const created = await supabase.auth.signInAnonymously();
        if (created.error || !created.data.session) {
          openDemo();
          return;
        }
        session = created.data.session;
      }

      const userId = session.user.id;
      const { data: row } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      const local = useProfileStore.getState().draft;
      let isPremium = Boolean(row?.is_premium);
      let plan: 'free' | 'monthly' | 'quarterly' | 'yearly' =
        row?.subscription_plan === 'monthly' || row?.subscription_plan === 'quarterly' || row?.subscription_plan === 'yearly'
          ? row.subscription_plan
          : 'free';
      if (row?.onboarding_completed) {
        useProfileStore.getState().replaceDraft(fromProfileRow(row));
      } else if (local.onboardingCompleted) {
        await supabase.from('profiles').update(toProfileUpdate(local)).eq('id', userId);
      }
      useAppStore.getState().setReady({
        mode: 'live',
        userId,
        email: session.user.email ?? null,
        isPremium,
        plan,
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!next) return;
        useAppStore.getState().setReady({
          mode: 'live',
          userId: next.user.id,
          email: next.user.email ?? null,
          isPremium: useAppStore.getState().isPremium,
          plan: useAppStore.getState().plan,
        });
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    }

    void boot();
    return () => {
      clearTimeout(timer);
      pending.forEach((timerId) => clearTimeout(timerId));
      stopScheme();
      unsubscribe();
    };
  }, [setColorScheme]);

  return children;
}
