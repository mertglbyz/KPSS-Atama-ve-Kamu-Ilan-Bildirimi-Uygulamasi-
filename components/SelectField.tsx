import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const showSearch = options.length > 6;

  const filteredOptions = useMemo(() => {
    const clean = listQuery(query).trim().toLocaleLowerCase('tr-TR');
    if (!clean) return options;
    return options.filter((item) =>
      item.toLocaleLowerCase('tr-TR').includes(clean)
    );
  }, [options, query]);

  function handleSelect(item: string) {
    onChange(item);
    setOpen(false);
    setQuery('');
  }

  function handleClose() {
    setOpen(false);
    setQuery('');
  }

  return (
    <View className="mb-3.5">
      <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#102A32]/80">
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="h-12 flex-row items-center justify-between rounded-2xl border border-[#E1E7EA] bg-white px-3.5 active:opacity-80"
      >
        <Text
          numberOfLines={1}
          className={`flex-1 pr-2 text-sm font-medium ${
            value ? 'text-[#102A32]' : 'text-[#94A3B8]'
          }`}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color="#5E6E76" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/55"
        >
          <Pressable className="flex-1" onPress={handleClose} />

          <View className="max-h-[80%] rounded-t-3xl bg-[#F4F7F8] px-4 pb-8 pt-4">
            <View className="mb-3 self-center h-1.5 w-12 rounded-full bg-slate-300" />

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-[#102A32]">
                {label}
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-200/70"
              >
                <X size={16} color="#5E6E76" />
              </Pressable>
            </View>

            {showSearch ? (
              <View className="mb-3 flex-row items-center rounded-2xl border border-[#E1E7EA] bg-white px-3">
                <Search size={16} color="#5E6E76" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`${label} içinde ara...`}
                  placeholderTextColor="#94A3B8"
                  autoCorrect={false}
                  className="h-11 flex-1 px-2.5 text-sm text-[#102A32]"
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <X size={15} color="#94A3B8" />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <FlatList
              data={filteredOptions as string[]}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-sm text-[#5E6E76]">
                    "{query}" ile eşleşen sonuç bulunamadı.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    className={`mb-1.5 flex-row items-center justify-between rounded-2xl px-3.5 py-3 ${
                      selected ? 'bg-[#E7F1F2]' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`flex-1 pr-2 text-sm ${
                        selected
                          ? 'font-bold text-[#1A4A57]'
                          : 'font-medium text-[#102A32]'
                      }`}
                    >
                      {item}
                    </Text>
                    {selected ? (
                      <Check size={18} color="#1A4A57" strokeWidth={2.5} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
