export function parseScore(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function formatScore(value: number): string {
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 36e5;
}

export function isWithin48Hours(iso: string): boolean {
  const hours = hoursUntil(iso);
  return hours >= 0 && hours <= 48;
}

export function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return 'K';
  return clean.slice(0, 1).toLocaleUpperCase('tr-TR');
}
