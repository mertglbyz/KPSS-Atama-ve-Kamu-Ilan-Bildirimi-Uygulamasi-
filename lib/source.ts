import { Linking } from 'react-native';

const NAMES: Record<string, string> = {
  kamuilan: 'kamuilan.sbb.gov.tr',
  kariyer_kapisi: 'Kariyer Kapısı',
  ilan_gov_tr: 'ilan.gov.tr',
  yerel_yonetimler: 'Yerel Yönetimler',
};

export function sourceLabel(sourceName: string | null): string {
  if (!sourceName) return 'Resmi ilan';
  return NAMES[sourceName] ?? sourceName;
}

export async function openOfficialSource(url: string | null): Promise<boolean> {
  if (!url) return false;
  await Linking.openURL(url);
  return true;
}
