import { useRouter } from 'expo-router';
import { BellRing, CalendarClock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Screen } from '@/components/ui';
import { registerPushToken, requestNotificationPermission } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS = [
  { icon: BellRing, title: 'Yeni ilan anında cebinde', detail: 'Profiline uyan bir kadro yayınlandığı an haber alırsın.' },
  { icon: CalendarClock, title: 'Son başvuru günü kaçmaz', detail: 'Başvurusu bitmek üzere olan ilanlar için hatırlatma gelir.' },
  { icon: ShieldCheck, title: 'Sadece sana uyanlar', detail: 'Şartlarını sağlamadığın ilanlar için bildirim göndermeyiz.' },
] as const;

export default function NotificationsPermission() {
  const router = useRouter();
  const mode = useAppStore((state) => state.mode);
  const userId = useAppStore((state) => state.userId);
  const [pending, setPending] = useState(false);
  const [denied, setDenied] = useState(false);

  function goNext() {
    router.replace('/(onboarding)/result');
  }

  async function allow() {
    setPending(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setDenied(true);
        return;
      }
      if (mode === 'live' && userId) await registerPushToken(userId).catch(() => null);
      goNext();
    } catch {
      setDenied(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen
      footer={
        <View className="gap-3">
          {denied ? (
            <Button label="Devam et" onPress={goNext} />
          ) : (
            <>
              <Button label={pending ? 'İzin isteniyor' : 'Bildirimleri aç'} onPress={() => void allow()} disabled={pending} />
              <Button label="Şimdi değil" variant="secondary" onPress={goNext} disabled={pending} />
            </>
          )}
        </View>
      }
    >
      <View className="mt-6 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E7F1F2]">
          <BellRing size={36} color="#1A4A57" />
        </View>
        <Text className="mt-5 text-center text-2xl font-extrabold tracking-tight text-[#102A32]">Uygun ilanı ilk sen öğren</Text>
        <Text className="mt-2 px-2 text-center text-sm leading-5 text-[#5E6E76]">
          KPSS Atama&apos;nın en önemli işi, profiline uygun bir ilan çıktığında seni haberdar etmek. Bunun için bildirim iznine ihtiyacımız var.
        </Text>
      </View>

      <Card className="mt-6">
        {BENEFITS.map((item, index) => {
          const Icon = item.icon;
          return (
            <View key={item.title} className={`flex-row items-center gap-3 py-3 ${index > 0 ? 'border-t border-[#E1E7EA]' : ''}`}>
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#E3EFF1]">
                <Icon size={20} color="#1A4A57" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-extrabold text-[#102A32]">{item.title}</Text>
                <Text className="mt-0.5 text-[13px] leading-[18px] text-[#5E6E76]">{item.detail}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {denied ? (
        <Text className="mt-4 text-center text-xs leading-[18px] text-[#B45309]">
          Bildirim izni verilmedi. Uygun ilanlardan haberdar olmak için istediğin zaman Telefon Ayarları &gt; KPSS Atama &gt; Bildirimler yolundan açabilirsin.
        </Text>
      ) : (
        <Text className="mt-4 text-center text-xs leading-[18px] text-[#7A8B94]">İstediğin zaman telefon ayarlarından kapatabilirsin.</Text>
      )}
    </Screen>
  );
}
