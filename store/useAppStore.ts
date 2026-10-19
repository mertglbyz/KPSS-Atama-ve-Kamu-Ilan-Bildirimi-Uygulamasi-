import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SubscriptionPlan } from '@/types/domain';

type AppState = {
  ready: boolean;
  mode: 'demo' | 'live';
  userId: string | null;
  email: string | null;
  isPremium: boolean;
  plan: SubscriptionPlan;
  colorScheme: 'light' | 'dark';
  demoUserId: string | null;
  demoEmail: string | null;
  demoPremium: boolean;
  setReady: (session: { mode: 'demo' | 'live'; userId: string | null; email: string | null; isPremium: boolean; plan?: SubscriptionPlan }) => void;
  setPremium: (isPremium: boolean, plan?: SubscriptionPlan) => void;
  setColorScheme: (colorScheme: 'light' | 'dark') => void;
  setDemoSession: (userId: string, email: string) => void;
  setDemoPremium: (value: boolean) => void;
  clearDemoSession: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ready: false,
      mode: 'demo',
      userId: null,
      email: null,
      isPremium: false,
      plan: 'free',
      colorScheme: 'light',
      demoUserId: null,
      demoEmail: null,
      demoPremium: false,
      setReady: (session) =>
        set({
          ready: true,
          mode: session.mode,
          userId: session.userId,
          email: session.email,
          isPremium: session.isPremium,
          plan: session.plan ?? (session.isPremium ? 'yearly' : 'free'),
        }),
      setPremium: (isPremium, plan = isPremium ? 'yearly' : 'free') => set({ isPremium, plan }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setDemoSession: (demoUserId, demoEmail) => set({ demoUserId, demoEmail, userId: demoUserId, email: demoEmail, mode: 'demo' }),
      setDemoPremium: (demoPremium) => set({ demoPremium, isPremium: demoPremium, plan: demoPremium ? 'yearly' : 'free' }),
      clearDemoSession: () => set({ demoUserId: null, demoEmail: null, demoPremium: false, userId: null, email: null, isPremium: false, plan: 'free' }),
    }),
    {
      name: 'kpss-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        demoUserId: state.demoUserId,
        demoEmail: state.demoEmail,
        demoPremium: state.demoPremium,
      }),
    },
  ),
);
