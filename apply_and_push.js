const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 KPSS Atama & Kamu İlan Bildirimi — UI/UX Refactor Paketini Uygulama Başlatılıyor...\n');

if (!fs.existsSync('package.json') || !fs.existsSync('app')) {
  console.error('❌ Hata: Lütfen bu betiği projenin kök dizininde (C:\\KPSS_Atama_Uygulaması) çalıştırın.');
  process.exit(1);
}

const files = {
  'lib/appearance.ts': `import { Appearance } from 'react-native';

// Uygulama genelinde tekil kurumsal açık tema kullanılır.
try {
  Appearance.setColorScheme?.('light');
} catch {
  // Web veya desteklenmeyen platformlarda sessizce geç
}

export function useSystemTheme() {
  return 'light' as const;
}
`,

  'app/_layout.tsx': `import '@/lib/appearance';
import '@/lib/lock-font-scale';
import '@/lib/boot-splash';
import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SplashGate } from '@/components/SplashGate';
import { AppProviders } from '@/providers/AppProviders';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <SplashGate>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F4F7F8' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="paywall"
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="position/[id]" />
          </Stack>
        </SplashGate>
      </AppProviders>
    </QueryClientProvider>
  );
}
`,

  'components/ui.tsx': `import { useRouter } from 'expo-router';
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
      className={\`rounded-2xl border border-[#E1E7EA] bg-white p-4 shadow-sm \${className}\`}
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
      className={\`h-12 items-center justify-center rounded-2xl px-4 active:opacity-85 \${styles} \${
        disabled ? 'opacity-50' : ''
      }\`}
      accessibilityRole="button"
    >
      <Text className={\`text-sm font-extrabold \${textStyles}\`}>{label}</Text>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  kind?: 'text' | 'integer' | 'score';
  error?: string;
  hint?: string;
  maxDigits?: number;
}) {
  const [focused, setFocused] = useState(false);

  function handleChange(raw: string) {
    if (kind === 'integer') {
      onChange(integerText(raw, maxDigits));
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
        className={\`h-12 rounded-2xl border bg-white px-3.5 text-sm font-medium text-[#102A32] \${
          error
            ? 'border-red-500'
            : focused
              ? 'border-2 border-[#1A4A57]'
              : 'border-[#E1E7EA]'
        }\`}
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
            className={\`flex-1 min-w-[96px] flex-row items-center justify-center gap-1.5 rounded-2xl border py-3 px-3 \${
              active
                ? 'border-[#1A4A57] bg-[#1A4A57]'
                : 'border-[#E1E7EA] bg-white'
            }\`}
          >
            {active ? <Check size={14} color="#FFFFFF" strokeWidth={2.5} /> : null}
            <Text
              className={\`text-center text-xs font-bold \${
                active ? 'text-white' : 'text-[#102A32]'
              }\`}
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
      className={\`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 \${
        active
          ? 'border-[#1A4A57] bg-[#1A4A57]'
          : 'border-[#E1E7EA] bg-white'
      }\`}
    >
      {active ? <Check size={13} color="#FFFFFF" strokeWidth={2.5} /> : null}
      <Text
        className={\`text-xs font-semibold \${
          active ? 'text-white' : 'text-[#102A32]'
        }\`}
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
`,

  'components/AppTabBar.tsx': `import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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
            className={\`flex-1 items-center justify-center rounded-2xl py-1.5 \${
              isFocused ? 'bg-[#E7F1F2]' : ''
            }\`}
          >
            {options.tabBarIcon
              ? options.tabBarIcon({ focused: isFocused, color, size: 20 })
              : null}
            <Text
              numberOfLines={1}
              className={\`mt-1 text-[10px] \${
                isFocused
                  ? 'font-extrabold text-[#1A4A57]'
                  : 'font-medium text-[#5E6E76]'
              }\`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
`,

  'components/StepFrame.tsx': `import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { BackButton, Button, Screen, Title } from '@/components/ui';

const STEP_LABELS: Record<number, string> = {
  1: 'Kişisel Bilgiler',
  2: 'Eğitim & Bölüm',
  3: 'Sınav Puanları',
  4: 'Ehliyet & Özel Şartlar',
  5: 'Deneyim & Sertifikalar',
};

export function StepFrame({
  step,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Devam et',
}: {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
}) {
  const totalSteps = 5;

  return (
    <Screen footer={<Button label={nextLabel} onPress={onNext} />}>
      <View className="mb-3 flex-row items-center justify-between">
        <BackButton fallback="/(onboarding)/welcome" />
        <View className="items-end">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-[#1A4A57]">
            Adım {step} / {totalSteps}
          </Text>
          <Text className="text-xs font-medium text-[#5E6E76]">
            {STEP_LABELS[step] ?? ''}
          </Text>
        </View>
      </View>

      <View className="mb-5 flex-row gap-1.5">
        {Array.from({ length: totalSteps }, (_, idx) => {
          const current = idx + 1;
          const completed = current <= step;
          return (
            <View
              key={current}
              className={\`h-1.5 flex-1 rounded-full \${
                completed ? 'bg-[#1A4A57]' : 'bg-[#E1E7EA]'
              }\`}
            />
          );
        })}
      </View>

      <Title subtitle={subtitle}>{title}</Title>
      <View className="flex-1">{children}</View>
    </Screen>
  );
}
`,

  'components/SelectField.tsx': `import { Check, ChevronDown, Search, X } from 'lucide-react-native';
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
          className={\`flex-1 pr-2 text-sm font-medium \${
            value ? 'text-[#102A32]' : 'text-[#94A3B8]'
          }\`}
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
                  placeholder={\`\${label} içinde ara...\`}
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
                    className={\`mb-1.5 flex-row items-center justify-between rounded-2xl px-3.5 py-3 \${
                      selected ? 'bg-[#E7F1F2]' : 'bg-white'
                    }\`}
                  >
                    <Text
                      className={\`flex-1 pr-2 text-sm \${
                        selected
                          ? 'font-bold text-[#1A4A57]'
                          : 'font-medium text-[#102A32]'
                      }\`}
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
`,

  'app/paywall.tsx': `import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, Check, Clock, Crown, ShieldCheck, SlidersHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorText } from '@/components/ui';
import { PLANS } from '@/constants/catalog';
import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { isSupabaseConfigured } from '@/lib/env';
import { loadOfferings, purchaseProduct, restorePremium } from '@/lib/revenuecat';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS = [
  {
    icon: Bell,
    title: 'Eşleşen ilanlar',
    desc: 'Memur, sözleşmeli ve işçi kadroları profiline göre ayrılır.',
  },
  {
    icon: Clock,
    title: 'Bitiş hatırlatıcısı',
    desc: 'Son 48 saatte kapanan başvurular tek listede durur.',
  },
  {
    icon: ShieldCheck,
    title: 'Şart elemesi',
    desc: 'Yaş, boy, ehliyet ve belge uymayan kadro listeden çıkar.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Rakip analizi',
    desc: 'Taban puan, sıralama ve kontenjan ayrıntısı açılır.',
  },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 760;

  const mode = useAppStore((state) => state.mode);
  const isPremium = useAppStore((state) => state.isPremium);
  const currentPlan = useAppStore((state) => state.plan);
  const setPremium = useAppStore((state) => state.setPremium);
  const setDemoPremium = useAppStore((state) => state.setDemoPremium);

  const [selectedId, setSelectedId] = useState<'yearly' | 'quarterly' | 'monthly'>(
    currentPlan !== 'free' ? currentPlan : 'yearly'
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useQuery({
    queryKey: ['offerings'],
    queryFn: loadOfferings,
  });

  const selectedPlan = PLANS.find((p) => p.id === selectedId) ?? PLANS[0];

  function closePaywall() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  async function buy() {
    setError(null);
    setPending(true);
    try {
      if (!isSupabaseConfigured || mode === 'demo') {
        setDemoPremium(true);
        setPremium(true, selectedPlan.id);
        closePaywall();
        return;
      }
      const active = await purchaseProduct(selectedPlan.productId);
      if (active) {
        setPremium(true, selectedPlan.id);
        closePaywall();
      } else {
        setError('Satın alma işlemi tamamlanamadı.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme sırasında bir sorun oluştu.');
    } finally {
      setPending(false);
    }
  }

  async function restore() {
    setError(null);
    setPending(true);
    try {
      if (!isSupabaseConfigured || mode === 'demo') {
        setDemoPremium(true);
        setPremium(true, 'yearly');
        closePaywall();
        return;
      }
      const active = await restorePremium();
      if (active) {
        setPremium(true, 'yearly');
        closePaywall();
      } else {
        setError('Bu hesaba tanımlı aktif bir abonelik bulunamadı.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geri yükleme başarısız oldu.');
    } finally {
      setPending(false);
    }
  }

  function switchToFree() {
    setDemoPremium(false);
    setPremium(false, 'free');
    closePaywall();
  }

  return (
    <SafeAreaView className="flex-1 bg-[#133B47]" edges={['top']}>
      <View className="px-5 pb-3 pt-1.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            <Crown size={13} color="#FDE68A" />
            <Text className="text-[11px] font-bold tracking-wider text-amber-200">
              {isPremium ? 'AKTİF PRO ÜYELİK' : 'KPSS ATAMA PRO'}
            </Text>
          </View>

          <Pressable
            onPress={closePaywall}
            hitSlop={12}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/15 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <X size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text
          className={\`mt-2 text-center font-extrabold text-white \${
            isSmallScreen ? 'text-lg leading-6' : 'text-xl leading-7'
          }\`}
        >
          Profiline uygun ilanları kaçırma
        </Text>
        <Text className="mt-0.5 text-center text-xs leading-4 text-white/80">
          Eşleşen kadrolar, bitiş hatırlatıcısı ve şart elemesi tek yerde.
        </Text>
      </View>

      <SafeAreaView
        className="flex-1 justify-between rounded-t-[28px] bg-white px-4 pt-3.5"
        edges={['bottom']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 6 }}
        >
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.title}
                  className="w-[48.8%] rounded-2xl border border-[#E6ECEF] bg-[#F8FAFB] p-2.5"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-[#E3EFF1]">
                      <Icon size={13} color="#1A4A57" />
                    </View>
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-xs font-extrabold text-[#102A32]"
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    className="mt-1 text-[10.5px] leading-3.5 text-[#5E6E76]"
                  >
                    {item.desc}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="mt-2.5 gap-2">
            {PLANS.map((plan) => {
              const active = plan.id === selectedId;
              const isCurrent = isPremium && currentPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedId(plan.id)}
                  className={\`flex-row items-center justify-between rounded-2xl border px-3.5 \${
                    isSmallScreen ? 'py-2' : 'py-2.5'
                  } \${
                    active
                      ? 'border-2 border-[#1A4A57] bg-[#F2F8F9]'
                      : 'border-[#E1E7EA] bg-white'
                  }\`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={\`h-5 w-5 items-center justify-center rounded-full border-2 \${
                        active ? 'border-[#1A4A57]' : 'border-[#CBD5E1]'
                      }\`}
                    >
                      {active ? (
                        <View className="h-2.5 w-2.5 rounded-full bg-[#1A4A57]" />
                      ) : null}
                    </View>

                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-extrabold text-[#102A32]">
                          {plan.title}
                        </Text>
                        {isCurrent ? (
                          <View className="rounded-md bg-[#1A4A57] px-1.5 py-0.5">
                            <Text className="text-[9px] font-bold text-white">
                              MEVCUT PLANIN
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-xs text-[#5E6E76]">{plan.monthly}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-base font-extrabold text-[#102A32]">
                      {plan.price}
                    </Text>
                    {plan.note && plan.note !== 'Standart' ? (
                      <View className="mt-0.5 rounded-full bg-[#DCFCE7] px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-[#15803D]">
                          {plan.note.replace('indirim', 'tasarruf')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-t border-[#E8EEF0] bg-white pt-2 pb-1">
          <ErrorText text={error} />

          <Pressable
            onPress={buy}
            disabled={pending}
            className={\`h-11 flex-row items-center justify-center rounded-2xl bg-[#1A4A57] px-4 shadow-sm active:opacity-90 \${
              pending ? 'opacity-60' : ''
            }\`}
          >
            {pending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-sm font-extrabold text-white">
                  {isPremium && currentPlan === selectedPlan.id
                    ? 'Bu Plan Zaten Aktif (Devam Et)'
                    : \`\${selectedPlan.title} Planla Başla • \${selectedPlan.price}\`}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={isPremium ? switchToFree : closePaywall}
            disabled={pending}
            className="mt-1 py-1 items-center justify-center"
          >
            <Text className="text-xs font-semibold text-[#5E6E76]">
              {isPremium
                ? 'Ücretsiz (Standart) Sürüme Geç'
                : 'Şimdilik ücretsiz sürümle devam et'}
            </Text>
          </Pressable>

          <Text className="mt-0.5 px-2 text-center text-[10px] leading-3.5 text-[#7A8B94]">
            Ödeme Apple/Google hesabınızdan tahsil edilir. Dönem bitiminden en az 24 saat önce
            iptal edilmediği sürece otomatik yenilenir.
          </Text>

          <View className="mt-1 flex-row items-center justify-center gap-3">
            <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
              <Text className="text-[11px] font-bold text-[#1A4A57] underline">
                Kullanım Koşulları
              </Text>
            </Pressable>
            <Text className="text-[11px] text-[#94A3B8]">•</Text>
            <Pressable onPress={restore} disabled={pending} hitSlop={8}>
              <Text className="text-[11px] font-bold text-[#1A4A57] underline">
                Satın Alımları Geri Yükle
              </Text>
            </Pressable>
            <Text className="text-[11px] text-[#94A3B8]">•</Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text className="text-[11px] font-bold text-[#1A4A57] underline">
                Gizlilik Politikası
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
`,

  'app/(tabs)/account.tsx': `import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Crown,
  ExternalLink,
  FileText,
  RefreshCcw,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Banner, Card, Screen, Title, ToggleRow } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { deleteAccount, saveProfile } from '@/lib/data';
import { emptyDraft } from '@/lib/profile';
import { requestNotificationPermission } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';
import { ProfileDraft } from '@/types/domain';

const PLAN_NAMES: Record<string, string> = {
  free: 'Ücretsiz (Standart) Plan',
  monthly: 'Pro Aylık Plan',
  quarterly: 'Pro 3 Aylık Plan',
  yearly: 'Pro 1 Yıllık Plan',
};

export default function AccountScreen() {
  const router = useRouter();

  const plan = useAppStore((state) => state.plan);
  const mode = useAppStore((state) => state.mode);
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const setPremium = useAppStore((state) => state.setPremium);
  const setDemoPremium = useAppStore((state) => state.setDemoPremium);

  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const replaceDraft = useProfileStore((state) => state.replaceDraft);
  const reset = useProfileStore((state) => state.reset);

  const [message, setMessage] = useState<string | null>(null);

  async function persist(partial: Partial<ProfileDraft>) {
    const next = { ...draft, ...partial };
    patch(partial);
    if (mode === 'live' && userId) {
      try {
        await saveProfile(userId, next);
      } catch {
        setMessage('Ayarlar kaydedilirken bağlantı hatası oluştu.');
      }
    }
  }

  async function handleToggleNewJobs(next: boolean) {
    if (next) {
      await requestNotificationPermission().catch(() => null);
    }
    await persist({ notifyNewJobs: next });
  }

  function handleDowngradeToFree() {
    Alert.alert(
      'Ücretsiz Sürüme Dön',
      'Pro ayrıcalıkların (rakip sıralaması, son 48 saat filtreleri ve detaylı şart analizi) kapatılacak ve standart ücretsiz görünüme geçilecek. Onaylıyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ücretsiz Sürüme Geç',
          style: 'destructive',
          onPress: () => {
            setDemoPremium(false);
            setPremium(false, 'free');
            setMessage('Ücretsiz (Standart) sürüme geçiş yapıldı. Arayüz güncellendi.');
          },
        },
      ]
    );
  }

  function handleResetCriteria() {
    Alert.alert(
      'Eşleştirme Kriterlerini Sıfırla',
      'Hesabın ve kaydedilen ilanların silinmez; yalnızca eğitim, KPSS puanı ve belge kriterlerin temizlenir. Bilgilerini yeniden girmek istiyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kriterleri Sıfırla',
          onPress: async () => {
            const clean = {
              ...emptyDraft(),
              nickname: draft.nickname,
              onboardingCompleted: false,
            };
            replaceDraft(clean);
            if (mode === 'live' && userId) {
              await saveProfile(userId, clean).catch(() => null);
            }
            router.replace('/(onboarding)/step1-personal');
          },
        },
      ]
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Hesabı ve Tüm Verileri Kalıcı Sil',
      'Bu işlem geri alınamaz! Profil bilgilerin, kaydettiğin kadrolar, başvuru geçmişin ve tüm cihaz verilerin tamamen silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kalıcı Olarak Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              if (mode === 'live' && userId) {
                await deleteAccount();
              }
            } catch {
              // Yerel veriyi her koşulda temizle
            }
            setDemoPremium(false);
            setPremium(false, 'free');
            reset();
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <Title subtitle="Bildirim tercihlerini, abonelik durumunu ve veri gizliliğini buradan yönetebilirsin.">
        Ayarlar
      </Title>

      {message ? <Banner text={message} /> : null}

      <View
        className={\`mb-4 overflow-hidden rounded-3xl border p-4 shadow-sm \${
          premium
            ? 'border-[#1A4A57] bg-[#1A4A57]'
            : 'border-[#E1E7EA] bg-white'
        }\`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className={\`h-9 w-9 items-center justify-center rounded-2xl \${
                premium ? 'bg-white/15' : 'bg-[#E7F1F2]'
              }\`}
            >
              <Crown size={18} color={premium ? '#FDE68A' : '#1A4A57'} />
            </View>
            <View>
              <Text
                className={\`text-[11px] font-bold uppercase tracking-wider \${
                  premium ? 'text-amber-200' : 'text-[#5E6E76]'
                }\`}
              >
                MEVCUT ÜYELİK PLANIN
              </Text>
              <Text
                className={\`text-base font-extrabold \${
                  premium ? 'text-white' : 'text-[#102A32]'
                }\`}
              >
                {premium ? PLAN_NAMES[plan] ?? 'Pro Üyelik' : 'Ücretsiz (Standart) Plan'}
              </Text>
            </View>
          </View>

          <View
            className={\`rounded-full px-2.5 py-1 \${
              premium ? 'bg-emerald-400/20' : 'bg-slate-100'
            }\`}
          >
            <Text
              className={\`text-[11px] font-extrabold \${
                premium ? 'text-emerald-200' : 'text-[#5E6E76]'
              }\`}
            >
              {premium ? 'AKTİF' : 'STANDART'}
            </Text>
          </View>
        </View>

        <Text
          className={\`mt-2.5 text-xs leading-4 \${
            premium ? 'text-white/85' : 'text-[#5E6E76]'
          }\`}
        >
          {premium
            ? 'Tüm kadro uyumluluk analizleri, son 48 saat uyarıları ve bölüm sıralama istatistikleri hesabında açık.'
            : 'Pro sürüme geçerek bölümündeki sıralamanı, taban puan analizini ve tam şart elemesini açabilirsin.'}
        </Text>

        <View className="mt-3.5 gap-2">
          <Pressable
            onPress={() => router.push('/paywall')}
            className={\`h-11 flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-85 \${
              premium ? 'bg-white' : 'bg-[#1A4A57]'
            }\`}
          >
            <Sparkles size={15} color={premium ? '#1A4A57' : '#FFFFFF'} />
            <Text
              className={\`text-xs font-extrabold \${
                premium ? 'text-[#102A32]' : 'text-white'
              }\`}
            >
              {premium ? 'Abonelik Planını Değiştir' : 'Pro Avantajlarını İncele ve Yükselt'}
            </Text>
          </Pressable>

          {premium ? (
            <Pressable
              onPress={handleDowngradeToFree}
              className="h-9 items-center justify-center rounded-xl bg-white/10 active:opacity-75"
            >
              <Text className="text-xs font-semibold text-white/90">
                Ücretsiz (Standart) Sürüme Dön
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mb-2 flex-row items-center gap-2 px-1">
        <Bell size={15} color="#1A4A57" />
        <Text className="text-xs font-extrabold uppercase tracking-wider text-[#5E6E76]">
          Bildirim Ayarları
        </Text>
      </View>

      <ToggleRow
        label="Yeni İlan Bildirimleri"
        detail="Profilinle eşleşen yeni memur ve işçi ilanı yayınlandığında haber ver"
        value={draft.notifyNewJobs}
        onValueChange={handleToggleNewJobs}
      />
      <ToggleRow
        label="Son 48 Saat Hatırlatıcısı"
        detail="Kaydettiğin veya uygun olduğun ilanların başvurusu bitmeden önce uyar"
        value={draft.notifyDeadline}
        onValueChange={(notifyDeadline) => persist({ notifyDeadline })}
      />
      <ToggleRow
        label="Atama Sonuç & Taban Puan Duyuruları"
        detail="Kurumlar yerleştirme sonuçlarını açıkladığında bildirim gönder"
        value={draft.notifyResults}
        onValueChange={(notifyResults) => persist({ notifyResults })}
      />

      <View className="mt-3 mb-2 flex-row items-center gap-2 px-1">
        <RefreshCcw size={15} color="#B45309" />
        <Text className="text-xs font-extrabold uppercase tracking-wider text-[#5E6E76]">
          Eşleştirme ve Tercih Yönetimi
        </Text>
      </View>

      <Card className="mb-4 border-amber-200 bg-amber-50/50">
        <Text className="text-sm font-extrabold text-[#102A32]">
          Eşleştirme Kriterlerini Baştan Kur
        </Text>
        <Text className="mt-1 text-xs leading-4 text-[#5E6E76]">
          Yeni bir KPSS puanı aldıysan veya yeni bir bölümden mezun olduysan, hesabını ve favori ilanlarını silmeden sadece eşleştirme sihirbazını yeniden başlatabilirsin.
        </Text>
        <Pressable
          onPress={handleResetCriteria}
          className="mt-3 h-11 flex-row items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-amber-100/80 px-4 active:opacity-80"
        >
          <RefreshCcw size={15} color="#92400E" />
          <Text className="text-xs font-extrabold text-amber-900">
            Kriterleri Sıfırla ve Yeniden Doldur
          </Text>
        </Pressable>
      </Card>

      <View className="mb-2 flex-row items-center gap-2 px-1">
        <Shield size={15} color="#1A4A57" />
        <Text className="text-xs font-extrabold uppercase tracking-wider text-[#5E6E76]">
          Yasal ve Gizlilik
        </Text>
      </View>

      <Card className="mb-4 p-0 overflow-hidden">
        <Pressable
          onPress={() => Linking.openURL(TERMS_URL)}
          className="flex-row items-center justify-between border-b border-[#E1E7EA] px-4 py-3.5 active:bg-slate-50"
        >
          <View className="flex-row items-center gap-2.5">
            <FileText size={16} color="#1A4A57" />
            <Text className="text-sm font-semibold text-[#102A32]">
              Kullanım Koşulları
            </Text>
          </View>
          <ExternalLink size={15} color="#5E6E76" />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(PRIVACY_URL)}
          className="flex-row items-center justify-between px-4 py-3.5 active:bg-slate-50"
        >
          <View className="flex-row items-center gap-2.5">
            <CheckCircle2 size={16} color="#1A4A57" />
            <Text className="text-sm font-semibold text-[#102A32]">
              Gizlilik Politikası ve KVKK
            </Text>
          </View>
          <ExternalLink size={15} color="#5E6E76" />
        </Pressable>
      </Card>

      <View className="mb-2 flex-row items-center gap-2 px-1">
        <AlertTriangle size={15} color="#DC2626" />
        <Text className="text-xs font-extrabold uppercase tracking-wider text-red-600">
          Tehlikeli Bölge
        </Text>
      </View>

      <View className="mb-6 rounded-2xl border border-red-200 bg-red-50/60 p-4">
        <Text className="text-sm font-extrabold text-red-900">
          Hesabı ve Tüm Verileri Kalıcı Olarak Sil
        </Text>
        <Text className="mt-1 text-xs leading-4 text-red-700/90">
          Kaydettiğin ilanlar, başvuru takibin ve kişisel profilin cihazdan ve sunuculardan geri döndürülemez biçimde silinir.
        </Text>
        <Pressable
          onPress={handleDeleteAccount}
          className="mt-3 h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 active:opacity-85"
        >
          <Trash2 size={15} color="#FFFFFF" />
          <Text className="text-xs font-extrabold text-white">
            Hesabımı ve Verilerimi Kalıcı Sil
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
`,

  'app/(tabs)/index.tsx': `import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Clock,
  Crown,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Banner, Card, Screen } from '@/components/ui';
import { fetchDistribution, fetchRank, fetchSummary } from '@/lib/data';
import { formatScore, initials } from '@/lib/format';
import { highestEducation } from '@/lib/profile';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function HomeScreen() {
  const router = useRouter();
  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const plan = useAppStore((state) => state.plan);
  const draft = useProfileStore((state) => state.draft);

  const primaryDept =
    draft.educations[0]?.department || 'Genel Kamu Yönetimi';
  const topLevel = highestEducation(draft);

  const summary = useQuery({
    queryKey: ['summary', userId, draft],
    queryFn: () => fetchSummary(userId ?? 'demo', draft),
  });

  const rank = useQuery({
    queryKey: ['rank', userId, draft, premium],
    queryFn: () => fetchRank(userId ?? 'demo', draft, premium),
  });

  const buckets = useQuery({
    queryKey: ['dist', userId, primaryDept, premium],
    queryFn: () => fetchDistribution(userId ?? 'demo', primaryDept, premium),
  });

  const maxBucket = Math.max(
    ...(buckets.data?.map((b) => b.count) ?? [1]),
    1
  );

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          className="flex-row items-center gap-3"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#1A4A57]">
            <Text className="text-base font-extrabold text-white">
              {initials(draft.nickname || 'Aday')}
            </Text>
          </View>
          <View>
            <Text className="text-lg font-extrabold text-[#102A32]">
              Merhaba, {draft.nickname || 'Aday'}
            </Text>
            <Text className="text-xs font-medium text-[#5E6E76]">
              {topLevel} •{' '}
              {draft.hasKpss
                ? \`\${draft.kpssType}: \${draft.kpssScore} Puan\`
                : 'KPSS Şartsız Aday'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/paywall')}
          className={\`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 \${
            premium
              ? 'bg-[#1A4A57]'
              : 'border border-amber-300 bg-amber-50'
          }\`}
        >
          <Crown size={13} color={premium ? '#FDE68A' : '#B45309'} />
          <Text
            className={\`text-[11px] font-extrabold \${
              premium ? 'text-amber-200' : 'text-amber-900'
            }\`}
          >
            {premium ? 'PRO AKTİF' : "PRO'YA GEÇ"}
          </Text>
        </Pressable>
      </View>

      {!draft.onboardingCompleted ? (
        <Pressable onPress={() => router.push('/(onboarding)/step1-personal')}>
          <Banner text="Profil bilgilerin henüz eksik. Sana tam uyan memur ve işçi kadrolarını görmek için dokun ve tamamla." />
        </Pressable>
      ) : null}

      <View className="mb-4 rounded-3xl bg-[#1A4A57] p-5 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={15} color="#FDE68A" />
            <Text className="text-xs font-bold uppercase tracking-wider text-amber-200">
              CANLI EŞLEŞME DURUMU
            </Text>
          </View>
          <Text className="text-[11px] font-medium text-white/75">
            {summary.data?.institutionCount ?? 0} Kurum
          </Text>
        </View>

        <View className="mt-3 flex-row items-baseline gap-2">
          <Text className="text-4xl font-extrabold text-white">
            {summary.data?.totalPositions ?? 0}
          </Text>
          <Text className="text-sm font-semibold text-white/85">
            kadro şartlarınla uyumlu
          </Text>
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <Pressable
            onPress={() => router.push('/(tabs)/jobs')}
            className="flex-1 rounded-2xl bg-white/10 p-3"
          >
            <View className="flex-row items-center gap-1.5">
              <Briefcase size={13} color="#A7F3D0" />
              <Text className="text-[11px] font-semibold text-white/80">
                Bugün Eklenen
              </Text>
            </View>
            <Text className="mt-1 text-lg font-extrabold text-white">
              +{summary.data?.newToday ?? 0} İlan
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/jobs')}
            className="flex-1 rounded-2xl bg-white/10 p-3"
          >
            <View className="flex-row items-center gap-1.5">
              <Clock size={13} color="#FDE68A" />
              <Text className="text-[11px] font-semibold text-white/80">
                Son 48 Saat
              </Text>
            </View>
            <Text className="mt-1 text-lg font-extrabold text-amber-200">
              {summary.data?.expiring48h ?? 0} İlan
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/jobs')}
          className="mt-3.5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3 active:opacity-90"
        >
          <Text className="text-xs font-extrabold text-[#102A32]">
            Bana Uygun İlanları İncele
          </Text>
          <ArrowRight size={15} color="#102A32" />
        </Pressable>
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#E7F1F2]">
              <Trophy size={16} color="#1A4A57" />
            </View>
            <View>
              <Text className="text-sm font-extrabold text-[#102A32]">
                Bölüm İçi Rakip Sıralaması
              </Text>
              <Text numberOfLines={1} className="text-xs text-[#5E6E76]">
                {primaryDept}
              </Text>
            </View>
          </View>

          {premium ? (
            <View className="rounded-full bg-emerald-100 px-2.5 py-1">
              <Text className="text-[10px] font-extrabold text-emerald-800">
                PRO VERİSİ
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1">
              <Lock size={11} color="#92400E" />
              <Text className="text-[10px] font-extrabold text-amber-900">
                PRO ÖZELLİK
              </Text>
            </View>
          )}
        </View>

        {premium ? (
          <View className="mt-3.5 rounded-2xl bg-[#F4F7F8] p-3.5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-[#5E6E76]">Tahmini Sıralaman</Text>
                <Text className="mt-0.5 text-2xl font-extrabold text-[#1A4A57]">
                  {rank.data?.userRank ? \`\${rank.data.userRank}. Sıra\` : 'Hesaplanıyor'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-[#5E6E76]">Toplam Rakip Aday</Text>
                <Text className="mt-0.5 text-base font-bold text-[#102A32]">
                  {rank.data?.totalCandidates ?? 0} Kişi
                </Text>
              </View>
            </View>
            <Text className="mt-2 text-[11px] text-[#5E6E76]">
              Baz alınan puanın: {formatScore(rank.data?.userScore ?? Number(draft.kpssScore || 0))} ({plan.toUpperCase()} aboneliği ile canlı güncellenir)
            </Text>
          </View>
        ) : (
          <View className="mt-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFB] p-3.5">
            <Text className="text-xs font-semibold leading-4 text-[#102A32]">
              Mezun olduğun bölümdeki {rank.data?.totalCandidates ?? 240}+ aday arasında kaçıncı sırada olduğunu görmek için Pro'ya geç.
            </Text>
            <Pressable
              onPress={() => router.push('/paywall')}
              className="mt-2.5 h-9 flex-row items-center justify-center gap-1.5 rounded-xl bg-[#1A4A57] px-3"
            >
              <Crown size={13} color="#FDE68A" />
              <Text className="text-xs font-bold text-white">
                Sıralamamı ve Rakiplerimi Gör
              </Text>
            </Pressable>
          </View>
        )}
      </Card>

      <Card className="mb-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#E7F1F2]">
              <BarChart3 size={16} color="#1A4A57" />
            </View>
            <View>
              <Text className="text-sm font-extrabold text-[#102A32]">
                Aday Puan Dağılımı
              </Text>
              <Text className="text-xs text-[#5E6E76]">
                Aynı kadroları hedefleyen adayların puan yığılması
              </Text>
            </View>
          </View>
        </View>

        {premium ? (
          <View className="gap-2">
            {(buckets.data ?? []).map((bucket) => {
              const widthPct = Math.max(
                Math.round((bucket.count / maxBucket) * 100),
                8
              );
              return (
                <View key={bucket.label} className="flex-row items-center gap-2.5">
                  <Text className="w-16 text-xs font-bold text-[#5E6E76]">
                    {bucket.label}
                  </Text>
                  <View className="h-6 flex-1 overflow-hidden rounded-lg bg-[#F4F7F8]">
                    <View
                      style={{ width: \`\${widthPct}%\` }}
                      className="h-full rounded-lg bg-[#1A4A57]"
                    />
                  </View>
                  <Text className="w-12 text-right text-xs font-extrabold text-[#102A32]">
                    {bucket.count}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/paywall')}
            className="items-center rounded-2xl bg-[#F4F7F8] p-4"
          >
            <Lock size={20} color="#1A4A57" />
            <Text className="mt-1.5 text-xs font-bold text-[#102A32]">
              Puan Dağılım Grafiği Pro Üyelere Özeldir
            </Text>
            <Text className="mt-0.5 text-center text-[11px] text-[#5E6E76]">
              Hangi puan aralığında kaç rakibin olduğunu görmek için dokun.
            </Text>
          </Pressable>
        )}
      </Card>
    </Screen>
  );
}
`,

  'app/(tabs)/profile.tsx': `import { useRouter } from 'expo-router';
import {
  Award,
  Car,
  ChevronRight,
  Crown,
  FileBadge,
  GraduationCap,
  UserRound,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Banner, Card, Screen, Title } from '@/components/ui';
import { initials } from '@/lib/format';
import { highestEducation } from '@/lib/profile';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

const LINKS = [
  {
    title: 'Kişisel Bilgiler',
    subtitle: 'Ad, yaş, boy, kilo, cinsiyet ve tercih ili',
    href: '/(onboarding)/step1-personal',
    icon: UserRound,
  },
  {
    title: 'Eğitim ve Mezuniyet',
    subtitle: 'Öğrenim düzeyi ve mezun olunan bölümler',
    href: '/(onboarding)/step2-education',
    icon: GraduationCap,
  },
  {
    title: 'Sınav Puanları',
    subtitle: 'KPSS, YDS ve ALES puan bilgilerin',
    href: '/(onboarding)/step3-exams',
    icon: Award,
  },
  {
    title: 'Ehliyet ve Özel Durum',
    subtitle: 'Sürücü belgesi sınıfları, ÖGG kartı ve EKPSS durumu',
    href: '/(onboarding)/step4-details',
    icon: Car,
  },
  {
    title: 'Belgeler ve SGK Deneyimi',
    subtitle: 'MEB sertifikaları, öğrencilik ve SGK prim günleri',
    href: '/(onboarding)/step5-documents',
    icon: FileBadge,
  },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const draft = useProfileStore((state) => state.draft);
  const premium = useAppStore((state) => state.isPremium);
  const topLevel = highestEducation(draft);

  return (
    <Screen>
      <Title subtitle="İlan eşleştirmelerinde kullanılan kriterlerini buradan güncelleyebilirsin.">
        Profilim
      </Title>

      {!draft.onboardingCompleted ? (
        <Banner text="Profil kurulumun henüz tamamlanmadı. Aşağıdaki adımları doldurarak eşleştirmeyi başlat." />
      ) : null}

      <Card className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3.5">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#1A4A57]">
            <Text className="text-lg font-extrabold text-white">
              {initials(draft.nickname || 'Aday')}
            </Text>
          </View>
          <View>
            <Text className="text-lg font-extrabold text-[#102A32]">
              {draft.nickname || 'İsimsiz Aday'}
            </Text>
            <Text className="mt-0.5 text-xs font-medium text-[#5E6E76]">
              {topLevel} • {draft.city || 'İl Seçilmedi'}
            </Text>
            <Text className="mt-0.5 text-xs font-bold text-[#1A4A57]">
              {draft.hasKpss
                ? \`KPSS \${draft.kpssType}: \${draft.kpssScore}\`
                : 'KPSS Puanı Girilmedi'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/paywall')}
          className={\`flex-row items-center gap-1 rounded-full px-3 py-1.5 \${
            premium ? 'bg-[#1A4A57]' : 'border border-[#E1E7EA] bg-[#F4F7F8]'
          }\`}
        >
          <Crown size={13} color={premium ? '#FDE68A' : '#1A4A57'} />
          <Text
            className={\`text-[11px] font-extrabold \${
              premium ? 'text-amber-200' : 'text-[#102A32]'
            }\`}
          >
            {premium ? 'PRO' : 'STANDART'}
          </Text>
        </Pressable>
      </Card>

      <View className="gap-2.5">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(\`\${item.href}?edit=1\` as never)}
              className="flex-row items-center justify-between rounded-2xl border border-[#E1E7EA] bg-white p-3.5 shadow-sm active:opacity-80"
            >
              <View className="flex-1 flex-row items-center gap-3 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F1F2]">
                  <Icon size={18} color="#1A4A57" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-[#102A32]">
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-xs text-[#5E6E76]"
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#5E6E76" />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
`,

  'app/position/[id].tsx': `import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  CheckCircle2,
  Crown,
  EyeOff,
  Lock,
  XCircle,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { JobChips, JobNotice, JobRequirements } from '@/components/JobFacts';
import { BackButton, Button, Card, Screen } from '@/components/ui';
import { fetchPosition, upsertInteraction } from '@/lib/data';
import { evaluatePosition } from '@/lib/match';
import { toMatchProfile } from '@/lib/profile';
import { openOfficialSource, sourceLabel } from '@/lib/source';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function PositionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const userId = useAppStore((state) => state.userId);
  const premium = useAppStore((state) => state.isPremium);
  const draft = useProfileStore((state) => state.draft);
  const interactions = useProfileStore((state) => state.interactions);
  const setInteraction = useProfileStore((state) => state.setInteraction);

  const interaction = id ? interactions[id] : undefined;

  const position = useQuery({
    queryKey: ['position', id, userId, draft, premium],
    enabled: Boolean(id),
    queryFn: () => fetchPosition(userId ?? 'demo', id!, draft, premium),
  });

  const job = position.data;
  const verdict = job ? evaluatePosition(toMatchProfile(draft), job) : null;

  async function updateInteraction(partial: {
    is_hidden?: boolean;
    is_saved?: boolean;
  }) {
    if (!id) return;
    setInteraction(id, {
      isHidden: partial.is_hidden ?? interaction?.isHidden ?? false,
      isSaved: partial.is_saved ?? interaction?.isSaved ?? false,
      applicationStatus: interaction?.applicationStatus ?? 'none',
    });
    if (userId) {
      await upsertInteraction(userId, id, partial).catch(() => null);
    }
  }

  if (!job) {
    return (
      <Screen>
        <View className="mb-4">
          <BackButton fallback="/(tabs)/jobs" />
        </View>
        <Card>
          <Text className="text-center text-sm font-semibold text-[#5E6E76]">
            {position.isLoading ? 'İlan detayları yükleniyor...' : 'İlan bulunamadı.'}
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View className="gap-2">
          <Button
            label={\`Resmi İlan Kılavuzunu Aç (\${sourceLabel(job.sourceName)})\`}
            onPress={() => openOfficialSource(job.sourceUrl)}
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() =>
                updateInteraction({ is_saved: !interaction?.isSaved })
              }
              className={\`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border \${
                interaction?.isSaved
                  ? 'border-[#1A4A57] bg-[#E7F1F2]'
                  : 'border-[#E1E7EA] bg-white'
              }\`}
            >
              <Bookmark size={15} color="#1A4A57" />
              <Text className="text-xs font-bold text-[#102A32]">
                {interaction?.isSaved ? 'Kaydedildi' : 'Kaydet'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                updateInteraction({ is_hidden: !interaction?.isHidden })
              }
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#E1E7EA] bg-white"
            >
              <EyeOff size={15} color="#5E6E76" />
              <Text className="text-xs font-bold text-[#5E6E76]">
                {interaction?.isHidden ? 'Gizlendi' : 'Listeden Gizle'}
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View className="mb-3 flex-row items-center justify-between">
        <BackButton fallback="/(tabs)/jobs" />
        <Text className="text-xs font-bold uppercase tracking-wider text-[#5E6E76]">
          KADRO DETAYI
        </Text>
      </View>

      <Card className="mb-3">
        <Text className="text-xs font-extrabold uppercase tracking-wider text-[#1A4A57]">
          {job.institutionName}
        </Text>
        <Text className="mt-1 text-xl font-extrabold text-[#102A32]">
          {job.positionTitle}
        </Text>
        <Text className="mt-1 text-xs text-[#5E6E76]">{job.announcementTitle}</Text>

        <View className="mt-3">
          <JobChips
            end={job.applicationEndDate}
            education={job.educationLevel}
            quota={job.quota}
            requiresKpss={job.requiresKpss}
            kpssType={job.kpssType}
            minKpssScore={job.minKpssScore}
          />
        </View>
      </Card>

      <JobNotice start={job.applicationStartDate} end={job.applicationEndDate} />

      {verdict ? (
        premium ? (
          <View
            className={\`mb-3 rounded-2xl border p-4 \${
              verdict.matched
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-amber-300 bg-amber-50'
            }\`}
          >
            <View className="flex-row items-center gap-2">
              {verdict.matched ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : (
                <XCircle size={18} color="#D97706" />
              )}
              <Text
                className={\`text-sm font-extrabold \${
                  verdict.matched ? 'text-emerald-900' : 'text-amber-900'
                }\`}
              >
                {verdict.matched
                  ? 'Profilin Bu Kadro Şartlarıyla Tam Uyumlu!'
                  : 'Bazı Kadro Şartları Profilinle Uyuşmuyor'}
              </Text>
            </View>

            {verdict.gaps && verdict.gaps.length > 0 ? (
              <View className="mt-2.5 gap-1">
                {verdict.gaps.map((gap: string, i: number) => (
                  <Text key={i} className="text-xs font-medium text-amber-900">
                    • {gap}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="mt-1.5 text-xs text-emerald-800">
                Eğitim düzeyin, puanın, yaş/boy ve belge kriterlerin bu kadroya başvurmak için yeterli görünüyor.
              </Text>
            )}
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/paywall')}
            className="mb-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Lock size={16} color="#B45309" />
                <Text className="text-sm font-extrabold text-amber-950">
                  Kişisel Şart Uygunluk Analizi (Pro)
                </Text>
              </View>
              <Crown size={16} color="#B45309" />
            </View>
            <Text className="mt-1.5 text-xs leading-4 text-amber-900">
              Profilinin bu kadrodaki yaş, boy, bölüm, puan ve sertifika şartlarını sağlayıp sağlamadığını görmek için Pro'ya geç.
            </Text>
          </Pressable>
        )
      ) : null}

      <JobRequirements job={job} />
    </Screen>
  );
}
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✅ Güncellendi:', relPath);
}

try {
  console.log('\n📦 Git commit ve push işlemi başlatılıyor...');
  execSync('git add lib/appearance.ts app/_layout.tsx components/ui.tsx components/AppTabBar.tsx components/StepFrame.tsx components/SelectField.tsx app/paywall.tsx "app/(tabs)/account.tsx" "app/(tabs)/index.tsx" "app/(tabs)/profile.tsx" "app/position/[id].tsx"', { stdio: 'inherit' });
  execSync('git commit -m "refactor(ui-ux): fix paywall overflow, remove broken dark mode, add reactive Free/Pro UI and redesign settings"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('\n🎉 Tüm değişiklikler başarıyla uygulandı, commitlendi ve GitHub\'a pushlandı!');
} catch (err) {
  console.error('\n⚠️ Dosyalar güncellendi ancak git commit/push sırasında bir mesaj oluştu:', err.message);
}