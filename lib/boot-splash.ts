import * as SplashScreen from 'expo-splash-screen';

try {
  void SplashScreen.preventAutoHideAsync?.().catch(() => {});
  SplashScreen.setOptions?.({ duration: 450, fade: true });
} catch {
  // Web ve eski kabuklarda splash denetimi yok sayılır.
}
