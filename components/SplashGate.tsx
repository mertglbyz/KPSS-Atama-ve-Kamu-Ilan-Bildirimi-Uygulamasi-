import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { hideNativeSplash } from '@/lib/boot-splash';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const SPLASH = require('../assets/images/splash.png');
// splash.png: 1170x2532 (19,5:9). Logo ortada, imza yazısı görselin ~%82 yüksekliğinde.
const ART_WIDTH = 1170;
const ART_HEIGHT = 2532;
const CREDIT_CENTER_Y = 0.8195;
const CREDIT_LINE_HEIGHT = 20;

// Açılış süresi: en az 2,8 sn görünür; veri hazır olmasa bile en geç 3,5 sn'de uygulama açılır.
const MIN_VISIBLE_MS = 2800;
const MAX_WAIT_MS = 3500;
// Geliştirici imzası ilk 0,8 sn görünmez, sonra yumuşakça belirir.
const CREDIT_DELAY_MS = 800;
const CREDIT_FADE_MS = 700;

export function SplashGate({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  // "Contain": görselin tamamı görünür, hiçbir kısmı kesilmez; artan alan aynı zemin rengiyle dolar.
  const scale = Math.min(width / ART_WIDTH, height / ART_HEIGHT);
  const artWidth = ART_WIDTH * scale;
  const artHeight = ART_HEIGHT * scale;
  const artLeft = (width - artWidth) / 2;
  const artTop = (height - artHeight) / 2;
  const hydrated = useProfileStore((state) => state.hydrated);
  const ready = useAppStore((state) => state.ready);
  const [minElapsed, setMinElapsed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [creditOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const hydrateLimit = setTimeout(() => {
      if (!useProfileStore.getState().hydrated) useProfileStore.getState().setHydrated(true);
    }, 800);
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const maxTimer = setTimeout(() => setGaveUp(true), MAX_WAIT_MS);
    const revealTimer = setTimeout(hideNativeSplash, 500);
    const creditTimer = setTimeout(() => {
      Animated.timing(creditOpacity, {
        toValue: 1,
        duration: CREDIT_FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, CREDIT_DELAY_MS);
    return () => {
      clearTimeout(hydrateLimit);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      clearTimeout(revealTimer);
      clearTimeout(creditTimer);
    };
  }, [creditOpacity]);

  const open = hydrated && minElapsed && (ready || gaveUp);

  useEffect(() => {
    if (open) hideNativeSplash();
  }, [open]);

  if (!open) {
    return (
      <View accessibilityLabel="Açılış ekranı" style={styles.screen}>
        <StatusBar style="light" />
        <Image
          source={SPLASH}
          resizeMode="stretch"
          style={{ position: 'absolute', left: artLeft, top: artTop, width: artWidth, height: artHeight }}
          onLoad={hideNativeSplash}
        />
        <Animated.Text
          style={[styles.credit, { opacity: creditOpacity, top: artTop + artHeight * CREDIT_CENTER_Y - CREDIT_LINE_HEIGHT / 2 }]}
        >
          Geliştirici: Mert Gülbeyaz
        </Animated.Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#02303A',
  },
  credit: {
    position: 'absolute',
    lineHeight: CREDIT_LINE_HEIGHT,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9DB7BC',
    fontSize: 14,
    fontStyle: 'italic',
    letterSpacing: 1.6,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
});
