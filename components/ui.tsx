import { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const body = scroll ? (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1 px-5">{children}</View>
  );
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-slate-950" edges={['top', 'left', 'right']}>
      <View className="mx-auto w-full max-w-[480px] flex-1">{body}</View>
    </SafeAreaView>
  );
}

export function Title({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View className="mb-5 mt-2">
      <Text className="text-2xl font-bold text-ink dark:text-white">{children}</Text>
      {subtitle ? <Text className="mt-1 text-sm leading-5 text-muted dark:text-slate-400">{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-3xl border border-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-brand-700',
    secondary: 'border border-brand-100 bg-brand-50 dark:border-slate-700 dark:bg-slate-800',
    ghost: 'bg-transparent',
  };
  const text = variant === 'primary' ? 'text-white' : 'text-brand-700 dark:text-blue-200';
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className={`items-center rounded-2xl px-4 py-4 ${variants[variant]} ${disabled ? 'opacity-50' : ''}`}>
      <Text className={`text-base font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'email-address';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-ink dark:text-slate-200">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        className="rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </View>
  );
}

export function Choice({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} className={`rounded-full px-4 py-2 ${active ? 'bg-brand-700' : 'bg-white dark:bg-slate-800'}`}>
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink dark:text-slate-100'}`}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full border px-3 py-2 ${active ? 'border-brand-700 bg-brand-700' : 'border-line bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-ink dark:text-slate-100'}`}>{label}</Text>
    </Pressable>
  );
}

export function ToggleRow({ label, detail, value, onValueChange }: { label: string; detail?: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
      <View className="mr-3 flex-1">
        <Text className="font-medium text-ink dark:text-white">{label}</Text>
        {detail ? <Text className="mt-1 text-xs text-muted">{detail}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: '#0B3A82', false: '#CBD5E1' }} />
    </View>
  );
}

export function Banner({ text }: { text: string }) {
  return (
    <View className="mb-4 rounded-2xl bg-brand-50 px-4 py-3 dark:bg-slate-800">
      <Text className="text-sm leading-5 text-brand-800 dark:text-blue-100">{text}</Text>
    </View>
  );
}

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return <Text className="mb-3 text-sm text-red-600">{text}</Text>;
}
