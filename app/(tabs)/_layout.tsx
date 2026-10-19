import { Tabs } from 'expo-router';
import { Bell, Briefcase, House, Settings, UserRound } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
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
