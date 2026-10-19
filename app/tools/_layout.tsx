import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#0B3A82',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F4F7FB' },
      }}
    />
  );
}
