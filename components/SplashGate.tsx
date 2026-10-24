import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { hideNativeSplash } from '@/lib/boot-splash';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const SPLASH = require('../assets/images/splash.png');

export function SplashGate({ children }: { children: ReactNode }) {
  const liveInsets = useSafeAreaInsets();
  const top = liveInsets.top || initialWindowMetrics?.insets.top || 0;
  const bottom = liveInsets.bottom || initialWindowMetrics?.insets.bottom || 0;
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
        <View style={{ flex: 1, width: '100%', paddingTop: top, paddingBottom: bottom }}>
          <Image source={SPLASH} resizeMode="contain" style={styles.art} onLoad={hideNativeSplash} />
        </View>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#032F3A',
  },
  art: {
    width: '100%',
    height: '100%',
  },
});
