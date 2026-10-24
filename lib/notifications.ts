import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  // Android 13+ izin penceresi, bildirim kanalı oluşturulmadan gösterilmez.
  await Notifications.setNotificationChannelAsync('default', {
    name: 'İlan bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#1A4A57',
  }).catch(() => null);
}

export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  if (supabase) {
    await supabase.from('profiles').update({ expo_push_token: token, updated_at: new Date().toISOString() }).eq('id', userId);
  }
  return token;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  return permission.granted;
}
