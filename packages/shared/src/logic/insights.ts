import type { EduLinkDatabase, Locale } from '../types';
import { addDays, DEMO_TODAY, formatDate, isoWeekday, startOfWeek, weekdayName } from '../dates';
import {
  attendanceFor,
  attendanceOn,
  attendanceStats,
  eventsThisWeek,
  gradesFor,
  homeworkFor,
  subjectSummaries,
  timetableForClass,
  upcomingEvents,
  upcomingExams,
} from './academics';
import { formatScore, getStudent, subjectName } from './lookup';

/**
 * "Smart" features. In production the summary would be produced by an LLM from the same
 * structured signals; the prototype uses deterministic templates so that wording stays
 * constructive and never alarming — a product requirement for parent communication.
 */

const joinList = (items: string[], locale: Locale) => {
  if (items.length <= 1) return items.join('');
  const and = locale === 'fr' ? ' et ' : locale === 'en' ? ' and ' : ' و';
  return items.slice(0, -1).join(', ') + and + items[items.length - 1];
};

const lower = (s: string, locale: Locale) => (locale === 'fr' ? s.toLowerCase() : s);

export function progressSummary(db: EduLinkDatabase, studentId: string, locale: Locale): string {
  const student = getStudent(db, studentId);
  if (!student) return '';
  const subs = subjectSummaries(db, studentId).filter((s) => s.trend !== null);
  const rising = subs.filter((s) => (s.trend ?? 0) >= 0.5).sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0));
  const strong = subs.filter((s) => s.average >= 16).sort((a, b) => b.average - a.average);
  const highlights = [...new Set([...rising.slice(0, 1), ...strong.slice(0, 2)].map((s) => s.subject.id))].slice(0, 2);
  const attention = subs.filter((s) => (s.trend ?? 0) < 0).sort((a, b) => (a.trend ?? 0) - (b.trend ?? 0))[0];
  const name = student.firstName;
  const hl = highlights.map((id) => lower(subjectName(id, locale), locale));

  if (locale === 'fr') {
    let text = hl.length ? `${name} progresse particulièrement en ${hl.join(' et en ')}.` : `${name} maintient un travail régulier dans l'ensemble des matières.`;
    if (attention) text += ` Une attention supplémentaire en ${lower(subjectName(attention.subject.id, locale), locale)} pourrait améliorer sa moyenne générale.`;
    return text;
  }
  if (locale === 'en') {
    let text = hl.length ? `${name} is making particularly good progress in ${joinList(hl, locale)}.` : `${name} is working steadily across all subjects.`;
    if (attention) text += ` A little extra attention in ${subjectName(attention.subject.id, locale).toLowerCase()} could further improve the overall average.`;
    return text;
  }
  const f = student.gender === 'F';
  let text = hl.length ? `${name} ${f ? 'تحرز' : 'يحرز'} تقدمًا ملحوظًا في ${joinList(hl, locale)}.` : `${name} ${f ? 'تعمل' : 'يعمل'} بانتظام في جميع المواد.`;
  if (attention) text += ` قد يساعد اهتمام إضافي بمادة ${subjectName(attention.subject.id, locale)} على تحسين المعدل العام.`;
  return text;
}

export interface Insight {
  id: string;
  kind: 'absences' | 'late' | 'grades' | 'homework';
  title: string;
  body: string;
  link: string;
}

/** Early-warning signals, phrased constructively. */
export function riskInsights(db: EduLinkDatabase, studentId: string, locale: Locale, today = DEMO_TODAY): Insight[] {
  const student = getStudent(db, studentId);
  if (!student) return [];
  const out: Insight[] = [];
  const since = addDays(today, -30);
  const recent = attendanceFor(db, studentId).filter((a) => a.date >= since);
  const stats = attendanceStats(recent);
  const name = student.firstName;

  if (stats.absences >= 3) {
    out.push({
      id: 'absences', kind: 'absences', link: '/attendance',
      title: { fr: 'Absences récentes', en: 'Recent absences', ar: 'غيابات حديثة' }[locale],
      body: {
        fr: `${name} a été absent(e) ${stats.absences} fois ces 30 derniers jours. N'hésitez pas à échanger avec la vie scolaire si besoin.`,
        en: `${name} has been absent ${stats.absences} times in the last 30 days. Feel free to get in touch with the school office if needed.`,
        ar: `تغيب(ت) ${name} ${stats.absences} مرات خلال الثلاثين يومًا الأخيرة. لا تترددوا في التواصل مع الإدارة عند الحاجة.`,
      }[locale],
    });
  }
  if (stats.late >= 3) {
    out.push({
      id: 'late', kind: 'late', link: '/attendance',
      title: { fr: 'Arrivées tardives', en: 'Late arrivals', ar: 'تأخرات' }[locale],
      body: {
        fr: `${stats.late} retards ce mois-ci. Un départ quelques minutes plus tôt le matin pourrait aider.`,
        en: `${stats.late} late arrivals this month. Leaving a few minutes earlier in the morning could help.`,
        ar: `${stats.late} تأخرات هذا الشهر. قد يساعد الخروج مبكرًا ببضع دقائق.`,
      }[locale],
    });
  }

  for (const s of subjectSummaries(db, studentId)) {
    const last3 = s.grades.slice(0, 3).reverse();
    if (last3.length === 3 && last3[0].score > last3[1].score && last3[1].score > last3[2].score) {
      const subj = subjectName(s.subject.id, locale);
      out.push({
        id: `grades-${s.subject.id}`, kind: 'grades', link: `/grades/${s.subject.id}`,
        title: { fr: `Suivi en ${subj.toLowerCase()}`, en: `${subj} follow-up`, ar: `متابعة ${subj}` }[locale],
        body: {
          fr: `Les résultats en ${subj.toLowerCase()} ont légèrement baissé sur les trois dernières évaluations. Consultez les notes et les commentaires de l'enseignant.`,
          en: `${subj} results have dipped slightly over the last three assessments. Have a look at the grades and the teacher's comments.`,
          ar: `تراجعت نتائج ${subj} قليلًا خلال التقييمات الثلاثة الأخيرة. اطلعوا على الأعداد وملاحظات الأستاذ(ة).`,
        }[locale],
      });
    }
  }

  const late = homeworkFor(db, studentId, today).filter((h) => h.status === 'late');
  if (late.length) {
    out.push({
      id: 'homework', kind: 'homework', link: '/homework',
      title: { fr: 'Devoir à rattraper', en: 'Homework to catch up', ar: 'واجب للاستدراك' }[locale],
      body: {
        fr: `${late.length === 1 ? 'Un devoir n\'a' : `${late.length} devoirs n'ont`} pas encore été rendu${late.length > 1 ? 's' : ''} (${subjectName(late[0].homework.subjectId, locale)}). Un petit point ensemble ce soir ?`,
        en: `${late.length} homework assignment${late.length > 1 ? 's have' : ' has'} not been handed in yet (${subjectName(late[0].homework.subjectId, locale)}). Maybe check in together tonight?`,
        ar: `لم يتم تسليم ${late.length} واجب بعد (${subjectName(late[0].homework.subjectId, locale)}). ما رأيكم في مراجعته معًا هذا المساء؟`,
      }[locale],
    });
  }
  return out;
}

export interface DailyDigest {
  date: string;
  attendance: ReturnType<typeof attendanceOn>;
  lessons: number;
  newHomework: number;
  newGrades: { subjectId: string; score: number; outOf: number }[];
  nextEvent?: { title: string; date: string };
}

export function dailyDigest(db: EduLinkDatabase, studentId: string, date = DEMO_TODAY): DailyDigest | null {
  const student = getStudent(db, studentId);
  if (!student) return null;
  const lessons = timetableForClass(db, student.classId, isoWeekday(date)).filter((s) => s.subjectId).length;
  const newHomework = db.homework.filter((h) => h.classId === student.classId && h.assignedAt === date).length;
  const newGrades = gradesFor(db, studentId).filter((g) => g.date === date).map((g) => ({ subjectId: g.subjectId, score: g.score, outOf: g.outOf }));
  const ev = eventsThisWeek(db, student.classId, date)[0] ?? upcomingEvents(db, student.classId, date)[0];
  return { date, attendance: attendanceOn(db, studentId, date), lessons, newHomework, newGrades, nextEvent: ev ? { title: ev.title, date: ev.date } : undefined };
}

export interface WeeklySummary {
  weekStart: string;
  attendanceRate: number;
  average: number | null;
  homeworkDone: number;
  homeworkTotal: number;
  positiveFeedback: number;
  newGrades: number;
}

/** Summary of the last completed school week (sent on weekends). */
export function weeklySummary(db: EduLinkDatabase, studentId: string, today = DEMO_TODAY): WeeklySummary {
  const weekStart = addDays(startOfWeek(today), -7);
  const weekEnd = addDays(weekStart, 6);
  const inWeek = (d: string) => d >= weekStart && d <= weekEnd;
  const att = attendanceFor(db, studentId).filter((a) => inWeek(a.date));
  const hw = homeworkFor(db, studentId, today).filter((h) => inWeek(h.homework.dueDate));
  const grades = gradesFor(db, studentId).filter((g) => inWeek(g.date));
  const avg = grades.length ? Math.round((grades.reduce((s, g) => s + (g.score / g.outOf) * 20 * g.coefficient, 0) / grades.reduce((s, g) => s + g.coefficient, 0)) * 10) / 10 : null;
  return {
    weekStart,
    attendanceRate: attendanceStats(att).rate,
    average: avg,
    homeworkDone: hw.filter((h) => h.status === 'done').length,
    homeworkTotal: hw.length,
    positiveFeedback: db.feedback.filter((f) => f.studentId === studentId && f.kind === 'positive' && inWeek(f.date)).length,
    newGrades: grades.length,
  };
}

export type PriorityKind = 'homework' | 'grade' | 'meeting' | 'authorization' | 'justification' | 'exam';

export interface PriorityItem {
  id: string;
  kind: PriorityKind;
  text: string;
  link: string;
  tone: 'info' | 'success' | 'warning' | 'event' | 'academic';
}

/** "À ne pas manquer" — only what needs attention now. */
export function priorityItems(db: EduLinkDatabase, studentId: string, locale: Locale, today = DEMO_TODAY): PriorityItem[] {
  const student = getStudent(db, studentId);
  if (!student) return [];
  const items: PriorityItem[] = [];
  const tomorrow = addDays(today, 1);
  const t = <T extends Record<Locale, string>>(m: T) => m[locale];

  const dueTomorrow = homeworkFor(db, studentId, today).filter((h) => h.status === 'todo' && h.homework.dueDate === tomorrow).length;
  if (dueTomorrow) {
    items.push({ id: 'hw-tomorrow', kind: 'homework', link: '/homework', tone: 'info', text: t({ fr: `${dueTomorrow} devoir${dueTomorrow > 1 ? 's' : ''} pour demain`, en: `${dueTomorrow} homework due tomorrow`, ar: `${dueTomorrow} واجبات للغد` }) });
  }

  const recentGrade = gradesFor(db, studentId).find((g) => g.date >= addDays(today, -4) && g.subjectId === 'sub-maths') ?? gradesFor(db, studentId).find((g) => g.date >= addDays(today, -1));
  if (recentGrade) {
    const subj = subjectName(recentGrade.subjectId, locale);
    items.push({ id: `grade-${recentGrade.id}`, kind: 'grade', link: `/grades/${recentGrade.subjectId}`, tone: 'academic', text: t({ fr: `Nouvelle note en ${subj} : ${formatScore(recentGrade.score)}/${recentGrade.outOf}`, en: `New grade in ${subj}: ${formatScore(recentGrade.score)}/${recentGrade.outOf}`, ar: `علامة جديدة في ${subj}: ${formatScore(recentGrade.score)}/${recentGrade.outOf}` }) });
  }

  const exam = upcomingExams(db, student.classId, today)[0];
  if (exam && exam.date <= addDays(today, 3)) {
    const subj = subjectName(exam.subjectId, locale);
    const day = weekdayName(isoWeekday(exam.date), locale);
    items.push({ id: `exam-${exam.id}`, kind: 'exam', link: '/exams', tone: 'academic', text: t({ fr: `Contrôle de ${subj.toLowerCase()} ${day}`, en: `${subj} test on ${day}`, ar: `فرض ${subj} يوم ${day}` }) });
  }

  const meeting = eventsThisWeek(db, student.classId, today).find((e) => e.category === 'meeting');
  if (meeting) {
    const day = weekdayName(isoWeekday(meeting.date), locale);
    items.push({ id: `meeting-${meeting.id}`, kind: 'meeting', link: `/events/${meeting.id}`, tone: 'event', text: t({ fr: `${meeting.title} ${day}`, en: `Parent-teacher meeting on ${day}`, ar: `اجتماع الأولياء والأساتذة يوم ${day}` }) });
  }

  for (const ev of upcomingEvents(db, student.classId, today).filter((e) => e.requiresAuthorization)) {
    const p = db.eventParticipants.find((x) => x.eventId === ev.id && x.studentId === studentId);
    if (!p?.authorizationSignedAt) {
      items.push({ id: `auth-${ev.id}`, kind: 'authorization', link: `/events/${ev.id}`, tone: 'warning', text: t({ fr: `Autorisation à signer : ${ev.title}`, en: `Authorisation to sign: ${ev.title}`, ar: `ترخيص للإمضاء: ${ev.title}` }) });
    }
  }

  const pending = attendanceFor(db, studentId).filter((a) => a.status === 'absent' && !a.justification);
  if (pending.length) {
    items.push({ id: 'justify', kind: 'justification', link: '/attendance/justify', tone: 'warning', text: t({ fr: `Absence du ${formatDate(pending[0].date, 'fr', 'dayMonth').toLowerCase()} à justifier`, en: `Absence on ${formatDate(pending[0].date, 'en', 'dayMonth')} to justify`, ar: `غياب ${formatDate(pending[0].date, 'ar', 'dayMonth')} يحتاج تبريرًا` }) });
  }

  return items;
}
