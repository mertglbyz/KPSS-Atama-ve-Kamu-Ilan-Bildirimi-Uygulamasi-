import * as SplashScreen from 'expo-splash-screen';

try {
  void SplashScreen.preventAutoHideAsync().catch(() => {});
} catch {
  // Native açılış bu kabukta yoksa JavaScript ekranı kullanılır.
}

let hidden = false;

export function hideNativeSplash() {
  if (hidden) return;
  hidden = true;
  try {
    SplashScreen.hide();
  } catch {
    hidden = false;
  }
}
