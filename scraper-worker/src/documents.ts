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

const SKIPPED_RTF_GROUPS = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'datastore',
  'themedata', 'xmlnstbl', 'latentstyles', 'listtable', 'listoverridetable',
  'rsidtbl', 'generator', 'header', 'footer', 'headerl', 'headerr', 'footerl', 'footerr',
]);

export function rtfToText(file: Buffer): string {
  const source = file.toString('latin1');
  if (!source.includes('\\rtf')) return '';
  const decoder = new TextDecoder('windows-1254');
  let text = '';
  let bytes: number[] = [];
  const stack: number[] = [];
  let skip = 0;
  let index = 0;
  const flush = () => {
    if (!skip && bytes.length) text += decoder.decode(Uint8Array.from(bytes));
    bytes = [];
  };
  while (index < source.length) {
    const char = source[index];
    if (char === '{') {
      flush();
      stack.push(skip);
      index += 1;
      continue;
    }
    if (char === '}') {
      flush();
      skip = stack.pop() ?? 0;
      index += 1;
      continue;
    }
    if (char === '\\') {
      const next = source[index + 1];
      if (next === '*') {
        skip += 1;
        index += 2;
        continue;
      }
      if (next === '\\' || next === '{' || next === '}') {
        if (!skip) bytes.push(next.charCodeAt(0));
        index += 2;
        continue;
      }
      if (source.startsWith("\\'", index)) {
        const code = Number.parseInt(source.slice(index + 2, index + 4), 16);
        if (!skip && Number.isFinite(code)) bytes.push(code);
        index += 4;
        continue;
      }
      if (next === 'u' && (source[index + 2] === '-' || /\d/.test(source[index + 2] ?? ''))) {
        flush();
        let cursor = index + 2;
        let sign = 1;
        if (source[cursor] === '-') {
          sign = -1;
          cursor += 1;
        }
        let digits = '';
        while (/\d/.test(source[cursor] ?? '')) {
          digits += source[cursor];
          cursor += 1;
        }
        if (!skip && digits) {
          const code = sign * Number(digits);
          text += String.fromCodePoint(code < 0 ? code + 65536 : code);
        }
        if (source[cursor] === ' ') cursor += 1;
        else if (source[cursor] && !/[{}\\]/.test(source[cursor])) cursor += 1;
        index = cursor;
        continue;
      }
      let cursor = index + 1;
      let word = '';
      while (/[a-z]/i.test(source[cursor] ?? '')) {
        word += source[cursor];
        cursor += 1;
      }
      if (source[cursor] === '-') cursor += 1;
      while (/\d/.test(source[cursor] ?? '')) cursor += 1;
      if (source[cursor] === ' ') cursor += 1;
      if (!word) {
        index = cursor;
        continue;
      }
      if (word === 'par' || word === 'line' || word === 'sect') {
        flush();
        if (!skip) text += '\n';
      } else if (word === 'tab') {
        flush();
        if (!skip) text += '\t';
      } else if (SKIPPED_RTF_GROUPS.has(word)) {
        skip += 1;
      }
      index = cursor;
      continue;
    }
    if (char === '\r' || char === '\n') {
      index += 1;
      continue;
    }
    if (!skip) bytes.push(char.charCodeAt(0));
    index += 1;
  }
  flush();
  return text.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function documentLinks(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const label = $(element).text();
    if (!href || !/\.(pdf|docx|doc|rtf)(\?|$)/i.test(href)) return;
    const absolute = new URL(href, pageUrl).toString();
    if (/\/dokumanlar\//i.test(absolute)) return;
    if (!/ilan|metin|duyuru|\/v2\//i.test(`${href} ${label} ${absolute}`)) return;
    links.add(absolute);
  });
  return [...links];
}
