export const CERTIFICATE_GROUPS = [
  {
    title: 'MEB onaylı belgeler',
    items: [
      'Bilgisayar İşletmenliği',
      'Bilgisayar Operatörlüğü',
      'Daktilografi',
      'Kalorifer Ateşçiliği',
      'Kaynakçılık',
      'Aşçılık',
      'Pastacılık',
      'Elektrik Tesisatçılığı',
      'Sıhhi Tesisatçılık',
    ],
  },
  {
    title: 'Ulaştırma belgeleri',
    items: ['SRC 1', 'SRC 2', 'SRC 3', 'SRC 4', 'SRC 5', 'Psikoteknik', 'ADR', 'İş Makinesi Operatörlüğü'],
  },
  {
    title: 'Sağlık belgeleri',
    items: ['İlk Yardım', 'Hijyen Eğitimi'],
  },
  {
    title: 'Mesleki belgeler',
    items: [
      'İş Güvenliği Uzmanlığı A',
      'İş Güvenliği Uzmanlığı B',
      'İş Güvenliği Uzmanlığı C',
      'Mesleki Yeterlilik Belgesi',
      'Pedagojik Formasyon',
      'Hafızlık',
    ],
  },
] as const;

export const CERTIFICATES = CERTIFICATE_GROUPS.flatMap((group) => [...group.items]);

const ALIASES: { name: string; keys: string[] }[] = [
  { name: 'Bilgisayar İşletmenliği', keys: ['bilgisayar isletmenligi', 'bilgisayar isletmeni'] },
  { name: 'Bilgisayar Operatörlüğü', keys: ['bilgisayar operatorlugu', 'bilgisayar operatoru'] },
  { name: 'Daktilografi', keys: ['daktilografi', 'daktilo'] },
  { name: 'Kalorifer Ateşçiliği', keys: ['kalorifer atesciligi', 'kalorifer atescisi'] },
  { name: 'Kaynakçılık', keys: ['kaynakcilik', 'kaynakci'] },
  { name: 'Aşçılık', keys: ['ascilik', 'asci belgesi'] },
  { name: 'Pastacılık', keys: ['pastacilik'] },
  { name: 'Elektrik Tesisatçılığı', keys: ['elektrik tesisatciligi', 'elektrik tesisati'] },
  { name: 'Sıhhi Tesisatçılık', keys: ['sihhi tesisatcilik', 'sihhi tesisat'] },
  { name: 'SRC 1', keys: ['src1', 'src 1'] },
  { name: 'SRC 2', keys: ['src2', 'src 2'] },
  { name: 'SRC 3', keys: ['src3', 'src 3'] },
  { name: 'SRC 4', keys: ['src4', 'src 4'] },
  { name: 'SRC 5', keys: ['src5', 'src 5'] },
  { name: 'Psikoteknik', keys: ['psikoteknik'] },
  { name: 'ADR', keys: ['adr', 'tehlikeli madde'] },
  { name: 'İş Makinesi Operatörlüğü', keys: ['is makinesi operatorlugu', 'is makinesi operator', 'operator belgesi'] },
  { name: 'İlk Yardım', keys: ['ilk yardim'] },
  { name: 'Hijyen Eğitimi', keys: ['hijyen'] },
  { name: 'İş Güvenliği Uzmanlığı A', keys: ['is guvenligi uzmanligi a', 'a sinifi is guvenligi'] },
  { name: 'İş Güvenliği Uzmanlığı B', keys: ['is guvenligi uzmanligi b', 'b sinifi is guvenligi'] },
  { name: 'İş Güvenliği Uzmanlığı C', keys: ['is guvenligi uzmanligi c', 'c sinifi is guvenligi'] },
  { name: 'Mesleki Yeterlilik Belgesi', keys: ['mesleki yeterlilik', 'myk'] },
  { name: 'Pedagojik Formasyon', keys: ['pedagojik formasyon'] },
  { name: 'Hafızlık', keys: ['hafizlik', 'hafiz'] },
];

function fold(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasKey(folded: string, key: string) {
  const padded = ` ${folded} `;
  if (padded.includes(` ${key} `)) return true;
  if (!key.includes(' ')) return false;
  return folded.replace(/ /g, '') === key.replace(/ /g, '');
}

export function canonicalCertificate(value: string): string | null {
  const folded = fold(value);
  if (!folded) return null;
  const hit = ALIASES.find((entry) => entry.keys.some((key) => hasKey(folded, key)));
  return hit?.name ?? null;
}

export function certificateCovers(owned: string, required: string) {
  const left = canonicalCertificate(owned);
  const right = canonicalCertificate(required);
  if (left && right) return left === right;
  return fold(owned) !== '' && fold(owned) === fold(required);
}

export function normalizeCertificateList(values: string[]) {
  const names = new Set<string>();
  for (const value of values) {
    const canonical = canonicalCertificate(value);
    if (canonical) names.add(canonical);
    else if (value.trim()) names.add(value.trim());
  }
  return [...names];
}
