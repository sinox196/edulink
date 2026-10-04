import type { ISODate, ISODateTime, Locale, TimeOfDay } from './types';

/**
 * The prototype runs on a fixed demo clock so that every screen tells the same story
 * (Sarah entered school at 08:05, left at 16:32, the maths test is in two days…).
 * In production `now()` would simply be `new Date()`.
 */
export const DEMO_TODAY: ISODate = '2026-11-16';
export const DEMO_TIME: TimeOfDay = '16:45';
export const DEMO_NOW: ISODateTime = `${DEMO_TODAY}T${DEMO_TIME}:00`;

export function today(): ISODate {
  return DEMO_TODAY;
}

export function nowISO(): ISODateTime {
  return DEMO_NOW;
}

/** Real wall-clock timestamp anchored on the demo day (used for new messages, etc.). */
export function stampNow(): ISODateTime {
  const d = new Date();
  return `${DEMO_TODAY}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

/** 1 = Monday … 7 = Sunday */
export function isoWeekday(iso: ISODate): number {
  const d = parseISODate(iso).getUTCDay();
  return d === 0 ? 7 : d;
}

export function isWeekend(iso: ISODate): boolean {
  return isoWeekday(iso) >= 6;
}

export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, 1 - isoWeekday(iso));
}

export function sameWeek(a: ISODate, b: ISODate): boolean {
  return startOfWeek(a) === startOfWeek(b);
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** 6 rows × 7 columns, weeks start on Monday; `null` for padding cells. */
export function monthMatrix(year: number, month0: number): (ISODate | null)[][] {
  const first = toISODate(new Date(Date.UTC(year, month0, 1)));
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const offset = isoWeekday(first) - 1;
  const cells: (ISODate | null)[] = Array(offset).fill(null);
  for (let i = 0; i < daysInMonth; i++) cells.push(addDays(first, i));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function timeToMinutes(t: TimeOfDay): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): TimeOfDay {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/* ------------------------------------------------------------------------------------ */
/* Localised formatting (no dependency on the platform's Intl data, which varies on RN). */

const MONTHS: Record<Locale, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  // Maghreb month names, as used by Tunisian schools.
  ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const MONTHS_SHORT: Record<Locale, string[]> = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: MONTHS.ar,
};

const WEEKDAYS: Record<Locale, string[]> = {
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ar: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
};

const WEEKDAYS_SHORT: Record<Locale, string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function monthName(month0: number, locale: Locale): string {
  return MONTHS[locale][month0];
}

export function weekdayName(isoDay: number, locale: Locale, short = false): string {
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[locale][isoDay - 1];
}

export type DateStyle = 'long' | 'short' | 'weekday' | 'dayMonth' | 'numeric' | 'monthYear';

export function formatDate(iso: ISODate, locale: Locale, style: DateStyle = 'long'): string {
  const d = parseISODate(iso);
  const day = d.getUTCDate();
  const month = MONTHS[locale][d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const wd = WEEKDAYS[locale][isoWeekday(iso) - 1];
  switch (style) {
    case 'numeric':
      return `${pad(day)}/${pad(d.getUTCMonth() + 1)}/${year}`;
    case 'short':
      return locale === 'en'
        ? `${MONTHS_SHORT.en[d.getUTCMonth()]} ${day}`
        : `${day} ${MONTHS_SHORT[locale][d.getUTCMonth()]}`;
    case 'dayMonth':
      return locale === 'en' ? `${month} ${day}` : `${day} ${locale === 'fr' ? capitalize(month) : month}`;
    case 'weekday':
      return locale === 'en' ? `${wd} ${month} ${day}` : `${locale === 'fr' ? capitalize(wd) : wd} ${day} ${locale === 'fr' ? capitalize(month) : month}`;
    case 'monthYear':
      return locale === 'fr' ? `${capitalize(month)} ${year}` : `${month} ${year}`;
    case 'long':
    default:
      return locale === 'en' ? `${wd}, ${month} ${day}, ${year}` : `${locale === 'fr' ? capitalize(wd) : wd} ${day} ${month} ${year}`;
  }
}

const RELATIVE: Record<Locale, { today: string; tomorrow: string; yesterday: string; inDays: (n: number) => string; daysAgo: (n: number) => string }> = {
  fr: {
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    yesterday: 'Hier',
    inDays: (n) => `Dans ${n} jours`,
    daysAgo: (n) => `Il y a ${n} jours`,
  },
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    inDays: (n) => `In ${n} days`,
    daysAgo: (n) => `${n} days ago`,
  },
  ar: {
    today: 'اليوم',
    tomorrow: 'غدًا',
    yesterday: 'أمس',
    inDays: (n) => `بعد ${n} أيام`,
    daysAgo: (n) => `منذ ${n} أيام`,
  },
};

/** "Aujourd'hui", "Demain", "Mercredi 18 Novembre"… relative to the demo clock. */
export function relativeDay(iso: ISODate, locale: Locale, ref: ISODate = DEMO_TODAY): string {
  const n = diffDays(ref, iso);
  const r = RELATIVE[locale];
  if (n === 0) return r.today;
  if (n === 1) return r.tomorrow;
  if (n === -1) return r.yesterday;
  return formatDate(iso, locale, 'weekday');
}

/** "Dans 2 jours" / "Il y a 3 jours" */
export function inDays(iso: ISODate, locale: Locale, ref: ISODate = DEMO_TODAY): string {
  const n = diffDays(ref, iso);
  const r = RELATIVE[locale];
  if (n === 0) return r.today;
  if (n === 1) return r.tomorrow;
  if (n === -1) return r.yesterday;
  return n > 0 ? r.inDays(n) : r.daysAgo(-n);
}

/** Relative timestamp for feeds: "08:05", "Hier", "12 nov." */
export function formatStamp(at: ISODateTime, locale: Locale, ref: ISODate = DEMO_TODAY): string {
  const day = at.slice(0, 10);
  const n = diffDays(day, ref);
  if (n === 0) return at.slice(11, 16);
  if (n === 1) return RELATIVE[locale].yesterday;
  return formatDate(day, locale, 'short');
}
