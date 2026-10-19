import JSZip from 'jszip';
import * as cheerio from 'cheerio';

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function docxToText(file: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) return '';
  return decodeXml(xml.replace(/<w:p[^>]*>/g, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function documentLinks(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const label = $(element).text();
    if (!href || !/\.(pdf|docx)(\?|$)/i.test(href)) return;
    if (!/ilan|metin|duyuru/i.test(`${href} ${label}`)) return;
    links.add(new URL(href, pageUrl).toString());
  });
  return [...links];
}
