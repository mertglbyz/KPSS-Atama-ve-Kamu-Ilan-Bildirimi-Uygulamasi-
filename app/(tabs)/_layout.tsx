import { Tabs } from 'expo-router';
import { Bell, Briefcase, House, Settings, UserRound } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';

export default function TabLayout() {
  const dark = useAppStore((state) => state.colorScheme) === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? '#D3E4E6' : '#1A4A57',
        tabBarInactiveTintColor: dark ? '#6E8088' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: dark ? '#102027' : '#F4F7F8',
          borderTopColor: dark ? '#1E333C' : '#E1E7EA',
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana sayfa', tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="jobs" options={{ title: 'İlanlar', tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Bildirim', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Ayarlar', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}
