import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Bulunamadı', headerShown: true }} />
      <View className="flex-1 items-center justify-center bg-canvas px-6 dark:bg-night">
        <Text className="mb-3 text-xl font-bold text-ink dark:text-white">Bu ekran yok</Text>
        <Link href="/" className="text-brand-700">
          Ana sayfaya dön
        </Link>
      </View>
    </>
  );
}
