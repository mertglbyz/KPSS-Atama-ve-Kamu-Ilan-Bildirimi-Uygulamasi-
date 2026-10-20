import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { Screen, Title } from '@/components/ui';
import { fetchNotifications, markNotificationRead } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export default function NotificationsScreen() {
  const userId = useAppStore((state) => state.userId);
  const client = useQueryClient();
  const notifications = useQuery({ queryKey: ['notifications', userId], enabled: Boolean(userId), queryFn: () => fetchNotifications(userId!) });

  return (
    <Screen>
      <Title subtitle="Yeni ilan, son 48 saat ve sonuç bildirimleri burada durur.">Bildirimler</Title>
      {(notifications.data ?? []).map((item) => (
        <Pressable
          key={item.id}
          onPress={async () => {
            await markNotificationRead(item.id);
            await client.invalidateQueries({ queryKey: ['notifications', userId] });
          }}
          className="mb-3 rounded-3xl border border-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-ink dark:text-white">{item.title}</Text>
            {item.readAt ? null : <View className="h-2 w-2 rounded-full bg-brand-700" />}
          </View>
          <Text className="mt-1 text-sm leading-5 text-muted dark:text-slate-300">{item.body}</Text>
          <Text className="mt-2 text-xs text-slate-400">{formatDate(item.createdAt)}</Text>
        </Pressable>
      ))}
      {!notifications.data?.length ? <Text className="text-muted dark:text-slate-300">Henüz bildirim yok.</Text> : null}
    </Screen>
  );
}
