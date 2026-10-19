import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/env';
import { emptyDraft } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function RegisterScreen() {
  const router = useRouter();
  const setDemoSession = useAppStore((state) => state.setDemoSession);
  const replaceDraft = useProfileStore((state) => state.replaceDraft);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setInfo(null);
    if (!email.includes('@') || password.length < 6) {
      setError('Geçerli bir e-posta ve en az 6 karakterlik şifre gir.');
      return;
    }
    setPending(true);
    try {
      replaceDraft(emptyDraft());
      if (!isSupabaseConfigured || !supabase) {
        setDemoSession(`demo-${email.trim().toLowerCase()}`, email.trim());
        router.replace('/(onboarding)/step1-personal');
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;
      if (!data.session) {
        setInfo('Hesap açıldı. Supabase e-posta doğrulaması açıksa gelen kutunu kontrol et, sonra giriş yap.');
        return;
      }
      router.replace('/(onboarding)/step1-personal');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kayıt olunamadı');
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Title subtitle="Beş kısa adımda profilini kur. Gerçek ad zorunlu değil.">Hesap oluştur</Title>
      {isSupabaseConfigured ? null : <Banner text="Örnek moddasın. Kayıt yalnızca bu tarayıcıda veya cihazda saklanır." />}
      <Field label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="ornek@posta.com" />
      <Field label="Şifre" value={password} onChangeText={setPassword} placeholder="En az 6 karakter" />
      <ErrorText text={error} />
      {info ? <Banner text={info} /> : null}
      <Button label={pending ? 'Kaydediliyor' : 'Kayıt ol ve profile geç'} onPress={submit} disabled={pending} />
      <Link href="/(auth)/login" className="mt-5">
        <Text className="text-center font-semibold text-brand-700">Zaten hesabım var</Text>
      </Link>
    </Screen>
  );
}
