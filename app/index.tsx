import { Redirect } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { useProfileStore } from '@/store/useProfileStore';

export default function Gate() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const completed = useProfileStore((state) => state.draft.onboardingCompleted);

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <Image source={require('../assets/images/splash.png')} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }
  if (!completed) return <Redirect href="/(onboarding)/step1-personal" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#143F4C' },
});
