import type { EduLinkDatabase, SchoolLevel } from '../types';
import { addDays, DEMO_TODAY } from '../dates';
import { createRng } from '../rng';
import { schoolDaysUntil } from '../demo/academics';
import { ABSENCE_STATUSES } from './academics';

/** School-wide KPIs for the administration dashboard. */
export interface SchoolKpis {
  students: number;
  teachers: number;
  classes: number;
  attendanceRate: number;
  absencesToday: number;
  lateToday: number;
  paymentsPending: number;
  upcomingEvents: number;
  parentAdoption: number;
  ackRate: number;
}

export function schoolKpis(db: EduLinkDatabase, today = DEMO_TODAY): SchoolKpis {
  const todays = db.attendance.filter((a) => a.date === today);
  const absences = todays.filter((a) => ABSENCE_STATUSES.includes(a.status)).length;
  const late = todays.filter((a) => a.status === 'late').length;
  const parents = db.users.filter((u) => u.role === 'parent');
  // Read-receipt rate of the oldest critical alert still running (a brand-new alert would read 0%).
  const critical = db.announcements.filter((a) => a.requiresAck).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))[0];
  return {
    students: db.students.length,
    teachers: db.teachers.length,
    classes: db.classes.length,
    attendanceRate: todays.length ? Math.round(((todays.length - absences) / todays.length) * 100) : 100,
    absencesToday: absences,
    lateToday: late,
    paymentsPending: db.payments.filter((p) => p.status !== 'paid' && p.dueDate <= addDays(today, 30)).length,
    // School-wide events and parent meetings in the next 30 days.
    upcomingEvents: db.events.filter((e) => e.date >= today && e.date <= addDays(today, 30) && (e.classIds.length === 0 || e.category === 'meeting')).length,
    parentAdoption: Math.round((parents.filter((p) => p.activated).length / parents.length) * 100),
    ackRate: critical ? Math.round((critical.acknowledgedBy.length / critical.recipientCount) * 100) : 0,
  };
}

/** Daily attendance rate since the start of the year (synthetic for the whole school). */
export function attendanceTrend(db: EduLinkDatabase, today = DEMO_TODAY): { date: string; rate: number }[] {
  const rng = createRng(77);
  const days = schoolDaysUntil(today);
  return days.map((date) => {
    if (date === today) return { date, rate: schoolKpis(db, today).attendanceRate };
    // Slight dip on Mondays and before holidays, seasonal flu in November.
    const base = 96.2 - (date >= '2026-11-02' ? 1.1 : 0) - (new Date(`${date}T00:00:00Z`).getUTCDay() === 1 ? 0.8 : 0);
    return { date, rate: Math.round((base + rng.float(-1.2, 1.2)) * 10) / 10 };
  });
}

export function absencesByClass(db: EduLinkDatabase, today = DEMO_TODAY): { classId: string; name: string; absences: number; late: number; size: number }[] {
  const byStudent = new Map(db.students.map((s) => [s.id, s.classId]));
  const counts = new Map<string, { absences: number; late: number }>();
  for (const a of db.attendance.filter((x) => x.date === today)) {
    const cls = byStudent.get(a.studentId)!;
    const c = counts.get(cls) ?? { absences: 0, late: 0 };
    if (ABSENCE_STATUSES.includes(a.status)) c.absences++;
    if (a.status === 'late') c.late++;
    counts.set(cls, c);
  }
  return db.classes.map((c) => ({ classId: c.id, name: c.name, size: c.studentCount, ...(counts.get(c.id) ?? { absences: 0, late: 0 }) }));
}

export function averagesByLevel(db: EduLinkDatabase): { level: SchoolLevel; grade: string; average: number }[] {
  const grades = [...new Set(db.classes.map((c) => c.grade))];
  return grades.map((g) => {
    const cs = db.classes.filter((c) => c.grade === g);
    return { level: cs[0].level, grade: g, average: Math.round((cs.reduce((s, c) => s + c.average, 0) / cs.length) * 10) / 10 };
  });
}

export function paymentStatus(db: EduLinkDatabase): { paid: number; pending: number; overdue: number; collected: number; outstanding: number } {
  const r = { paid: 0, pending: 0, overdue: 0, collected: 0, outstanding: 0 };
  for (const p of db.payments) {
    r[p.status]++;
    if (p.status === 'paid') r.collected += p.amount;
    else r.outstanding += p.amount;
  }
  return r;
}

/** Weekly adoption and notification engagement, for the analytics page. */
export function engagementSeries(): { week: string; adoption: number; openRate: number; ackMedianMinutes: number }[] {
  const weeks = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12', '2026-11-02', '2026-11-09', '2026-11-16'];
  return weeks.map((week, i) => ({
    week,
    adoption: Math.round(54 + i * 4.2),
    openRate: Math.round(61 + Math.min(i, 6) * 3.1 + (i % 2)),
    ackMedianMinutes: Math.max(18, 95 - i * 9),
  }));
}

export function notificationEngagement(): { category: string; sent: number; opened: number }[] {
  return [
    { category: 'Présence', sent: 18420, opened: 16210 },
    { category: 'Notes', sent: 6120, opened: 5630 },
    { category: 'Devoirs', sent: 9310, opened: 6980 },
    { category: 'Événements', sent: 4200, opened: 3150 },
    { category: 'Messages', sent: 2870, opened: 2760 },
    { category: 'Paiements', sent: 1980, opened: 1610 },
    { category: 'Transport', sent: 7640, opened: 6420 },
    { category: 'Urgent', sent: 1032, opened: 1001 },
  ];
}
