import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { integerText, nameText, scoreText } from '@/lib/input';

const cardShadow: ViewStyle = {
  shadowColor: '#1A2332',
  shadowOpacity: 0.07,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 20 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1 px-5" style={{ paddingBottom: bottom }}>{children}</View>
  );
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-night" edges={['top', 'left', 'right']}>
      <View className="mx-auto w-full max-w-[480px] flex-1">{body}</View>
    </SafeAreaView>
  );
}

export function BackButton({ fallback = '/(tabs)' }: { fallback?: '/' | '/(tabs)' | '/(tabs)/jobs' | '/paywall' | '/(onboarding)/step5-documents' }) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Geri"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      className="mb-2 mt-2 flex-row items-center self-start gap-1 rounded-full border border-line bg-white py-2 pl-2 pr-3 dark:border-slate-700 dark:bg-slate-800"
    >
      <ChevronLeft color={colorScheme === 'dark' ? '#F4F7F8' : '#102A32'} size={18} strokeWidth={2.4} />
      <Text className="text-sm font-semibold text-ink dark:text-white">Geri</Text>
    </Pressable>
  );
}

export function Title({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View className="mb-5 mt-3">
      <Text className="text-xs font-semibold tracking-[2px] text-brand-700 dark:text-brand-100">KPSS ATAMA</Text>
      <Text className="mt-1 text-3xl font-bold text-ink dark:text-white">{children}</Text>
      {subtitle ? <Text className="mt-2 text-sm leading-6 text-muted dark:text-slate-400">{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View style={cardShadow} className={`rounded-3xl border border-line bg-white p-4 dark:border-[#2A4550] dark:bg-[#17313A] ${className}`}>
      {children}
    </View>
  );
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
    secondary: 'border border-line bg-white dark:border-slate-700 dark:bg-slate-800',
    ghost: 'bg-transparent',
  };
  const text = variant === 'primary' ? 'text-white' : 'text-ink dark:text-white';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={variant === 'primary' ? { shadowColor: '#111827', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 } : undefined}
      className={`items-center rounded-2xl px-4 py-4 ${variants[variant]} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={`text-base font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  kind = 'text',
  maxDigits = 3,
  maxValue,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  kind?: 'text' | 'integer' | 'score';
  maxDigits?: number;
  maxValue?: number;
}) {
  const keyboardType = kind === 'integer' ? 'number-pad' : kind === 'score' ? 'decimal-pad' : 'default';
  function change(next: string) {
    if (kind === 'integer') onChangeText(integerText(next, maxDigits, maxValue));
    else if (kind === 'score') onChangeText(scoreText(next));
    else onChangeText(nameText(next));
  }
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-sm font-semibold text-ink dark:text-slate-200">{label}</Text>
      <TextInput
        value={value}
        onChangeText={change}
        placeholder={placeholder}
        placeholderTextColor="#A39888"
        keyboardType={keyboardType}
        inputMode={kind === 'integer' ? 'numeric' : kind === 'score' ? 'decimal' : 'text'}
        autoCapitalize={kind === 'text' ? 'words' : 'none'}
        autoCorrect={false}
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
        maxLength={kind === 'text' ? 32 : kind === 'score' ? 8 : maxDigits}
        className="rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
          <Pressable key={option} accessibilityRole="button" onPress={() => onChange(option)} className={`rounded-full px-4 py-2.5 ${active ? 'bg-brand-700' : 'border border-line bg-white dark:border-slate-600 dark:bg-slate-800'}`}>
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink dark:text-slate-100'}`}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={`rounded-full border px-3 py-2 ${active ? 'border-brand-700 bg-brand-700' : 'border-line bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-ink dark:text-slate-100'}`}>{label}</Text>
    </Pressable>
  );
}

export function ToggleRow({ label, detail, value, onValueChange }: { label: string; detail?: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-line bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
      <View className="mr-3 flex-1">
        <Text className="font-semibold text-ink dark:text-white">{label}</Text>
        {detail ? <Text className="mt-1 text-xs leading-4 text-muted dark:text-slate-300">{detail}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: '#1A4A57', false: '#D5DEE2' }} />
    </View>
  );
}

export function Banner({ text }: { text: string }) {
  return (
    <View className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <Text className="text-sm leading-5 text-ink dark:text-slate-100">{text}</Text>
    </View>
  );
}

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return <Text className="mb-3 text-sm text-red-700">{text}</Text>;
}
