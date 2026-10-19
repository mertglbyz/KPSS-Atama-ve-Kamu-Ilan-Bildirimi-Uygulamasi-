import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { AOF_SUGGESTIONS } from '@/constants/catalog';
import { useProfileStore } from '@/store/useProfileStore';

export default function SecondUniversityTool() {
  const department = useProfileStore((state) => state.draft.educations[0]?.department);
  const suggestions = (department && AOF_SUGGESTIONS[department]) || ['İşletme', 'Kamu Yönetimi', 'Halkla İlişkiler ve Tanıtım'];
  return (
    <Screen>
      <Stack.Screen options={{ title: 'İkinci üniversite' }} />
      <Text className="mb-3 text-sm text-muted">{department || 'Bölümün'} için sınavsız açıköğretim önerileri. Kontenjan ve atama oranını tercih dönemi öncesi ÖSYM kılavuzundan doğrula.</Text>
      {suggestions.map((item) => (
        <Card key={item} className="mb-3">
          <Text className="font-semibold text-ink dark:text-white">{item}</Text>
          <Text className="mt-1 text-sm text-muted">AÖF, ATA-AÖF veya AUZEF programlarında ara.</Text>
        </Card>
      ))}
    </Screen>
  );
}
