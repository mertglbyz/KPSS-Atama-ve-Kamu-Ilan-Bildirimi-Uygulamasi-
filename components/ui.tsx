import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Check, Info } from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { integerText, nameText, scoreText } from '@/lib/input';

export function Screen({
  children,
  footer,
  scroll = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView className="flex-1 bg-[#F4F7F8]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scroll ? (
          <ScrollView
            className="flex-1 px-4 pt-2"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: footer ? 24 : 104,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1 px-4 pt-2">{children}</View>
        )}
        {footer ? (
          <View className="border-t border-[#E1E7EA] bg-[#F4F7F8] px-4 py-3">
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BackButton({ fallback = '/(tabs)' }: { fallback?: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace(fallback as never)
      }
      hitSlop={10}
      className="h-10 w-10 items-center justify-center rounded-2xl border border-[#E1E7EA] bg-white active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel="Geri dön"
    >
      <ArrowLeft size={18} color="#102A32" />
    </Pressable>
  );
}

export function Title({
  children,
  subtitle,
}: {
  children: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-2xl font-extrabold tracking-tight text-[#102A32]">
        {children}
      </Text>
      {subtitle ? (
        <Text className="mt-1.5 text-sm leading-5 text-[#5E6E76]">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-2xl border border-[#E1E7EA] bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-[#1A4A57] border-transparent',
    secondary: 'bg-white border-[#E1E7EA] border',
    ghost: 'bg-transparent border-transparent',
  }[variant];

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-[#102A32]',
    ghost: 'text-[#1A4A57]',
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-12 items-center justify-center rounded-2xl px-4 active:opacity-85 ${styles} ${
        disabled ? 'opacity-50' : ''
      }`}
      accessibilityRole="button"
    >
      <Text className={`text-sm font-extrabold ${textStyles}`}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  kind = 'text',
  error,
  hint,
  maxDigits = 4,
  maxValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  kind?: 'text' | 'integer' | 'score';
  error?: string | null;
  hint?: string;
  maxDigits?: number;
  maxValue?: number;
}) {
  const [focused, setFocused] = useState(false);

  function handleChange(raw: string) {
    if (kind === 'integer') {
      onChange(integerText(raw, maxDigits, maxValue));
      return;
    }
    if (kind === 'score') {
      onChange(scoreText(raw));
      return;
    }
    onChange(nameText(raw));
  }

  return (
    <View className="mb-3.5">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#102A32]/80">
          {label}
        </Text>
        {hint ? <Text className="text-[11px] text-[#5E6E76]">{hint}</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={
          kind === 'integer'
            ? 'number-pad'
            : kind === 'score'
              ? 'decimal-pad'
              : keyboardType
        }
        className={`h-12 rounded-2xl border bg-white px-3.5 text-sm font-medium text-[#102A32] ${
          error
            ? 'border-red-500'
            : focused
              ? 'border-2 border-[#1A4A57]'
              : 'border-[#E1E7EA]'
        }`}
      />
      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-600">{error}</Text>
      ) : null}
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
    <View className="mb-3.5 flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`flex-1 min-w-[96px] flex-row items-center justify-center gap-1.5 rounded-2xl border py-3 px-3 ${
              active
                ? 'border-[#1A4A57] bg-[#1A4A57]'
                : 'border-[#E1E7EA] bg-white'
            }`}
          >
            {active ? <Check size={14} color="#FFFFFF" strokeWidth={2.5} /> : null}
            <Text
              className={`text-center text-xs font-bold ${
                active ? 'text-white' : 'text-[#102A32]'
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${
        active
          ? 'border-[#1A4A57] bg-[#1A4A57]'
          : 'border-[#E1E7EA] bg-white'
      }`}
    >
      {active ? <Check size={13} color="#FFFFFF" strokeWidth={2.5} /> : null}
      <Text
        className={`text-xs font-semibold ${
          active ? 'text-white' : 'text-[#102A32]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  detail,
  value,
  onValueChange,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-[#E1E7EA] bg-white p-3.5"
    >
      <View className="flex-1 pr-3">
        <Text className="text-sm font-bold text-[#102A32]">{label}</Text>
        {detail ? (
          <Text className="mt-0.5 text-xs leading-4 text-[#5E6E76]">{detail}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#1A4A57' }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

export function Banner({ text }: { text: string }) {
  return (
    <View className="mb-3 flex-row items-center gap-2.5 rounded-2xl border border-[#D3E4E6] bg-[#E7F1F2] p-3.5">
      <Info size={16} color="#1A4A57" />
      <Text className="flex-1 text-xs font-medium leading-4 text-[#102A32]">
        {text}
      </Text>
    </View>
  );
}

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View className="mb-2 flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
      <AlertCircle size={15} color="#DC2626" />
      <Text className="flex-1 text-xs font-semibold text-red-700">{text}</Text>
    </View>
  );
}
