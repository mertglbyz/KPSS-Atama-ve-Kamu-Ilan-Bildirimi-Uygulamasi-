const MONTHS: Record<string, number> = {
  ocak: 1,
  subat: 2,
  mart: 3,
  nisan: 4,
  mayis: 5,
  haziran: 6,
  temmuz: 7,
  agustos: 8,
  eylul: 9,
  ekim: 10,
  kasim: 11,
  aralik: 12,
};

function fold(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function datesFromTitle(title: string, now = new Date()): { start?: string; end?: string } {
  const match = fold(title).match(/(\d{1,2})\s*(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)\s*[-–]\s*(\d{1,2})\s*(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)/);
  if (!match) return {};
  const year = now.getFullYear();
  const start = new Date(Date.UTC(year, MONTHS[match[2]] - 1, Number(match[1])));
  const end = new Date(Date.UTC(year, MONTHS[match[4]] - 1, Number(match[3]), 20, 59, 0));
  if (end < start) end.setUTCFullYear(year + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
