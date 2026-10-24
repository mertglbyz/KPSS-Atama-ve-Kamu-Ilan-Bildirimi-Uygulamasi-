import { useRouter } from 'expo-router';
import { ClipboardCheck, Files, GraduationCap, type LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';

const POINTS: { title: string; detail: string; icon: LucideIcon }[] = [
  { title: 'Eğitim', detail: 'Mezuniyet düzeyi ve bölüm', icon: GraduationCap },
  { title: 'Sınav', detail: 'KPSS, YDS ve ALES puanı', icon: ClipboardCheck },
  { title: 'Belgeler', detail: 'Sertifika, ehliyet ve SGK', icon: Files },
];

function IconSlot({ children, dark }: { children: ReactNode; dark: boolean }) {
  return <View style={[styles.iconSlot, dark && styles.iconSlotDark]}>{children}</View>;
}

export default function Welcome() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <SafeAreaView style={[styles.screen, dark && styles.screenDark]} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.column}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <Text className="text-xs font-semibold tracking-[2px] text-brand-700 dark:text-brand-100">KPSS ATAMA</Text>
              <Text className="text-4xl font-bold leading-10 text-ink dark:text-white" style={styles.title}>Merhaba</Text>
              <Text className="text-base leading-6 text-muted dark:text-slate-300" style={styles.body}>
                Sana uygun kadroları ayırabilmemiz için kısa bir profile ihtiyacımız var. Bu bilgiler yalnızca ilan şartlarıyla karşılaştırılır.
              </Text>
            </View>
            <View style={[styles.card, dark && styles.cardDark]}>
              {POINTS.map((point, index) => {
                const Icon = point.icon;
                return (
                  <View key={point.title} style={index > 0 ? [styles.rowDivider, dark && styles.rowDividerDark] : undefined}>
                    <View style={styles.row}>
                      <IconSlot dark={dark}>
                        <Icon color={dark ? '#D3E4E6' : '#1A4A57'} size={20} strokeWidth={2.2} />
                      </IconSlot>
                      <View style={styles.rowText}>
                        <Text className="text-base font-semibold text-ink dark:text-white">{point.title}</Text>
                        <Text className="mt-1 text-sm leading-5 text-muted dark:text-slate-300">{point.detail}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text className="text-sm leading-5 text-muted dark:text-slate-300">Uymadığın ilan elenir. Uygun olanlar senin için listelenir.</Text>
          </ScrollView>
          <View style={styles.footer}>
            <Button label="Bilgileri girmeye başla" onPress={() => router.replace('/(onboarding)/step1-personal')} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F8' },
  screenDark: { backgroundColor: '#102027' },
  flex: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: { marginTop: 16 },
  body: { marginTop: 16 },
  card: {
    marginVertical: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E7EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#102A32',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardDark: { borderColor: '#2A4550', backgroundColor: '#17313A' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#E1E7EA' },
  rowDividerDark: { borderTopColor: '#2A4550' },
  iconSlot: {
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#E7F1F2',
    padding: 8,
  },
  iconSlotDark: { backgroundColor: '#1E3A44' },
  rowText: { flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
});
