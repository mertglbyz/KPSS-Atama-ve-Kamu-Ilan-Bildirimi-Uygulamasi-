import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

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

const MONTHS = 'Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık';

function encodeFragment(value: string): string {
  return encodeURIComponent(value).replace(/-/g, '%2D');
}

function dayFromDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  if (!day || !month) return '';
  return `${day} ${month.charAt(0).toLocaleUpperCase('tr-TR')}${month.slice(1).toLocaleLowerCase('tr-TR')}`;
}

function kamuilanTarget(title: string, institution: string, startDate?: string | null): { day: string; job: string } {
  const range = title.match(new RegExp(`(\\d{1,2})\\s*(${MONTHS})\\s*[-–—]\\s*(\\d{1,2})\\s*(${MONTHS})`, 'i'));
  let job = title;
  if (range) job = job.replace(range[0], ' ');
  if (institution && institution !== 'Kamu kurumu') {
    const escaped = institution
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+');
    job = job.replace(new RegExp(escaped, 'i'), ' ');
  }
  job = job.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR');
  const day = range
    ? `${range[1]} ${range[2].charAt(0).toLocaleUpperCase('tr-TR')}${range[2].slice(1).toLocaleLowerCase('tr-TR')}`
    : dayFromDate(startDate);
  return { day, job };
}

export function officialPageUrl(
  sourceName: string | null,
  sourceUrl: string | null,
  title?: string | null,
  institution?: string | null,
  startDate?: string | null,
): string | null {
  const onKamuilan = sourceName === 'kamuilan' || Boolean(sourceUrl && /kamuilan\.sbb\.gov\.tr/i.test(sourceUrl));
  if (!onKamuilan) return sourceUrl;
  const { day, job } = kamuilanTarget(title ?? '', institution ?? '', startDate);
  if (day && job) {
    return `https://kamuilan.sbb.gov.tr/#:~:text=${encodeFragment(`${job} ( ${day}`)}`;
  }
  if (job) return `https://kamuilan.sbb.gov.tr/#:~:text=${encodeFragment(job)}`;
  if (day) return `https://kamuilan.sbb.gov.tr/#:~:text=${encodeFragment(day)}`;
  return 'https://kamuilan.sbb.gov.tr/#nav2';
}

export async function openOfficialSource(
  sourceName: string | null,
  sourceUrl: string | null,
  title?: string | null,
  institution?: string | null,
  startDate?: string | null,
): Promise<boolean> {
  const url = officialPageUrl(sourceName, sourceUrl, title, institution, startDate);
  if (!url) return false;
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return true;
  }
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL(url.split('#')[0]);
    }
  }
  return true;
}
