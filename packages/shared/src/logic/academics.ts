import type {
  AttendanceRecord,
  AttendanceStatus,
  EduLinkDatabase,
  Exam,
  Grade,
  Homework,
  ReportCard,
  SchoolEvent,
  Subject,
  TimetableSlot,
} from '../types';
import { addDays, diffDays, DEMO_TIME, DEMO_TODAY, isoWeekday, startOfWeek, timeToMinutes } from '../dates';
import { getStudent } from './lookup';

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ---------------------------------- Attendance ---------------------------------- */

export function attendanceFor(db: EduLinkDatabase, studentId: string): AttendanceRecord[] {
  return db.attendance.filter((a) => a.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));
}

export function attendanceOn(db: EduLinkDatabase, studentId: string, date = DEMO_TODAY): AttendanceRecord | undefined {
  return db.attendance.find((a) => a.studentId === studentId && a.date === date);
}

export const ABSENCE_STATUSES: AttendanceStatus[] = ['absent', 'excused', 'unexcused'];

export interface AttendanceStats {
  days: number;
  present: number;
  late: number;
  absences: number;
  excused: number;
  unexcused: number;
  pendingJustification: number;
  earlyLeave: number;
  /** % of school days attended (late arrivals count as attended). */
  rate: number;
}

export function attendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const s: AttendanceStats = { days: records.length, present: 0, late: 0, absences: 0, excused: 0, unexcused: 0, pendingJustification: 0, earlyLeave: 0, rate: 100 };
  for (const r of records) {
    if (r.status === 'present') s.present++;
    if (r.status === 'late') s.late++;
    if (r.status === 'early_leave') s.earlyLeave++;
    if (ABSENCE_STATUSES.includes(r.status)) s.absences++;
    if (r.status === 'excused') s.excused++;
    if (r.status === 'unexcused') s.unexcused++;
    if (r.status === 'absent') s.pendingJustification++;
  }
  s.rate = s.days ? Math.round(((s.days - s.absences) / s.days) * 100) : 100;
  return s;
}

/** Weekly attendance rate series for charts. */
export function attendanceByWeek(records: AttendanceRecord[]): { week: string; rate: number }[] {
  const buckets = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const w = startOfWeek(r.date);
    buckets.set(w, [...(buckets.get(w) ?? []), r]);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, rs]) => ({ week, rate: attendanceStats(rs).rate }));
}

/* ------------------------------------ Grades ------------------------------------ */

export function gradesFor(db: EduLinkDatabase, studentId: string, term = 1): Grade[] {
  return db.grades.filter((g) => g.studentId === studentId && g.term === term).sort((a, b) => b.date.localeCompare(a.date));
}

export function weightedAverage(grades: Pick<Grade, 'score' | 'outOf' | 'coefficient'>[]): number | null {
  if (!grades.length) return null;
  let sum = 0;
  let coef = 0;
  for (const g of grades) {
    sum += (g.score / g.outOf) * 20 * g.coefficient;
    coef += g.coefficient;
  }
  return round1(sum / coef);
}

export function weightedClassAverage(grades: Pick<Grade, 'classAverage' | 'coefficient'>[]): number | null {
  if (!grades.length) return null;
  let sum = 0;
  let coef = 0;
  for (const g of grades) {
    sum += g.classAverage * g.coefficient;
    coef += g.coefficient;
  }
  return round1(sum / coef);
}

export interface SubjectSummary {
  subject: Subject;
  grades: Grade[];
  average: number;
  classAverage: number;
  /** Difference with the previous report card for this subject (points). */
  trend: number | null;
  last: Grade;
  teacherId: string;
}

export function previousReportCard(db: EduLinkDatabase, studentId: string): ReportCard | undefined {
  return db.reportCards
    .filter((r) => r.studentId === studentId && r.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
}

export function subjectSummaries(db: EduLinkDatabase, studentId: string, term = 1): SubjectSummary[] {
  const grades = gradesFor(db, studentId, term);
  const prev = previousReportCard(db, studentId);
  return db.subjects
    .map((subject) => {
      const gs = grades.filter((g) => g.subjectId === subject.id);
      if (!gs.length) return null;
      const average = weightedAverage(gs)!;
      const prevAvg = prev?.subjects.find((s) => s.subjectId === subject.id)?.average;
      return {
        subject,
        grades: gs,
        average,
        classAverage: weightedClassAverage(gs)!,
        trend: prevAvg === undefined ? null : round1(average - prevAvg),
        last: gs[0],
        teacherId: gs[0].teacherId,
      } satisfies SubjectSummary;
    })
    .filter((x): x is SubjectSummary => x !== null);
}

/** General average weighted by subject coefficients. */
export function generalAverage(db: EduLinkDatabase, studentId: string, term = 1): { average: number; classAverage: number } | null {
  const subs = subjectSummaries(db, studentId, term);
  if (!subs.length) return null;
  let sum = 0;
  let csum = 0;
  let coef = 0;
  for (const s of subs) {
    sum += s.average * s.subject.coefficient;
    csum += s.classAverage * s.subject.coefficient;
    coef += s.subject.coefficient;
  }
  return { average: round1(sum / coef), classAverage: round1(csum / coef) };
}

/** Monthly evolution of the general average (cumulative), for the progression chart. */
export function averageProgression(db: EduLinkDatabase, studentId: string): { label: string; month: number; average: number; classAverage: number }[] {
  const all = gradesFor(db, studentId).slice().reverse();
  const prev = previousReportCard(db, studentId);
  const points: { label: string; month: number; average: number; classAverage: number }[] = [];
  if (prev) points.push({ label: 'T3', month: 5, average: prev.average, classAverage: prev.classAverage });
  for (const month of [8, 9, 10]) {
    const upTo = all.filter((g) => Number(g.date.slice(5, 7)) - 1 <= month);
    const avg = weightedAverage(upTo);
    const cavg = weightedClassAverage(upTo);
    if (avg !== null && cavg !== null) points.push({ label: ['', '', '', '', '', '', '', '', 'Sep', 'Oct', 'Nov'][month], month, average: avg, classAverage: cavg });
  }
  return points;
}

export function latestGrade(db: EduLinkDatabase, studentId: string): Grade | undefined {
  return gradesFor(db, studentId)[0];
}

/* ----------------------------------- Homework ----------------------------------- */

export type HomeworkStatus = 'todo' | 'done' | 'late';

export interface HomeworkItem {
  homework: Homework;
  status: HomeworkStatus;
  completedAt?: string;
}

export function homeworkFor(db: EduLinkDatabase, studentId: string, today = DEMO_TODAY): HomeworkItem[] {
  const student = getStudent(db, studentId);
  if (!student) return [];
  return db.homework
    .filter((h) => h.classId === student.classId)
    .map((homework) => {
      const c = db.homeworkCompletions.find((x) => x.homeworkId === homework.id && x.studentId === studentId);
      const status: HomeworkStatus = c ? 'done' : homework.dueDate < today ? 'late' : 'todo';
      return { homework, status, completedAt: c?.completedAt };
    })
    .sort((a, b) => a.homework.dueDate.localeCompare(b.homework.dueDate));
}

/* ----------------------------------- Timetable ---------------------------------- */

export function timetableForClass(db: EduLinkDatabase, classId: string, day?: number): TimetableSlot[] {
  return db.timetable
    .filter((s) => s.classId === classId && (day === undefined || s.day === day))
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

export function timetableForTeacher(db: EduLinkDatabase, teacherId: string, day?: number): TimetableSlot[] {
  return db.timetable
    .filter((s) => s.teacherId === teacherId && (day === undefined || s.day === day))
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

export type SlotState = 'past' | 'current' | 'upcoming';

export function slotState(slot: TimetableSlot, date = DEMO_TODAY, time = DEMO_TIME): SlotState {
  const today = isoWeekday(date);
  if (slot.day < today) return 'past';
  if (slot.day > today) return 'upcoming';
  const now = timeToMinutes(time);
  if (now >= timeToMinutes(slot.end)) return 'past';
  if (now >= timeToMinutes(slot.start)) return 'current';
  return 'upcoming';
}

/* ------------------------------------- Exams ------------------------------------ */

export function upcomingExams(db: EduLinkDatabase, classId: string, today = DEMO_TODAY): Exam[] {
  return db.exams.filter((e) => e.classId === classId && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------ Events ------------------------------------ */

export function eventsForClass(db: EduLinkDatabase, classId: string): SchoolEvent[] {
  return db.events
    .filter((e) => e.classIds.length === 0 || e.classIds.includes(classId))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function upcomingEvents(db: EduLinkDatabase, classId: string, today = DEMO_TODAY): SchoolEvent[] {
  return eventsForClass(db, classId).filter((e) => e.date >= today);
}

export function eventsThisWeek(db: EduLinkDatabase, classId: string, today = DEMO_TODAY): SchoolEvent[] {
  const start = startOfWeek(today);
  const end = addDays(start, 6);
  return eventsForClass(db, classId).filter((e) => e.date >= today && e.date <= end);
}

export function daysUntil(date: string, today = DEMO_TODAY): number {
  return diffDays(today, date);
}
