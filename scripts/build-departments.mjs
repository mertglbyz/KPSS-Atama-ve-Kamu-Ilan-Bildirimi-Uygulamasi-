import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const programs = require(process.env.TEMP + '/yok-programs.json');

const sortTr = (values) => [...values].sort((a, b) => a.localeCompare(b, 'tr'));
const unique = (values) => sortTr([...new Set(values.filter(Boolean))]);

const lisans = unique(programs.filter((item) => item.puanTuru !== 'TYT').map((item) => item.birimGrupAdi));
const onlisans = unique(programs.filter((item) => item.puanTuru === 'TYT').map((item) => item.birimGrupAdi));

const general = [
  'Genel Ortaöğretim',
  'Anadolu Lisesi',
  'Fen Lisesi',
  'Sosyal Bilimler Lisesi',
  'Güzel Sanatlar Lisesi',
  'Spor Lisesi',
  'Anadolu İmam Hatip Lisesi',
  'Açık Öğretim Lisesi',
  'Mesleki Açık Öğretim Lisesi',
  'Çok Programlı Anadolu Lisesi',
];

const vocational = {
  Adalet: ['İnfaz ve Koruma', 'Zabıt Kâtipliği'],
  'Aile ve Tüketici Hizmetleri': ['Sosyal Destek Hizmetleri', 'Tüketici Hizmetleri'],
  'Ayakkabı ve Saraciye Teknolojisi': ['Ayakkabı Modelistliği', 'Ayakkabı Üretimi', 'Saraciye Modelistliği', 'Saraciye Üretimi'],
  'Bilişim Teknolojileri': ['Ağ İşletmenliği', 'Yazılım Geliştirme', 'Bilgisayar Teknik Servisi'],
  'Biyomedikal Cihaz Teknolojileri': [
    'Fizyolojik Sinyal İzleme Teşhis ve Kayıt Cihazları',
    'Tıbbi Görüntüleme Sistemleri',
    'Tıbbi Laboratuvar ve Hasta Dışı Uygulama Cihazları',
    'Yaşam Destek ve Tedavi Cihazları',
  ],
  'Büro Yönetimi ve Yönetici Asistanlığı': ['Büro Yönetimi ve Yönetici Asistanlığı', 'Büro Yönetimi Yönetici Sekreterliği'],
  'Çocuk Gelişimi ve Eğitimi': ['Erken Çocukluk ve Özel Eğitim', 'Çocuk Gelişimi ve Eğitimi'],
  Denizcilik: ['Güverte İşletme', 'Gemi Makineleri İşletme', 'Gemi Elektroniği ve Haberleşme', 'Balıkçılık ve Su Ürünleri'],
  'El Sanatları Teknolojisi': ['Dekoratif El Sanatları', 'Dekoratif Ev Tekstili', 'El Dokuma', 'El ve Makine Nakışı', 'Halı Desinatörlüğü', 'Sanayi Nakışı'],
  'Elektrik-Elektronik Teknolojisi': [
    'Asansör Sistemleri',
    'Elektrikli Cihazlar Teknik Servisi',
    'Elektrik Tesisatları ve Dağıtımı',
    'Endüstriyel Bakım Onarım',
    'Elektronik ve Haberleşme',
    'Savunma Elektronik Sistemleri',
    'Bobinaj',
    'Büro Makineleri Teknik Servisi',
    'Elektrik Tesisatları ve Pano Montörlüğü',
    'Elektrikli Ev Aletleri Teknik Servisi',
    'Görüntü ve Ses Sistemleri',
    'Güvenlik Sistemleri',
    'Haberleşme Sistemleri',
    'Yüksek Gerilim Sistemleri',
  ],
  'Endüstriyel Otomasyon Teknolojileri': ['Endüstriyel Otomasyon Teknolojileri', 'Endüstriyel Kontrol'],
  Gazetecilik: ['Gazetecilik'],
  'Geleneksel Türk Sanatları': ['Geleneksel Türk Sanatları'],
  'Gemi Yapımı': ['Gemi İnşa', 'Yat İnşa', 'Gemi Donatım', 'Kompozit Tekne İmalatı'],
  'Gıda Teknolojisi': [
    'Gıda Teknolojisi',
    'Bitkisel Yağ Üretim',
    'Çay İşleme',
    'Endüstriyel Et İşleme',
    'Hububat İşleme',
    'Sebze ve Meyve İşleme',
    'Su Ürünleri İşleme',
    'Süt İşleme',
    'Şekerleme ve Çikolata Üretim',
    'Zeytin İşleme',
  ],
  'Grafik ve Fotoğraf': ['Fotoğraf', 'Grafik', 'Animasyon'],
  'Güzellik Hizmetleri': ['Güzellik Hizmetleri', 'Cilt Bakımı ve Makyaj', 'Erkek Kuaförlüğü', 'Kadın Kuaförlüğü'],
  'Halkla İlişkiler': ['Halkla İlişkiler'],
  'Harita-Tapu-Kadastro': ['Harita', 'Kadastro', 'Tapu'],
  'Hasta ve Yaşlı Hizmetleri': ['Hasta ve Yaşlı Bakımı'],
  'Havacılık ve Uzay Teknolojisi': ['Havacılık ve Uzay Teknolojisi'],
  'Hayvan Yetiştiriciliği ve Sağlığı': [
    'Hayvan Yetiştiriciliği ve Sağlığı',
    'Arıcılık',
    'Büyükbaş Hayvan Yetiştiriciliği',
    'Küçükbaş Hayvan Yetiştiriciliği',
    'Kanatlı Hayvan Yetiştiriciliği',
    'Ev ve Süs Hayvanları',
    'Evcil Hayvan Kuaförlüğü',
  ],
  'İnşaat Teknolojisi': [
    'İnşaat Üstyapı',
    'İnşaat Altyapı',
    'Mimari Yapı Teknik Ressamlığı',
    'Statik Yapı Teknik Ressamlığı',
    'Mimari Restorasyon',
    'Yapı Yüzey Kaplama ve Yalıtım',
    'Ahşap Yapı Sistemleri',
    'Betonarme Kalıp ve Donatı Sistemleri',
    'Yapı Duvar ve Sıva Sistemleri',
    'Beton-Çimento ve Zemin Teknolojisi',
    'Cephe Sistemleri ve PVC Doğrama',
    'Çatı Sistemleri',
    'Çelik Yapı Teknik Ressamlığı',
    'İç Mekân Teknik Ressamlığı',
  ],
  'İtfaiyecilik ve Yangın Güvenliği': ['İtfaiyecilik ve Yangın Güvenliği'],
  'Kimya Teknolojisi': ['Kimya Laboratuvarı', 'Petrol Endüstrisi Proses'],
  'Konaklama ve Seyahat Hizmetleri': ['Animatörlük', 'Konaklama Hizmetleri', 'Seyahat Acenteciliği'],
  'Kuyumculuk Teknolojisi': ['Takı İmalatı'],
  'Laboratuvar Hizmetleri': ['Gıda, Tarım ve Hayvan Sağlığı Laboratuvarı'],
  'Maden Teknolojisi': ['Madencilik'],
  'Makine ve Tasarım Teknolojisi': [
    'Bilgisayar Destekli Endüstriyel Modelleme',
    'Bilgisayar Destekli Makine Ressamlığı',
    'Bilgisayarlı Makine İmalatı',
    'Değirmencilik',
    'Endüstriyel Kalıp',
    'Makine Bakım Onarım',
    'Savunma Mekanik Sistemleri',
    'Tıbbi Cihaz Üretimi',
    'Endüstriyel Ürünler Tasarımı',
  ],
  'Matbaa Teknolojisi': ['Baskı Öncesi', 'Ofset Baskı Sistemleri'],
  'Metal Teknolojisi': ['Metal Doğrama', 'Kaynakçılık'],
  'Metalürji Teknolojisi': ['Döküm', 'İzabe'],
  Mikromekanik: ['Mikromekanik ve Saatçilik'],
  'Mobilya ve İç Mekân Tasarımı': ['Mobilya Üretim Teknolojisi', 'Mobilya İç Mekân Ressamlığı'],
  'Moda Tasarım Teknolojileri': ['Terzilik', 'Giysi Kalıp Tasarımı ve Üretimi'],
  'Motorlu Araçlar Teknolojisi': ['İş Makineleri', 'Otomotiv Boya', 'Otomotiv Elektromekanik', 'Otomotiv Gövde', 'Elektrikli Araçlar'],
  'Muhasebe ve Finansman': ['Muhasebe', 'Dış Ticaret'],
  'Pazarlama ve Perakende': ['Satış Danışmanlığı', 'Sigortacılık'],
  'Plastik Sanatlar': ['Plastik Sanatlar'],
  'Plastik Teknolojisi': ['Plastik Teknolojisi'],
  'Radyo-Televizyon': ['Radyo-Televizyon'],
  'Raylı Sistemler Teknolojisi': ['Raylı Sistemler Elektrik-Elektronik', 'Raylı Sistemler Yol', 'Raylı Sistem Araçları'],
  'Sağlık Hizmetleri': ['Ebe Yardımcılığı', 'Hemşire Yardımcılığı', 'Sağlık Bakım Teknisyenliği'],
  'Seramik ve Cam Teknolojisi': ['Seramik', 'Cam'],
  'Siber Güvenlik': ['Siber Güvenlik'],
  Tarım: ['Tarım'],
  'Tekstil Teknolojisi': [
    'Dokuma Üretim Teknolojisi',
    'Örme Üretim Teknolojisi',
    'İplik Üretim Teknolojisi',
    'Tekstil Baskı ve Desenciliği',
    'Tekstil Boya Apre ve Laborantlığı',
  ],
  'Tesisat Teknolojisi ve İklimlendirme': ['Soğutma ve İklimlendirme Sistemleri', 'Tesisat ve Enerji Sistemleri'],
  'Uçak Bakım': ['Uçak Elektroniği', 'Uçak Gövde-Motor'],
  'Ulaştırma Hizmetleri': ['Sivil Havacılık', 'Lojistik'],
  'Yenilenebilir Enerji Teknolojileri': ['Yenilenebilir Enerji Teknolojileri'],
  'Yiyecek İçecek Hizmetleri': ['Yiyecek İçecek Hizmetleri'],
};

const orta = [...general];
for (const [alan, dallar] of Object.entries(vocational)) {
  orta.push(alan);
  for (const dal of dallar) {
    if (dal !== alan) orta.push(`${alan} / ${dal}`);
  }
}

const body = `import type { EducationLevel } from '@/types/domain';

/** YÖK Atlas program grupları ve MEB mesleki alan/dal listesi. */
export const DEPARTMENTS: Record<EducationLevel, string[]> = ${JSON.stringify(
  {
    Ortaöğretim: [...new Set(orta)],
    Önlisans: onlisans,
    Lisans: lisans,
  },
  null,
  2,
)};
`;

writeFileSync(new URL('../constants/departments.ts', import.meta.url), body);
console.log({ orta: new Set(orta).size, onlisans: onlisans.length, lisans: lisans.length });
