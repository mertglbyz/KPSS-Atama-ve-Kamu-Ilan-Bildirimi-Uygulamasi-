import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ReactNode, useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const SPLASH = require('../assets/images/splash-icon.png');

export function SplashGate({ children }: { children: ReactNode }) {
  const hydrated = useProfileStore((state) => state.hydrated);
  const ready = useAppStore((state) => state.ready);
  const [minElapsed, setMinElapsed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const hydrateLimit = setTimeout(() => {
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
    }, 800);
    const minTimer = setTimeout(() => setMinElapsed(true), 700);
    const maxTimer = setTimeout(() => setGaveUp(true), 3500);
    return () => {
      clearTimeout(hydrateLimit);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  const open = hydrated && minElapsed && (ready || gaveUp);

  useEffect(() => {
    if (!open) return;
    SplashScreen.hideAsync?.().catch(() => {});
  }, [open]);

  if (!open) {
    return (
      <View
        accessibilityLabel="Açılış ekranı"
        onLayout={() => {
          SplashScreen.hideAsync?.().catch(() => {});
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#143F4C' }}
      >
        <StatusBar style="light" />
        <Image source={SPLASH} resizeMode="contain" style={{ width: 200, height: 200 }} />
      </View>
    );
  }

  return children;
}
