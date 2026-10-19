import * as cheerio from 'cheerio';
import type { DiscoveredAd } from './types';

const HEADERS = {
  'User-Agent': 'KPSSAtamaBot/1.0 (kamu ilan takibi; iletisim: destek)',
  Accept: 'text/html,application/json',
};

async function fetchText(url: string): Promise<string | null> {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.text();
}

export async function discoverIlanGov(): Promise<DiscoveredAd[]> {
  const response = await fetch('https://www.ilan.gov.tr/api/api/services/app/Ad/AdsByFilter', {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json',
      'X-Request-Origin': 'IGT-UI',
      Origin: 'https://www.ilan.gov.tr',
      Referer: 'https://www.ilan.gov.tr/',
    },
    body: JSON.stringify({
      keys: { txv: [73], ats: [5], currentPage: [1] },
      sorting: 'publish_time desc',
      skipCount: 0,
      maxResultCount: 20,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`ilan.gov.tr ${response.status}`);
  const payload = (await response.json()) as { result?: { items?: Record<string, unknown>[] }; items?: Record<string, unknown>[] };
  const items = payload.result?.items ?? payload.items ?? [];
  return items.slice(0, 20).map((item) => {
    const id = String(item.id ?? item.adId ?? '');
    return {
      sourceName: 'ilan_gov_tr',
      sourceUrl: id ? `https://www.ilan.gov.tr/ilan/${id}` : String(item.url ?? ''),
      title: String(item.title ?? item.adTitle ?? 'Personel ilanı'),
      institutionName: String(item.advertiserName ?? item.customerName ?? item.publisherName ?? 'Kurum'),
      text: JSON.stringify(item).slice(0, 8000),
    };
  }).filter((item) => item.sourceUrl.startsWith('http'));
}

const PAGES = [
  { sourceName: 'kariyer_kapisi', url: 'https://isealimkariyerkapisi.cbiko.gov.tr/' },
  { sourceName: 'kamuilan', url: 'https://kamuilan.sbb.gov.tr/' },
  { sourceName: 'yerel_yonetimler', url: 'https://yerelyonetimler.csb.gov.tr/' },
  { sourceName: 'iskur', url: 'https://www.iskur.gov.tr/' },
];

export async function discoverHtmlSources(): Promise<DiscoveredAd[]> {
  const found: DiscoveredAd[] = [];
  for (const page of PAGES) {
    const html = await fetchText(page.url);
    if (!html) continue;
    const $ = cheerio.load(html);
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const label = $(element).text().replace(/\s+/g, ' ').trim();
      if (!href || !label) return;
      const absolute = new URL(href, page.url).toString();
      const interesting = /personel|ilan|alım|alim|kadro|işçi|isci|memur/i.test(`${label} ${absolute}`);
      if (!interesting) return;
      found.push({
        sourceName: page.sourceName,
        sourceUrl: absolute,
        title: label.slice(0, 180),
        institutionName: page.sourceName,
        text: label,
        pdfUrl: absolute.toLowerCase().includes('.pdf') ? absolute : undefined,
      });
    });
  }
  const unique = new Map<string, DiscoveredAd>();
  for (const ad of found) unique.set(ad.sourceUrl, ad);
  return [...unique.values()].slice(0, 30);
}

export async function downloadPdf(url: string): Promise<Buffer | undefined> {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
  if (!response.ok) return undefined;
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('pdf') && !url.toLowerCase().includes('.pdf')) return undefined;
  return Buffer.from(await response.arrayBuffer());
}
