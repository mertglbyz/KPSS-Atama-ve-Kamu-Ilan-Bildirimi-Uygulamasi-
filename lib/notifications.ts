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

export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
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
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  return permission.granted;
}
