import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export default function LoginScreen() {
  const router = useRouter();
  const setDemoSession = useAppStore((state) => state.setDemoSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    if (!email.includes('@') || password.length < 6) {
      setError('Geçerli bir e-posta ve en az 6 karakterlik şifre gir.');
      return;
    }
    setPending(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setDemoSession(`demo-${email.trim().toLowerCase()}`, email.trim());
        router.replace('/');
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      router.replace('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Giriş yapılamadı');
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <Title subtitle="Profiline uyan memur, sözleşmeli ve işçi ilanları.">KPSS Atama</Title>
      {isSupabaseConfigured ? null : <Banner text="Supabase anahtarı yok. Giriş bu cihazda örnek modda açılır; ilanlar örnek veridir." />}
      <Field label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="ornek@posta.com" />
      <Field label="Şifre" value={password} onChangeText={setPassword} placeholder="En az 6 karakter" />
      <ErrorText text={error} />
      <Button label={pending ? 'Giriş yapılıyor' : 'Giriş yap'} onPress={submit} disabled={pending} />
      <Link href="/(auth)/register" className="mt-5 text-center">
        <Text className="text-center font-semibold text-brand-700">Hesabın yoksa kayıt ol</Text>
      </Link>
    </Screen>
  );
}
