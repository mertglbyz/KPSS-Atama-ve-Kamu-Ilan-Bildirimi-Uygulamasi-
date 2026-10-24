import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ bottom: Math.max(insets.bottom, 12) }}
      className="absolute left-4 right-4 h-16 flex-row items-center justify-around rounded-3xl border border-[#E1E7EA] bg-white/95 px-1.5 shadow-lg"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const color = isFocused ? '#1A4A57' : '#5E6E76';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            className={`flex-1 items-center justify-center rounded-2xl py-1.5 ${
              isFocused ? 'bg-[#E7F1F2]' : ''
            }`}
          >
            {options.tabBarIcon
              ? options.tabBarIcon({ focused: isFocused, color, size: 20 })
              : null}
            <Text
              numberOfLines={1}
              className={`mt-1 text-[10px] ${
                isFocused
                  ? 'font-extrabold text-[#1A4A57]'
                  : 'font-medium text-[#5E6E76]'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
