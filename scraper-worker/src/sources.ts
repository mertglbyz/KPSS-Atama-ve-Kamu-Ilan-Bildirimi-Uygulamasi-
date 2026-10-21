import https from 'node:https';
import { URL } from 'node:url';
import * as cheerio from 'cheerio';
import { documentLinks, docxToText } from './documents';
import type { DiscoveredAd } from './types';

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json',
};

type ResponseBody = { status: number; headers: Record<string, string | string[] | undefined>; body: Buffer };

function requestOnce(url: string, init: { method?: string; body?: string; headers?: Record<string, string>; insecure?: boolean }): Promise<ResponseBody> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: init.method ?? 'GET',
        headers: init.headers,
        rejectUnauthorized: !init.insecure,
        timeout: 25000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error(`zaman aşımı ${url}`)));
    if (init.body) req.write(init.body);
    req.end();
  });
}

export async function request(url: string, init: { method?: string; body?: string; headers?: Record<string, string> } = {}, redirects = 0): Promise<ResponseBody> {
  let response: ResponseBody;
  try {
    response = await requestOnce(url, init);
  } catch (error) {
    const message = error instanceof Error ? `${error.message} ${String(error.cause ?? '')}` : String(error);
    if (!/certificate|UNABLE_TO_VERIFY|altname/i.test(message)) throw error;
    response = await requestOnce(url, { ...init, insecure: true });
  }
  const location = response.headers.location;
  if (response.status >= 300 && response.status < 400 && location && redirects < 4) {
    return request(new URL(Array.isArray(location) ? location[0] : location, url).toString(), init, redirects + 1);
  }
  return response;
}

async function fetchText(url: string): Promise<string> {
  const response = await request(url);
  if (response.status >= 400) throw new Error(`${url} ${response.status}`);
  return response.body.toString('utf8');
}

function textOf(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);
}

type IlanGovAd = {
  id?: string;
  adNo?: string;
  advertiserName?: string;
  title?: string;
  addressCityName?: string;
  publishStartDate?: string;
  urlStr?: string;
  values?: { key?: string; value?: string }[];
  adTypeFilters?: { key?: string; value?: string }[];
  adSourceName?: string;
};

async function ilanGovPage(page: number): Promise<{ total: number; ads: IlanGovAd[] }> {
  const pageSize = 12;
  const response = await request('https://www.ilan.gov.tr/api/api/services/app/Ad/AdsByFilter', {
    method: 'POST',
    headers: {
      ...HEADERS,
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Request-Origin': 'IGT-UI',
      Origin: 'https://www.ilan.gov.tr',
      Referer: 'https://www.ilan.gov.tr/ilan/kategori/8/kamu-akademik-personel',
    },
    body: JSON.stringify({
      keys: { txv: ['8'], currentPage: [String(page)] },
      skipCount: (page - 1) * pageSize,
      maxResultCount: pageSize,
    }),
  });
  if (response.status === 403) throw new Error('ilan.gov.tr otomatik isteği reddetti (403)');
  if (response.status >= 400) throw new Error(`ilan.gov.tr ${response.status}`);
  const payload = JSON.parse(response.body.toString('utf8')) as { result?: { numFound?: number; ads?: IlanGovAd[] } };
  return { total: payload.result?.numFound ?? 0, ads: payload.result?.ads ?? [] };
}

export async function discoverIlanGov(): Promise<DiscoveredAd[]> {
  const found: DiscoveredAd[] = [];
  const seen = new Set<string>();
  let total = 1;
  for (let page = 1; found.length < total && page <= 20; page += 1) {
    const batch = await ilanGovPage(page);
    total = batch.total;
    if (!batch.ads.length) break;
    for (const item of batch.ads) {
      const path = item.urlStr || (item.id ? `/ilan/${item.id}` : '');
      if (!path) continue;
      const sourceUrl = new URL(path, 'https://www.ilan.gov.tr').toString();
      if (seen.has(sourceUrl)) continue;
      seen.add(sourceUrl);
      const details = [...(item.values ?? []), ...(item.adTypeFilters ?? [])]
        .map((row) => `${row.key ?? ''}: ${row.value ?? ''}`.trim())
        .filter(Boolean);
      found.push({
        sourceName: 'ilan_gov_tr',
        sourceUrl,
        title: String(item.title || 'Kamu personel ilanı').slice(0, 180),
        institutionName: String(item.advertiserName || item.adSourceName || 'Kurum'),
        text: [
          item.advertiserName,
          item.title,
          item.adNo ? `İlan no: ${item.adNo}` : '',
          item.addressCityName ? `Şehir: ${item.addressCityName}` : '',
          item.publishStartDate ? `Yayın: ${item.publishStartDate}` : '',
          ...details,
        ].filter(Boolean).join('\n').slice(0, 8000),
      });
    }
  }
  return found;
}

export async function discoverKamuilan(): Promise<DiscoveredAd[]> {
  const html = await fetchText('https://kamuilan.sbb.gov.tr/');
  const $ = cheerio.load(html);
  const ads: DiscoveredAd[] = [];
  const seen = new Set<string>();
  $('a[href*="ilanDetay.aspx"]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    const sourceUrl = new URL(href, 'https://kamuilan.sbb.gov.tr/').toString();
    const inTimeline = $(element).closest('#nav2').length > 0;
    if (seen.has(sourceUrl) && !inTimeline) return;
    const card = $(element).closest('li, article, .card, tr').text().replace(/\s+/g, ' ').trim();
    const title = ($(element).text().replace(/\s+/g, ' ').trim() || card || 'Kamu personel ilanı')
      .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])(\d)/g, '$1 $2')
      .slice(0, 180);
    const institutionName = title.split(/\d/)[0]?.replace(/alacak.*/i, '').trim() || 'Kamu kurumu';
    const ad = {
      sourceName: 'kamuilan' as const,
      sourceUrl,
      title,
      institutionName,
      text: card || title,
    };
    if (seen.has(sourceUrl)) {
      const index = ads.findIndex((item) => item.sourceUrl === sourceUrl);
      if (index >= 0) ads[index] = ad;
      return;
    }
    seen.add(sourceUrl);
    ads.push(ad);
  });
  return ads;
}

export async function discoverYerelYonetimler(): Promise<DiscoveredAd[]> {
  const html = await fetchText('https://yerelyonetimler.csb.gov.tr/duyurular');
  const $ = cheerio.load(html);
  const ads: DiscoveredAd[] = [];
  $('a[href*="duyuru-"]').each((_, element) => {
    const href = $(element).attr('href');
    const title = $(element).text().replace(/\s+/g, ' ').trim();
    if (!href || !title) return;
    if (!/al[ıi]m|memur|personel|zabıta|zabita|sözleşmeli|sozlesmeli/i.test(title)) return;
    const sourceUrl = new URL(href, 'https://yerelyonetimler.csb.gov.tr/').toString();
    if (ads.some((item) => item.sourceUrl === sourceUrl)) return;
    ads.push({
      sourceName: 'yerel_yonetimler',
      sourceUrl,
      title: title.slice(0, 180),
      institutionName: 'Yerel yönetim',
      text: title,
    });
  });
  return ads;
}

type KariyerAd = {
  guid?: string;
  kurumAdi?: string;
  birimAdi?: string;
  ilanBaslik?: string;
  ilanTipi?: number;
  ilanTuru?: string;
  basTarih?: string;
  bitTarih?: string;
  basvuruLinki?: string;
};

export async function discoverKariyerKapisi(): Promise<DiscoveredAd[]> {
  const response = await request('https://api.kariyerkapisi.gov.tr/api/ilan/GetIseAlimPage', {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json',
      Origin: 'https://kariyerkapisi.gov.tr',
      Referer: 'https://kariyerkapisi.gov.tr/isealim',
    },
    body: JSON.stringify({ krM_ID: 0, searchText: '', il: '0', ilanTuru: '0' }),
  });
  if (response.status >= 400) throw new Error(`kariyerkapisi.gov.tr ${response.status}`);
  const payload = JSON.parse(response.body.toString('utf8')) as { searchIlan?: KariyerAd[] };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (payload.searchIlan ?? []).flatMap((item) => {
    const ends = item.bitTarih ? new Date(item.bitTarih) : null;
    if (ends && !Number.isNaN(ends.getTime()) && ends < today) return [];
    const sourceUrl = item.ilanTipi === 1 || !item.basvuruLinki
      ? `https://kariyerkapisi.gov.tr/IlanDetay?i=${item.guid}`
      : item.basvuruLinki;
    if (!sourceUrl.startsWith('http') || !item.guid) return [];
    return [{
      sourceName: 'kariyer_kapisi',
      sourceUrl,
      title: String(item.ilanBaslik || 'Kariyer Kapısı ilanı').slice(0, 180),
      institutionName: String(item.kurumAdi || 'Kamu kurumu'),
      text: [
        item.kurumAdi,
        item.birimAdi,
        item.ilanBaslik,
        item.ilanTuru ? `İlan türü: ${item.ilanTuru}` : '',
        item.basTarih ? `Başlangıç: ${item.basTarih}` : '',
        item.bitTarih ? `Bitiş: ${item.bitTarih}` : '',
      ].filter(Boolean).join('\n'),
    }];
  });
}

export async function enrichAd(ad: DiscoveredAd): Promise<DiscoveredAd> {
  if (ad.sourceName === 'ilan_gov_tr') return ad;
  try {
    const html = await fetchText(ad.sourceUrl);
    const text = textOf(html);
    const links = documentLinks(html, ad.sourceUrl);
    const parts = [text || ad.text];
    let pdfUrl = ad.pdfUrl;
    for (const link of links) {
      const file = await request(link);
      if (file.status >= 400) continue;
      if (/\.docx(\?|$)/i.test(link)) {
        const docx = await docxToText(file.body);
        if (docx) parts.push(docx);
      } else if (!pdfUrl) {
        pdfUrl = link;
      }
    }
    return { ...ad, text: parts.filter(Boolean).join('\n').slice(0, 20000), pdfUrl };
  } catch {
    return ad;
  }
}

export async function downloadPdf(url: string): Promise<Buffer | undefined> {
  const response = await request(url);
  if (response.status >= 400) return undefined;
  const type = String(response.headers['content-type'] ?? '');
  if (!type.includes('pdf') && !url.toLowerCase().includes('.pdf')) return undefined;
  return response.body;
}
