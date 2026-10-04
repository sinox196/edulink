import type { EduLinkDatabase } from '../types';
import { buildDirectory, SCHOOL, SUBJECTS } from './directory';
import {
  buildAttendance,
  buildExams,
  buildFeedback,
  buildGrades,
  buildHomework,
  buildReportCards,
  buildTimetable,
  HOLIDAYS,
} from './academics';
import {
  buildAnnouncements,
  buildAppointments,
  buildAuditLogs,
  buildCanteen,
  buildClubs,
  buildDocuments,
  buildEvents,
  buildMessaging,
  buildNews,
  buildNotifications,
  buildPayments,
  buildTransport,
} from './life';

export * from './directory';
export { HOLIDAYS, SARAH_PREVIOUS_TERM, ADAM_PREVIOUS_TERM, isSchoolDay, schoolDaysUntil, SCHOOL_START } from './academics';

/** Builds the complete, deterministic demo database for École Internationale Horizon. */
export function createDemoDatabase(): EduLinkDatabase {
  const dir = buildDirectory();
  const levelOf = new Map(dir.classes.map((c) => [c.id, c.level]));
  const { homework, completions } = buildHomework();
  const { events, participants } = buildEvents();
  const { conversations, messages } = buildMessaging();
  const transport = buildTransport();
  const { slots, appointments } = buildAppointments();
  const { clubs, registrations } = buildClubs();
  const { menus, dietary } = buildCanteen();

  return {
    school: structuredCloneSafe(SCHOOL),
    users: dir.users,
    students: dir.students,
    classes: dir.classes,
    subjects: SUBJECTS,
    teachers: dir.teachers,
    studentParents: dir.studentParents,
    attendance: buildAttendance(dir.students),
    grades: buildGrades(),
    exams: buildExams(),
    homework,
    homeworkCompletions: completions,
    timetable: buildTimetable(),
    announcements: buildAnnouncements(),
    news: buildNews(),
    events,
    eventParticipants: participants,
    conversations,
    messages,
    documents: buildDocuments(),
    reportCards: buildReportCards(),
    payments: buildPayments(dir.students, (id) => levelOf.get(id) ?? 'college'),
    buses: transport.buses,
    routes: transport.routes,
    busAssignments: transport.assignments,
    transportLive: transport.live,
    notifications: buildNotifications(),
    feedback: buildFeedback(),
    appointmentSlots: slots,
    appointments,
    clubs,
    clubRegistrations: registrations,
    canteenMenus: menus,
    dietaryProfiles: dietary,
    holidays: HOLIDAYS,
    auditLogs: buildAuditLogs(),
  };
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
