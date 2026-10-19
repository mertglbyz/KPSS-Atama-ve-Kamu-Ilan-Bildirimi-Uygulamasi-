import './load-env';
import { GoogleGenAI, Type } from '@google/genai';
import type { ParsedAnnouncement } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    institution_name: { type: Type.STRING },
    application_start_date: { type: Type.STRING },
    application_end_date: { type: Type.STRING },
    notice_kind: { type: Type.STRING, enum: ['active', 'revised', 'cancelled'] },
    positions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          position_title: { type: Type.STRING },
          quota: { type: Type.INTEGER },
          cities: { type: Type.ARRAY, items: { type: Type.STRING } },
          education_level: { type: Type.STRING, enum: ['Ortaöğretim', 'Önlisans', 'Lisans'] },
          is_general_degree: { type: Type.BOOLEAN },
          allowed_departments: { type: Type.ARRAY, items: { type: Type.STRING } },
          requires_kpss: { type: Type.BOOLEAN },
          kpss_type: { type: Type.STRING },
          min_kpss_score: { type: Type.NUMBER },
          min_age: { type: Type.INTEGER },
          max_age: { type: Type.INTEGER },
          min_height_male: { type: Type.INTEGER },
          min_height_female: { type: Type.INTEGER },
          max_height_male: { type: Type.INTEGER },
          max_height_female: { type: Type.INTEGER },
          min_weight: { type: Type.INTEGER },
          max_weight: { type: Type.INTEGER },
          required_licenses: { type: Type.ARRAY, items: { type: Type.STRING } },
          requires_security_card: { type: Type.BOOLEAN },
          requires_disability: { type: Type.BOOLEAN },
          min_sgk_days: { type: Type.INTEGER },
          raw_requirements_text: { type: Type.STRING },
        },
        required: ['position_title', 'education_level', 'is_general_degree'],
      },
    },
  },
};

export async function parseAnnouncement(text: string, pdf?: Buffer): Promise<ParsedAnnouncement> {
  const contents = [
    ...(pdf
      ? [{ inlineData: { data: pdf.toString('base64'), mimeType: 'application/pdf' } }]
      : []),
    `Aşağıdaki kamu personel alımı ilan metnini ve varsa ekteki PDF veya Word metnini analiz et.
İlandaki her kadro satırını ayrı bir JSON öğesi olarak çıkar. Boy, kilo, yaş, cinsiyet, ehliyet, sertifika, güvenlik kartı, engellilik, SGK günü ve KPSS şartının hepsini ilgili alana yaz. Şart yoksa 0 veya false bırak.
KPSS türünü ilandaki gibi yaz: P1, P2, P3, P93, P94 veya A grubu alan adı (Hukuk, İktisat, Maliye, İşletme, Muhasebe, Kamu Yönetimi, Uluslararası İlişkiler, Çalışma Ekonomisi, İstatistik, Ekonometri, Finans).
Boy ve kiloyu santimetre ve kilogram olarak, kadın ve erkek için ayrı yaz. Üst sınır varsa max alanlarını doldur.
Bu metin bir düzeltme veya revizyon ise notice_kind revised olsun. İlan veya kadro iptal edildiyse notice_kind cancelled olsun ve güncel kadro bırakma. Değilse active yaz.
Bölüm adlarını standartlaştır. Lise mezuniyetini education_level olarak Ortaöğretim yaz. "Herhangi bir lisans/önlisans/ortaöğretim" ifadesinde is_general_degree true olsun.
Bugün ${new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })}. Tarihleri ISO 8601 yaz. Metinde yıl yoksa içinde bulunulan yılı kullan. 2024 ve öncesini yazma.
Ek metin: ${text.slice(0, 20000)}`,
  ];
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: { responseMimeType: 'application/json', responseSchema },
  });
  return JSON.parse(response.text ?? '{}') as ParsedAnnouncement;
}
