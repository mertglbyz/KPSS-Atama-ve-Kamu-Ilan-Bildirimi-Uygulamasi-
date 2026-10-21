const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû';

export function nameText(value: string): string {
  return value.replace(new RegExp(`[^${LETTERS}\\s]`, 'g'), '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, 32);
}

export function integerText(value: string, maxDigits: number, maxValue?: number): string {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);
  if (maxValue != null && digits !== '' && Number(digits) > maxValue) return digits.slice(0, -1);
  return digits;
}

export function scoreText(value: string): string {
  const cleaned = value.replace(/[^\d,.]/g, '').replace(/\./g, ',');
  const comma = cleaned.indexOf(',');
  const wholeRaw = (comma === -1 ? cleaned : cleaned.slice(0, comma)).replace(/^0+(?=\d)/, '');
  const whole = wholeRaw.slice(0, 3);
  if (whole !== '' && Number(whole) > 100) return '100';
  if (comma === -1) return whole;
  if (whole === '100') return '100';
  const fraction = cleaned.slice(comma + 1).replace(/\D/g, '').slice(0, 4);
  return `${whole},${fraction}`;
}

export function searchText(value: string): string {
  return value.replace(new RegExp(`[^${LETTERS}0-9\\s]`, 'g'), '').replace(/\s{2,}/g, ' ').slice(0, 60);
}

export function listQuery(value: string): string {
  return value.replace(new RegExp(`[^${LETTERS}\\s/'-]`, 'g'), '').replace(/\s{2,}/g, ' ').slice(0, 60);
}
