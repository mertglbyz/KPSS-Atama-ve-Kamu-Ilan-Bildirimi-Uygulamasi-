import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { fetchCourses } from '@/lib/data';
import { useProfileStore } from '@/store/useProfileStore';

export default function CoursesTool() {
  const city = useProfileStore((state) => state.draft.city);
  const courses = useQuery({ queryKey: ['courses', city], queryFn: () => fetchCourses(city) });
  return (
    <Screen>
      <Stack.Screen options={{ title: 'İlinizdeki kurslar' }} />
      <Text className="mb-3 text-sm text-muted">{city || 'İl seçilmedi'} için örnek kurs rehberi. Canlı İSMEK ve halk eğitim akışı ayrıca bağlanır.</Text>
      {(courses.data ?? []).map((course) => (
        <Card key={course.id} className="mb-3">
          <Text className="text-xs font-semibold text-brand-700">{course.provider}</Text>
          <Text className="mt-1 font-semibold text-ink dark:text-white">{course.title}</Text>
          <Text className="mt-1 text-sm text-muted">{course.detail}</Text>
        </Card>
      ))}
      {!courses.data?.length ? <Text className="text-muted">Bu il için kayıtlı kurs yok.</Text> : null}
    </Screen>
  );
}
