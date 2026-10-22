import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { StepFrame } from '@/components/StepFrame';
import { Chip, Choice, ErrorText, ToggleRow } from '@/components/ui';
import { LICENSE_CLASSES } from '@/constants/catalog';
import { advance } from '@/lib/flow';
import { useProfileStore } from '@/store/useProfileStore';

export default function StepDetails() {
  const router = useRouter();
  const editing = Boolean(useLocalSearchParams<{ edit?: string }>().edit);
  const draft = useProfileStore((state) => state.draft);
  const patch = useProfileStore((state) => state.patch);
  const toggleList = useProfileStore((state) => state.toggleList);
  const [error, setError] = useState<string | null>(null);

  function next() {
    if (draft.hasSecurityCard && draft.securityCardType === 'Yok') {
      setError('Güvenlik kartının türünü seç.');
      return;
    }
    void advance(router, '/(onboarding)/step5-documents', editing);
  }

  return (
    <StepFrame step={4} title="Ehliyet ve özel durumlar" subtitle="Bu bilgiler şoför, güvenlik ve engelli kadrolarını ayırır." onNext={next}>
      <Text className="mb-2 text-sm font-medium text-ink dark:text-slate-200">Ehliyet sınıfları</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {LICENSE_CLASSES.map((license) => (
          <Chip key={license} label={license} active={draft.driverLicenses.includes(license)} onPress={() => toggleList('driverLicenses', license)} />
        ))}
      </View>
      <ToggleRow label="Engelli durumu" detail="EKPSS veya engelli işçi kadroları" value={draft.isDisabled} onValueChange={(isDisabled) => patch({ isDisabled })} />
      <ToggleRow label="Güvenlik görevlisi kartı" value={draft.hasSecurityCard} onValueChange={(hasSecurityCard) => patch({ hasSecurityCard, securityCardType: hasSecurityCard ? 'Silahsız' : 'Yok' })} />
      {draft.hasSecurityCard ? (
        <Choice options={['Silahsız', 'Silahlı']} value={draft.securityCardType} onChange={(securityCardType) => patch({ securityCardType: securityCardType as 'Silahsız' | 'Silahlı' })} />
      ) : null}
      <ToggleRow label="Öğrencilik durumu" value={draft.isStudent} onValueChange={(isStudent) => patch({ isStudent })} />
      <ToggleRow label="Sigortalı çalışma geçmişi" detail="Açıksa bir sonraki adımda prim günü sorulur" value={draft.hasSgkHistory} onValueChange={(hasSgkHistory) => patch({ hasSgkHistory, sgkPrimDays: hasSgkHistory ? draft.sgkPrimDays : '' })} />
      <ErrorText text={error} />
    </StepFrame>
  );
}
