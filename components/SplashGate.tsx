import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { hideNativeSplash } from '@/lib/boot-splash';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const SPLASH = require('../assets/images/splash.png');

export function SplashGate({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const hydrated = useProfileStore((state) => state.hydrated);
  const ready = useAppStore((state) => state.ready);
  const [minElapsed, setMinElapsed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const hydrateLimit = setTimeout(() => {
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
    }, 800);
    const minTimer = setTimeout(() => setMinElapsed(true), 900);
    const maxTimer = setTimeout(() => setGaveUp(true), 3500);
    const revealTimer = setTimeout(hideNativeSplash, 500);
    return () => {
      clearTimeout(hydrateLimit);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  const open = hydrated && minElapsed && (ready || gaveUp);

  useEffect(() => {
    if (open) hideNativeSplash();
  }, [open]);

  if (!open) {
    return (
      <View accessibilityLabel="Açılış ekranı" style={styles.screen}>
        <StatusBar style="light" />
        <Image source={SPLASH} resizeMode="contain" style={{ width, height }} onLoad={hideNativeSplash} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#032F3A',
  },
});
