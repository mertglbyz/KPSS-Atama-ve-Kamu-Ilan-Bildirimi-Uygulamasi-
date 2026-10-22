import { Pressable, Text, View } from 'react-native';
import { applicationNotice, kpssLabel } from '@/lib/job-status';
import { formatDate, formatDay } from '@/lib/format';
import { sourceLabel } from '@/lib/source';
import type { JobPosition } from '@/types/domain';

export function JobNotice({ start, end }: { start: string | null; end: string }) {
  const notice = applicationNotice(start, end);
  if (!notice) return null;
  const tone = notice.tone === 'soon'
    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
    : notice.tone === 'closed'
      ? 'border-line bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
      : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950';
  return (
    <View className={`mt-3 rounded-2xl border px-3 py-3 ${tone}`}>
      <Text className="text-xs font-bold tracking-wide text-ink dark:text-slate-100">{notice.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-ink dark:text-slate-200">{notice.detail}</Text>
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
        <View key={chip} className="rounded-full bg-canvas px-3 py-1.5 dark:bg-slate-700">
          <Text className="text-xs font-medium text-ink dark:text-slate-100">{chip}</Text>
        </View>
      ))}
    </View>
  );
}

function range(min: number, max: number, unit: string): string | null {
  const hasMin = min > 0;
  const hasMax = max > 0;
  if (hasMin && hasMax) return `${min}–${max} ${unit}`;
  if (hasMin) return `${min} ${unit} ve üzeri`;
  if (hasMax) return `${max} ${unit} ve altı`;
  return null;
}

export function JobRequirements({ job }: { job: JobPosition }) {
  const rows: { icon: string; label: string; value: string }[] = [
    { icon: '👥', label: 'Kontenjan', value: String(job.quota) },
    { icon: '🎓', label: 'Eğitim', value: job.educationLevel },
    { icon: '📍', label: 'İller', value: job.cities.filter(Boolean).join(', ') || 'Belirtilmedi' },
  ];
  if (job.allowedDepartments.length) {
    rows.push({ icon: '📚', label: 'Bölüm', value: job.allowedDepartments.join(', ') });
  } else if (job.isGeneralDegree) {
    rows.push({ icon: '📚', label: 'Bölüm', value: 'Herhangi bir bölüm' });
  }
  const kpss = kpssLabel(job.requiresKpss, job.kpssType, job.minKpssScore || null);
  if (kpss) rows.push({ icon: '📝', label: 'KPSS', value: kpss });
  const age = job.maxAge > 0 && job.maxAge < 65 ? range(job.minAge, job.maxAge, 'yaş') : job.minAge > 18 ? range(job.minAge, 0, 'yaş') : null;
  if (age) rows.push({ icon: '🎂', label: 'Yaş', value: age });
  const male = range(job.minHeightMale, job.maxHeightMale, 'cm');
  const female = range(job.minHeightFemale, job.maxHeightFemale, 'cm');
  if (male || female) {
    rows.push({ icon: '📏', label: 'Boy', value: [male ? `Erkek ${male}` : '', female ? `Kadın ${female}` : ''].filter(Boolean).join(' · ') });
  }
  if (job.requiredLicenses.length) rows.push({ icon: '🚗', label: 'Ehliyet', value: job.requiredLicenses.join(', ') });
  if (job.requiresSecurityCard) rows.push({ icon: '🛡️', label: 'Güvenlik', value: 'Kimlik kartı gerekli' });
  if (job.requiredCertificates.length) rows.push({ icon: '📄', label: 'Belge', value: job.requiredCertificates.join(', ') });
  if (job.minSgkDays > 0) rows.push({ icon: '🏥', label: 'SGK', value: `En az ${job.minSgkDays} prim günü` });
  rows.push({ icon: '📅', label: 'Bitiş', value: formatDate(job.applicationEndDate) });
  rows.push({ icon: '🔗', label: 'Kaynak', value: sourceLabel(job.sourceName) });
  if (job.rawRequirementsText) rows.push({ icon: '📋', label: 'Şart', value: job.rawRequirementsText });

  return (
    <View className="gap-2.5">
      {rows.map((row) => (
        <View key={row.label} className="flex-row items-start gap-2">
          <Text className="w-6 text-base leading-5">{row.icon}</Text>
          <Text className="w-[72px] text-sm font-semibold leading-5 text-muted dark:text-slate-300">{row.label}</Text>
          <Text className="flex-1 text-sm leading-5 text-ink dark:text-white">{row.value}</Text>
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
