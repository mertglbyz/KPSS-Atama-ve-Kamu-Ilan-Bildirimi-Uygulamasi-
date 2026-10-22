import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { listQuery } from '@/lib/input';

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seç',
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.toLocaleLowerCase('tr-TR');
    return options.filter((option) => option.toLocaleLowerCase('tr-TR').includes(needle));
  }, [options, query]);

  return (
    <View className="mb-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-ink dark:text-slate-200">{label}</Text>
        <Text className="text-xs text-muted dark:text-slate-300">{options.length} kayıt</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="rounded-2xl border border-line bg-white px-4 py-3.5 dark:border-slate-700 dark:bg-slate-900">
        <Text className={value ? 'text-base text-ink dark:text-white' : 'text-base text-slate-400'}>{value || placeholder}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-canvas px-5 dark:bg-slate-950" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="mb-3 flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={() => setOpen(false)}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-line bg-white dark:border-slate-700 dark:bg-slate-900"
          >
            <ChevronLeft color={colorScheme === 'dark' ? '#F4F7F8' : '#102A32'} size={20} strokeWidth={2.4} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-semibold tracking-[2px] text-brand-700 dark:text-brand-100">LİSTE</Text>
            <Text className="text-2xl font-bold text-ink dark:text-white">{label}</Text>
          </View>
        </View>
        <Text className="mb-3 text-sm text-muted dark:text-slate-300">{filtered.length} sonuç</Text>
        <TextInput
          value={query}
          onChangeText={(next) => setQuery(listQuery(next))}
          autoCorrect={false}
          autoCapitalize="words"
          allowFontScaling={false}
          maxFontSizeMultiplier={1}
          maxLength={60}
          placeholder={`${label} ara`}
          placeholderTextColor="#A39888"
          className="mb-3 rounded-2xl border border-line bg-white px-4 text-base text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          style={{ height: 52, fontSize: 16, paddingVertical: 0 }}
        />
          <FlatList
            style={{ flex: 1 }}
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`mb-2 rounded-2xl px-4 py-3 ${selected ? 'bg-brand-700' : 'bg-white dark:bg-slate-900'}`}
                >
                  <Text className={`text-base ${selected ? 'font-semibold text-white' : 'text-ink dark:text-slate-100'}`}>{item}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
