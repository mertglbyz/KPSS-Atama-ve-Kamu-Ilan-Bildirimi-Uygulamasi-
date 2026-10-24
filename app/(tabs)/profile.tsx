import { useRouter } from 'expo-router';
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
                ? `KPSS ${draft.kpssType}: ${draft.kpssScore}`
                : 'KPSS Puanı Girilmedi'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/paywall')}
          className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
            premium ? 'bg-[#1A4A57]' : 'border border-[#E1E7EA] bg-[#F4F7F8]'
          }`}
        >
          <Crown size={13} color={premium ? '#FDE68A' : '#1A4A57'} />
          <Text
            className={`text-[11px] font-extrabold ${
              premium ? 'text-amber-200' : 'text-[#102A32]'
            }`}
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
              onPress={() => router.push(`${item.href}?edit=1` as never)}
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
