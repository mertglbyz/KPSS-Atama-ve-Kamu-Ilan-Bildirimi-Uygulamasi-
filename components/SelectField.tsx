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
      <Text className="mb-1 text-sm font-medium text-ink dark:text-slate-200">{label}</Text>
      <Pressable onPress={() => setOpen(true)} className="rounded-2xl border border-line bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <Text className={value ? 'text-ink dark:text-white' : 'text-slate-400'}>{value || placeholder}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-canvas px-5 pt-14 dark:bg-slate-950">
          <Text className="mb-3 text-xl font-bold text-ink dark:text-white">{label}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ara"
            placeholderTextColor="#94A3B8"
            className="mb-3 rounded-2xl border border-line bg-white px-4 py-3 text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                  setQuery('');
                }}
                className="border-b border-line py-3 dark:border-slate-800"
              >
                <Text className="text-base text-ink dark:text-slate-100">{item}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setOpen(false)} className="my-4 items-center py-3">
            <Text className="font-semibold text-brand-700">Kapat</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
