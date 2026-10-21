import * as Updates from 'expo-updates';

// İndirilen güncelleme bir sonraki soğuk açılışta devreye girer; kullanıcı oturumu yarıda kesilmez.
export async function fetchPendingUpdate() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) await Updates.fetchUpdateAsync();
  } catch {
    // Ağ yoksa uygulama gömülü sürümle devam eder.
  }
}
