import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

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
        <Text className="text-xs text-muted">{options.length} kayıt</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="rounded-2xl border border-line bg-white px-4 py-3.5 dark:border-slate-700 dark:bg-slate-900">
        <Text className={value ? 'text-base text-ink dark:text-white' : 'text-base text-slate-400'}>{value || placeholder}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-canvas px-5 pt-14 dark:bg-slate-950">
          <Text className="text-xs font-semibold tracking-[2px] text-brand-700">LİSTE</Text>
          <Text className="mb-1 text-2xl font-bold text-ink dark:text-white">{label}</Text>
          <Text className="mb-3 text-sm text-muted">{filtered.length} sonuç</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Bölüm veya alan ara"
            placeholderTextColor="#A39888"
            className="mb-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
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
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} className="my-3 items-center py-3">
            <Text className="font-semibold text-brand-700">Kapat</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
