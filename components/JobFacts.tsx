import { Pressable, Text, View } from 'react-native';
import { applicationNotice, kpssLabel } from '@/lib/job-status';
import { formatDay } from '@/lib/format';

export function JobNotice({ start, end }: { start: string | null; end: string }) {
  const notice = applicationNotice(start, end);
  if (!notice) return null;
  const tone = notice.tone === 'soon' ? 'border-red-200 bg-red-50' : notice.tone === 'closed' ? 'border-line bg-slate-100' : 'border-amber-200 bg-amber-50';
  return (
    <View className={`mt-3 rounded-2xl border px-3 py-3 ${tone}`}>
      <Text className="text-xs font-bold tracking-wide text-ink">{notice.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-ink">{notice.detail}</Text>
    </View>
  );
}

export function JobChips({
  end,
  education,
  quota,
  requiresKpss,
  kpssType,
  minKpssScore,
}: {
  end: string;
  education: string;
  quota: number;
  requiresKpss: boolean | null;
  kpssType: string | null;
  minKpssScore: number | null;
}) {
  const kpss = kpssLabel(requiresKpss, kpssType, minKpssScore);
  const chips = [formatDay(end), education, `${quota} kadro`, kpss].filter(Boolean) as string[];
  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {chips.map((chip) => (
        <View key={chip} className="rounded-full bg-canvas px-3 py-1.5 dark:bg-slate-800">
          <Text className="text-xs font-medium text-ink dark:text-slate-100">{chip}</Text>
        </View>
      ))}
    </View>
  );
}

export function CardActions({
  saved,
  hidden,
  onSave,
  onHide,
  onOpen,
}: {
  saved: boolean;
  hidden: boolean;
  onSave: () => void;
  onHide: () => void;
  onOpen: () => void;
}) {
  return (
    <View className="mt-3 flex-row gap-2">
      <Pressable accessibilityRole="button" onPress={onHide} className="flex-1 items-center rounded-2xl border border-line py-3 dark:border-slate-700">
        <Text className="text-sm font-semibold text-ink dark:text-white">{hidden ? 'Gizlendi' : 'Gizle'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onSave} className="flex-1 items-center rounded-2xl border border-line py-3 dark:border-slate-700">
        <Text className="text-sm font-semibold text-ink dark:text-white">{saved ? 'Kayıtlı' : 'Kaydet'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpen} className="flex-1 items-center rounded-2xl bg-brand-700 py-3">
        <Text className="text-sm font-semibold text-white">Detay</Text>
      </Pressable>
    </View>
  );
}
