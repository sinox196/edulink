import type { EduLinkDatabase, ISODate, Locale } from '../types';
import { eachDay } from '../dates';
import { eventsForClass } from './academics';
import { getStudent, subjectName, teacherDisplayName, getTeacher } from './lookup';

export type CalendarKind = 'exam' | 'homework' | 'event' | 'holiday' | 'meeting' | 'admin';

export interface CalendarItem {
  id: string;
  date: ISODate;
  kind: CalendarKind;
  title: string;
  subtitle?: string;
  time?: string;
  link?: string;
}

/** Smart calendar: holidays, exams, homework deadlines, events, meetings and admin deadlines. */
export function calendarItems(db: EduLinkDatabase, studentId: string, locale: Locale, parentId?: string): CalendarItem[] {
  const student = getStudent(db, studentId);
  if (!student) return [];
  const items: CalendarItem[] = [];

  for (const h of db.holidays) {
    for (const d of eachDay(h.start, h.end)) {
      items.push({ id: `${h.id}-${d}`, date: d, kind: 'holiday', title: h.label });
    }
  }
  for (const e of db.exams.filter((x) => x.classId === student.classId)) {
    items.push({ id: e.id, date: e.date, kind: 'exam', title: `${subjectName(e.subjectId, locale)} — ${e.title}`, subtitle: e.room, time: e.time, link: '/exams' });
  }
  for (const h of db.homework.filter((x) => x.classId === student.classId)) {
    items.push({ id: h.id, date: h.dueDate, kind: 'homework', title: subjectName(h.subjectId, locale), subtitle: h.title, link: `/homework/${h.id}` });
  }
  for (const e of eventsForClass(db, student.classId)) {
    items.push({ id: e.id, date: e.date, kind: e.category === 'meeting' ? 'meeting' : 'event', title: `${e.emoji} ${e.title}`, subtitle: e.location, time: e.time, link: `/events/${e.id}` });
  }
  for (const a of db.appointments.filter((x) => x.studentId === studentId && (!parentId || x.parentId === parentId) && x.status !== 'cancelled')) {
    items.push({ id: a.id, date: a.date, kind: 'meeting', title: teacherDisplayName(getTeacher(db, a.teacherId)), subtitle: a.reason, time: a.start, link: '/appointments' });
  }
  for (const p of db.payments.filter((x) => x.studentId === studentId && x.status !== 'paid')) {
    items.push({ id: p.id, date: p.dueDate, kind: 'admin', title: p.label, subtitle: `${p.amount} ${db.school.currency}`, link: '/payments' });
  }
  items.push({ id: 'admin-reinscriptions', date: '2026-12-01', kind: 'admin', title: 'Ouverture des réinscriptions 2027-2028', link: '/announcements' });
  items.push({ id: 'admin-bulletins', date: '2026-12-11', kind: 'admin', title: 'Publication des bulletins du 1er trimestre', link: '/report-cards' });

  return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
}
