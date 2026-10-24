import { Appearance } from 'react-native';

// Uygulama genelinde tekil kurumsal açık tema kullanılır.
try {
  Appearance.setColorScheme?.('light');
} catch {
  // Web veya desteklenmeyen platformlarda sessizce geç
}

export function useSystemTheme() {
  return 'light' as const;
}
