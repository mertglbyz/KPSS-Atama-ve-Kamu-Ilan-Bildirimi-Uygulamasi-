import { formatDay } from '@/lib/format';

export type ApplicationNotice = {
  tone: 'wait' | 'soon' | 'closed';
  title: string;
  detail: string;
};

export function applicationNotice(start: string | null, end: string, now = Date.now()): ApplicationNotice | null {
  const startTime = start ? new Date(start).getTime() : null;
  const endTime = new Date(end).getTime();
  if (startTime && startTime > now) {
    return {
      tone: 'wait',
      title: 'Başvuru henüz başlamadı',
      detail: `Başvurular ${formatDay(start!)} tarihinde açılacak.`,
    };
  }
  if (endTime < now) {
    return { tone: 'closed', title: 'Başvuru kapandı', detail: `Son tarih ${formatDay(end)} idi.` };
  }
  const days = Math.ceil((endTime - now) / 864e5);
  if (days <= 3) {
    return {
      tone: 'soon',
      title: days <= 1 ? 'Son gün' : `Son ${days} gün`,
      detail: `Başvuru ${formatDay(end)} tarihinde bitiyor.`,
    };
  }
  return null;
}

export function kpssLabel(requiresKpss: boolean | null, kpssType: string | null, minScore: number | null): string | null {
  if (requiresKpss == null && !kpssType && minScore == null) return null;
  if (requiresKpss === false) return 'KPSS şartsız';
  if (minScore && minScore > 0) return `KPSS ${minScore}${kpssType ? ` ${kpssType}` : ''}+`;
  if (kpssType) return `KPSS ${kpssType}`;
  return 'KPSS şartlı';
}
