import { saveProfile } from '@/lib/data';
import { useAppStore } from '@/store/useAppStore';
import { useProfileStore } from '@/store/useProfileStore';

type NextStep =
  | '/(onboarding)/step2-education'
  | '/(onboarding)/step3-exams'
  | '/(onboarding)/step4-details'
  | '/(onboarding)/step5-documents';

type StepRouter = {
  push: (href: NextStep) => void;
  replace: (href: '/(tabs)/profile') => void;
};

export async function advance(router: StepRouter, next: NextStep, editing: boolean) {
  if (!editing) {
    router.push(next);
    return;
  }
  const { mode, userId } = useAppStore.getState();
  const draft = useProfileStore.getState().draft;
  if (mode === 'live' && userId) await saveProfile(userId, draft);
  router.replace('/(tabs)/profile');
}
