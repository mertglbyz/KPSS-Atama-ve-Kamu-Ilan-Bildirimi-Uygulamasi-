import { Stack } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Button, ErrorText, Screen } from '@/components/ui';
import { useProfileStore } from '@/store/useProfileStore';

export default function CvTool() {
  const draft = useProfileStore((state) => state.draft);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    const html = `<html><body style="font-family:Arial;padding:32px;color:#0f172a">
      <h1>${draft.nickname}</h1>
      <p>${draft.age} yaş · ${draft.gender} · ${draft.city}</p>
      <h2>Eğitim</h2>
      <ul>${draft.educations.map((item) => `<li>${item.level} — ${item.department}</li>`).join('')}</ul>
      <h2>Sınav</h2>
      <p>KPSS: ${draft.hasKpss ? `${draft.kpssType} ${draft.kpssScore}` : 'Yok'}</p>
      <p>YDS: ${draft.ydsScore || '—'} · ALES: ${draft.alesScore || '—'}</p>
      <h2>Belgeler</h2>
      <p>Ehliyet: ${draft.driverLicenses.join(', ') || '—'} · SGK: ${draft.sgkPrimDays || '0'} gün</p>
      <p>Sertifikalar: ${draft.certificates.join(', ') || '—'}</p>
    </body></html>`;
    try {
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'PDF oluşturulamadı');
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'CV oluştur' }} />
      <Button label="Özgeçmiş PDF'i oluştur" onPress={create} />
      <ErrorText text={error} />
    </Screen>
  );
}
