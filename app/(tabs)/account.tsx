import { useRouter } from 'expo-router';
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
        className={`mb-4 overflow-hidden rounded-3xl border p-4 shadow-sm ${
          premium
            ? 'border-[#1A4A57] bg-[#1A4A57]'
            : 'border-[#E1E7EA] bg-white'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className={`h-9 w-9 items-center justify-center rounded-2xl ${
                premium ? 'bg-white/15' : 'bg-[#E7F1F2]'
              }`}
            >
              <Crown size={18} color={premium ? '#FDE68A' : '#1A4A57'} />
            </View>
            <View>
              <Text
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  premium ? 'text-amber-200' : 'text-[#5E6E76]'
                }`}
              >
                MEVCUT ÜYELİK PLANIN
              </Text>
              <Text
                className={`text-base font-extrabold ${
                  premium ? 'text-white' : 'text-[#102A32]'
                }`}
              >
                {premium ? PLAN_NAMES[plan] ?? 'Pro Üyelik' : 'Ücretsiz (Standart) Plan'}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-full px-2.5 py-1 ${
              premium ? 'bg-emerald-400/20' : 'bg-slate-100'
            }`}
          >
            <Text
              className={`text-[11px] font-extrabold ${
                premium ? 'text-emerald-200' : 'text-[#5E6E76]'
              }`}
            >
              {premium ? 'AKTİF' : 'STANDART'}
            </Text>
          </View>
        </View>

        <Text
          className={`mt-2.5 text-xs leading-4 ${
            premium ? 'text-white/85' : 'text-[#5E6E76]'
          }`}
        >
          {premium
            ? 'Tüm kadro uyumluluk analizleri, son 48 saat uyarıları ve bölüm sıralama istatistikleri hesabında açık.'
            : 'Pro sürüme geçerek bölümündeki sıralamanı, taban puan analizini ve tam şart elemesini açabilirsin.'}
        </Text>

        <View className="mt-3.5 gap-2">
          <Pressable
            onPress={() => router.push('/paywall')}
            className={`h-11 flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-85 ${
              premium ? 'bg-white' : 'bg-[#1A4A57]'
            }`}
          >
            <Sparkles size={15} color={premium ? '#1A4A57' : '#FFFFFF'} />
            <Text
              className={`text-xs font-extrabold ${
                premium ? 'text-[#102A32]' : 'text-white'
              }`}
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
