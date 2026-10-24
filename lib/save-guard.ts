import { Alert } from 'react-native';
import { fetchPosition } from '@/lib/data';
import { evaluatePosition } from '@/lib/match';
import { toMatchProfile } from '@/lib/profile';
import type { ProfileDraft } from '@/types/domain';

export type SaveCheck = { ok: true } | { ok: false; message: string };

/**
 * Bir ilan yalnızca kullanıcının profiliyle tam uyumluysa kaydedilebilir.
 * Kayıttan çıkarma her zaman serbesttir; bu kontrol sadece yeni kayıtlar için çağrılır.
 */
export async function checkSaveEligibility(userId: string | null, positionId: string, draft: ProfileDraft, premium: boolean): Promise<SaveCheck> {
  try {
    const job = await fetchPosition(userId ?? 'demo', positionId, draft, premium);
    if (!job) return { ok: false, message: 'İlan bilgisi alınamadığı için şu an kaydedilemedi. Lütfen tekrar dene.' };
    const verdict = evaluatePosition(toMatchProfile(draft), job);
    if (verdict.matched) return { ok: true };
    const gaps = verdict.gaps.slice(0, 4).join(', ');
    return {
      ok: false,
      message: `Bu ilan profiline uygun olmadığı için kaydedilemez.${gaps ? `\n\nUyuşmayan şartlar: ${gaps}.` : ''}\n\nYalnızca profiline uygun ilanları kaydedebilirsin.`,
    };
  } catch {
    return { ok: false, message: 'İlan şartları kontrol edilemedi. Bağlantını kontrol edip tekrar dene.' };
  }
}

export function showSaveBlocked(message: string) {
  Alert.alert('İlan kaydedilemedi', message, [{ text: 'Tamam' }]);
}
