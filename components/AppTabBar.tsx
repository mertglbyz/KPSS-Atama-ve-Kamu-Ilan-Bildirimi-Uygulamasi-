import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function AppTabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  const dark = useAppStore((store) => store.colorScheme) === 'dark';
  const bottom = Math.max(insets.bottom, 10);
  const active = dark ? '#D3E4E6' : '#1A4A57';
  const inactive = dark ? '#6E8088' : '#9CA3AF';
  const background = dark ? '#102027' : '#F4F7F8';
  const border = dark ? '#1E333C' : '#E1E7EA';

  return (
    <View style={{ backgroundColor: background, borderTopColor: border, borderTopWidth: 1, paddingBottom: bottom, paddingTop: 4, paddingHorizontal: 16 }}>
      <View style={{ height: 54, flexDirection: 'row' }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const color = focused ? active : inactive;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 }}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} numberOfLines={1} style={{ color, fontSize: 11, fontWeight: '600', marginTop: 3 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
