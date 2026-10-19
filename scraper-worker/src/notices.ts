export type NoticeKind = 'active' | 'revised' | 'cancelled';

export function noticeKind(title: string, text: string): NoticeKind {
  const foldedTitle = title.toLocaleLowerCase('tr-TR');
  const head = `${title}\n${text.slice(0, 800)}`.toLocaleLowerCase('tr-TR');
  if (/iptal edil|ilan iptal|duyuru iptal|yürürlükten kaldır|yururlukten kaldir/.test(head) || /\biptal\b/.test(foldedTitle)) {
    return 'cancelled';
  }
  if (/düzeltme|duzeltme|revize|güncellen|guncellen/.test(foldedTitle) || /düzeltme duyurusu|revize edilmiştir|şekliyle değiştir|sekliyle degistir/.test(head)) {
    return 'revised';
  }
  return 'active';
}
