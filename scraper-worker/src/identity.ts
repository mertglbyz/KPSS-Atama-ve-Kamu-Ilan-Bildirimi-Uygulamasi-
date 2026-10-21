const GENERIC = new Set([
  'alim', 'ilan', 'ilani', 'alacak', 'personel', 'kadro', 'yili', 'sayili', 'genel',
  'mudurlugu', 'mudurlugunden', 'baskanligi', 'baskanligindan', 'rektorlugu', 'rektorlugunden',
  'sekreterligi', 'kurumu', 'kurumundan', 'dairesi', 'bakanligi', 'bakanligindan',
  've', 'ile', 'icin', 'den', 'dan', 'nin', 'the', 'bir', 'olan',
]);

export function fold(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return fold(value)
    .split(' ')
    .filter((word) => word.length > 2 && !GENERIC.has(word) && !/^\d+$/.test(word));
}

function institutionKey(name: string): string {
  return tokens(name).slice(0, 4).join(' ');
}

export function sameAnnouncement(
  left: { institutionName: string; title: string },
  right: { institutionName: string; title: string },
): boolean {
  const leftInstitution = institutionKey(left.institutionName);
  const rightInstitution = institutionKey(right.institutionName);
  const institutionMatches = Boolean(leftInstitution && rightInstitution) && (
    leftInstitution === rightInstitution
    || leftInstitution.includes(rightInstitution)
    || rightInstitution.includes(leftInstitution)
  );
  if (!institutionMatches) return false;
  const institutionWords = new Set([...tokens(left.institutionName), ...tokens(right.institutionName)]);
  const leftTokens = new Set(tokens(left.title).filter((word) => !institutionWords.has(word)));
  const rightTokens = new Set(tokens(right.title).filter((word) => !institutionWords.has(word)));
  let shared = 0;
  for (const word of leftTokens) if (rightTokens.has(word)) shared += 1;
  const qualifiers = new Set(['surekli', 'gecici', 'engelli', 'hukumlu', 'sozlesmeli', 'akademik', 'kadrolu']);
  const leftQualifier = [...leftTokens].find((word) => qualifiers.has(word));
  const rightQualifier = [...rightTokens].find((word) => qualifiers.has(word));
  if (leftQualifier !== rightQualifier) return false;
  const roleWords = new Set(['isci', 'memur', 'uzman', 'hemsire', 'zabita', 'denetci', 'ogretmen', 'sofor', 'avukat', 'muhendis', 'teknisyen', 'hizmetli', 'sondor']);
  if (shared >= 2) return true;
  return [...leftTokens].some((word) => rightTokens.has(word) && roleWords.has(word));
}

export function fingerprint(institutionName: string, title: string): string {
  return `${institutionKey(institutionName)}|${tokens(title).slice(0, 8).join(' ')}`.slice(0, 180);
}
