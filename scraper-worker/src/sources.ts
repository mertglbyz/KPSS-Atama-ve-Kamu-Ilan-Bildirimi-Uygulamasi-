import https from 'node:https';
import { URL } from 'node:url';
import * as cheerio from 'cheerio';
import { documentLinks, docxToText, rtfToText } from './documents';
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

const TEXT_LIMIT = 60000;
let kamuilanCookie = '';

function textOf(html: string, anchor = ''): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, header, footer, nav').remove();
  let text = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (anchor) {
    const at = text.toLocaleLowerCase('tr-TR').indexOf(anchor.toLocaleLowerCase('tr-TR').slice(0, 48));
    if (at > 0) text = text.slice(at);
  }
  return text.split(/duyurulara geri dön/i)[0].trim().slice(0, TEXT_LIMIT);
}

function cookiePair(headers: ResponseBody['headers']) {
  const raw = headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((item) => item.split(';')[0]).filter(Boolean).join('; ');
}

function isPdf(body: Buffer, url: string, contentType: string) {
  return contentType.includes('pdf') || body.subarray(0, 5).toString('utf8') === '%PDF-' || /\.pdf(\?|$)/i.test(url);
}

function plainNotice(value: string) {
  return value
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function yerelInstitution(title: string) {
  const cleaned = title
    .replace(/^\d{1,2}\s+\p{L}+\s+\d{4}\s+/u, '')
    .replace(/^(?:pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)\s+/iu, '')
    .replace(/\s*\.{2,}\s*$/u, '')
    .trim();
  const folded = cleaned.toLocaleLowerCase('tr-TR');
  const markers = ['belediye başkanlığı', 'belediyesi', 'bakanlığı', 'müdürlüğü'];
  for (const marker of markers) {
    const at = folded.indexOf(marker);
    if (at >= 0) return cleaned.slice(0, at + marker.length).replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  return cleaned.slice(0, 120) || 'Yerel yönetim';
}

async function kamuilanHome() {
  const response = await request('https://kamuilan.sbb.gov.tr/', { headers: HEADERS });
  if (response.status >= 400) throw new Error(`kamuilan.sbb.gov.tr ${response.status}`);
  const cookie = cookiePair(response.headers);
  if (cookie) kamuilanCookie = cookie;
  return response.body.toString('utf8');
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
  isKiwiAd?: boolean;
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
        externalId: item.id ? String(item.id) : undefined,
        kiwi: item.isKiwiAd,
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
  const html = await kamuilanHome();
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
    const title = $(element).text().replace(/\s+/g, ' ').replace(/\s*\.{2,}\s*$/u, '').trim();
    if (!href || !title) return;
    if (!/al[ıi]m|memur|personel|zabıta|zabita|sözleşmeli|sozlesmeli/i.test(title)) return;
    const sourceUrl = new URL(href, 'https://yerelyonetimler.csb.gov.tr/').toString();
    if (ads.some((item) => item.sourceUrl === sourceUrl)) return;
    ads.push({
      sourceName: 'yerel_yonetimler',
      sourceUrl,
      title: title.slice(0, 180),
      institutionName: yerelInstitution(title),
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
    if (!item.guid) return [];
    const sourceUrl = `https://kariyerkapisi.gov.tr/IlanDetay?i=${item.guid}`;
    return [{
      sourceName: 'kariyer_kapisi',
      sourceUrl,
      externalId: item.guid,
      title: String(item.ilanBaslik || 'Kariyer Kapısı ilanı').slice(0, 180),
      institutionName: String(item.kurumAdi || 'Kamu kurumu'),
      text: [
        item.kurumAdi,
        item.birimAdi,
        item.ilanBaslik,
        item.ilanTuru ? `İlan türü: ${item.ilanTuru}` : '',
        item.basTarih ? `Başlangıç: ${item.basTarih}` : '',
        item.bitTarih ? `Bitiş: ${item.bitTarih}` : '',
        item.basvuruLinki ? `Başvuru: ${item.basvuruLinki}` : '',
      ].filter(Boolean).join('\n'),
    }];
  });
}

async function readAttachment(url: string, cookie?: string) {
  const response = await request(url, {
    headers: {
      ...HEADERS,
      Accept: '*/*',
      ...(cookie ? { Cookie: cookie, Referer: 'https://kamuilan.sbb.gov.tr/' } : {}),
    },
  });
  if (response.status >= 400) return {};
  const type = String(response.headers['content-type'] ?? '');
  if (isPdf(response.body, url, type)) return { pdf: response.body, pdfUrl: url };
  if (/\.docx(\?|$)/i.test(url) || type.includes('wordprocessingml')) {
    const text = await docxToText(response.body);
    return text ? { text } : {};
  }
  if (/\.rtf(\?|$)/i.test(url) || type.includes('rtf') || response.body.subarray(0, 5).toString('latin1').includes('\\rtf')) {
    const text = rtfToText(response.body);
    return text ? { text } : {};
  }
  return {};
}

async function withDocuments(ad: DiscoveredAd, html: string, cookie?: string): Promise<DiscoveredAd> {
  const article = textOf(html, ad.title);
  const files: string[] = [];
  let pdf = ad.pdf;
  let pdfUrl = ad.pdfUrl;
  for (const link of documentLinks(html, ad.sourceUrl)) {
    const file = await readAttachment(link, cookie);
    if (file.text) files.push(file.text);
    if (file.pdf && !pdf) {
      pdf = file.pdf;
      pdfUrl = file.pdfUrl;
    }
  }
  const fileText = files.join('\n\n');
  const text = (fileText.length > 400 ? fileText : [article || ad.text, fileText].filter(Boolean).join('\n\n')).slice(0, TEXT_LIMIT);
  if (/aradığınız sayfa bulunamadı/i.test(text) && text.length < 800) return ad;
  return { ...ad, text, pdf, pdfUrl };
}

async function enrichKamuilan(ad: DiscoveredAd): Promise<DiscoveredAd> {
  if (!kamuilanCookie) await kamuilanHome();
  const response = await request(ad.sourceUrl, {
    headers: {
      ...HEADERS,
      Cookie: kamuilanCookie,
      Referer: 'https://kamuilan.sbb.gov.tr/',
    },
  });
  if (response.status >= 400) return ad;
  const type = String(response.headers['content-type'] ?? '');
  if (isPdf(response.body, ad.sourceUrl, type)) return { ...ad, pdf: response.body };
  return withDocuments(ad, response.body.toString('utf8'), kamuilanCookie);
}

async function enrichKariyer(ad: DiscoveredAd): Promise<DiscoveredAd> {
  const guid = ad.externalId || ad.sourceUrl.match(/[?&]i=([^&]+)/)?.[1];
  if (!guid) return ad;
  const headers = {
    ...HEADERS,
    'Content-Type': 'application/json',
    Origin: 'https://kariyerkapisi.gov.tr',
    Referer: ad.sourceUrl,
  };
  const preview = await request('https://api.kariyerkapisi.gov.tr/api/ilan/GetIlanPreviewPublic', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ilanGuid: guid }),
  });
  if (preview.status >= 400) return ad;
  const detail = JSON.parse(preview.body.toString('utf8')) as {
    kurumAdi?: string;
    ilanBaslik?: string;
    ilanMetni?: string;
    basTarih?: string;
    bitTarih?: string;
  };
  const parts = [plainNotice(detail.ilanMetni || '')];
  const alt = await request('https://api.kariyerkapisi.gov.tr/api/altilan/GetAltIlanInfoByIlanIdPublic', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ilanGuid: guid }),
  });
  if (alt.status < 400) {
    try {
      const rows = JSON.parse(alt.body.toString('utf8')) as {
        unvan?: string;
        kontenjanList?: { il?: string; kontenjan?: number }[];
      }[];
      const summary = (Array.isArray(rows) ? rows : []).flatMap((row) => {
        const quotas = (row.kontenjanList ?? [])
          .map((item) => [item.il, item.kontenjan].filter(Boolean).join(' '))
          .filter(Boolean);
        return row.unvan ? [`${row.unvan}: ${quotas.join(', ') || 'kadro belirtilmemiş'}`] : [];
      });
      if (summary.length) parts.push(`Kadro özeti:\n${summary.join('\n')}`);
    } catch {
      // Kadro özeti gelmezse ilan metni yine de kullanılır.
    }
  }
  const text = parts.filter(Boolean).join('\n\n').slice(0, TEXT_LIMIT);
  if (text.length < 80) return ad;
  return {
    ...ad,
    institutionName: detail.kurumAdi || ad.institutionName,
    title: String(detail.ilanBaslik || ad.title).slice(0, 180),
    text,
  };
}

async function enrichIlanGov(ad: DiscoveredAd): Promise<DiscoveredAd> {
  const id = ad.externalId || ad.sourceUrl.match(/\/ilan\/(\d+)/)?.[1];
  if (!id) return ad;
  const response = await request(
    `https://www.ilan.gov.tr/api/api/services/app/AdDetail/GetAdDetail?id=${encodeURIComponent(id)}&isKiwiAd=${ad.kiwi ? 'true' : 'false'}`,
    {
      headers: {
        ...HEADERS,
        Accept: 'text/plain',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Request-Origin': 'IGT-UI',
        Origin: 'https://www.ilan.gov.tr',
        Referer: ad.sourceUrl,
      },
    },
  );
  if (response.status >= 400) return ad;
  const content = (JSON.parse(response.body.toString('utf8')) as { result?: { content?: string } }).result?.content ?? '';
  if (!content) return ad;
  return withDocuments(ad, content);
}

export async function enrichAd(ad: DiscoveredAd): Promise<DiscoveredAd> {
  try {
    if (ad.sourceName === 'kamuilan') return await enrichKamuilan(ad);
    if (ad.sourceName === 'kariyer_kapisi') return await enrichKariyer(ad);
    if (ad.sourceName === 'ilan_gov_tr') return await enrichIlanGov(ad);
    const html = await fetchText(ad.sourceUrl);
    return await withDocuments(ad, html);
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
