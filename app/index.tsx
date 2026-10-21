import { Redirect } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function Gate() {
  const ready = useAppStore((state) => state.ready);
  const hydrated = useProfileStore((state) => state.hydrated);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);

  if (!ready || !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#143F4C', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={require('../assets/images/splash.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <Text style={{ position: 'absolute', bottom: 48, color: '#D3E4E6', letterSpacing: 1, fontSize: 13 }}>Bağlanıyor</Text>
      </View>
    );
  }
  if (!completed) return <Redirect href="/(onboarding)/step1-personal" />;
  return <Redirect href="/(tabs)" />;
}
