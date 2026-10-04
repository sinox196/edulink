import type { EduLinkDatabase, Role, Student, User } from '../types';
import { childrenOf, studentForUser, teacherForUser } from './lookup';

/**
 * Role-based access control. The same rules are enforced server-side by PostgreSQL
 * row-level security policies (see supabase/migrations/0002_rls.sql); the client applies
 * them too so that the UI never even requests data the user may not see.
 */
export type Permission =
  | 'student.read'
  | 'attendance.read'
  | 'attendance.write'
  | 'attendance.justify'
  | 'grades.read'
  | 'grades.write'
  | 'homework.read'
  | 'homework.write'
  | 'homework.complete'
  | 'exams.write'
  | 'announcements.publish.class'
  | 'announcements.publish.school'
  | 'announcements.emergency'
  | 'events.write'
  | 'events.rsvp'
  | 'documents.share'
  | 'documents.sign'
  | 'feedback.write'
  | 'messages.send'
  | 'appointments.book'
  | 'payments.read'
  | 'payments.manage'
  | 'transport.read'
  | 'transport.manage'
  | 'clubs.register'
  | 'users.manage'
  | 'classes.manage'
  | 'analytics.read'
  | 'notifications.push'
  | 'settings.school';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  parent: [
    'student.read', 'attendance.read', 'attendance.justify', 'grades.read', 'homework.read', 'events.rsvp',
    'documents.sign', 'messages.send', 'appointments.book', 'payments.read', 'transport.read', 'clubs.register',
  ],
  student: ['student.read', 'attendance.read', 'grades.read', 'homework.read', 'homework.complete', 'transport.read'],
  teacher: [
    'student.read', 'attendance.read', 'attendance.write', 'grades.read', 'grades.write', 'homework.read',
    'homework.write', 'exams.write', 'announcements.publish.class', 'events.write', 'documents.share',
    'feedback.write', 'messages.send',
  ],
  admin: [
    'student.read', 'attendance.read', 'attendance.write', 'grades.read', 'homework.read', 'announcements.publish.class',
    'announcements.publish.school', 'announcements.emergency', 'events.write', 'documents.share', 'messages.send',
    'payments.read', 'payments.manage', 'transport.read', 'transport.manage', 'users.manage', 'classes.manage',
    'analytics.read', 'notifications.push', 'settings.school',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class AccessDeniedError extends Error {
  constructor(message = 'Accès refusé') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

/** Students the given user is allowed to see. */
export function visibleStudents(db: EduLinkDatabase, user: Pick<User, 'id' | 'role'>): Student[] {
  switch (user.role) {
    case 'parent':
      return childrenOf(db, user.id);
    case 'student': {
      const me = studentForUser(db, user.id);
      return me ? [me] : [];
    }
    case 'teacher': {
      const t = teacherForUser(db, user.id);
      if (!t) return [];
      return db.students.filter((s) => t.classIds.includes(s.classId));
    }
    case 'admin':
      return db.students;
  }
}

export function canViewStudent(db: EduLinkDatabase, user: Pick<User, 'id' | 'role'>, studentId: string): boolean {
  switch (user.role) {
    case 'admin':
      return true;
    case 'parent':
      return db.studentParents.some((l) => l.parentId === user.id && l.studentId === studentId);
    case 'student':
      return studentForUser(db, user.id)?.id === studentId;
    case 'teacher': {
      const t = teacherForUser(db, user.id);
      const s = db.students.find((x) => x.id === studentId);
      return !!t && !!s && t.classIds.includes(s.classId);
    }
  }
}

export function assertCanViewStudent(db: EduLinkDatabase, user: Pick<User, 'id' | 'role'>, studentId: string): void {
  if (!canViewStudent(db, user, studentId)) throw new AccessDeniedError();
}

export function canTeachClass(db: EduLinkDatabase, user: Pick<User, 'id' | 'role'>, classId: string): boolean {
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') return false;
  return !!teacherForUser(db, user.id)?.classIds.includes(classId);
}

/** Messaging permissions are controlled by the school administrator. */
export function canMessage(db: EduLinkDatabase, from: Pick<User, 'id' | 'role'>, to: Pick<User, 'id' | 'role'>): boolean {
  const policy = db.school.messaging;
  if (from.role === 'admin') return true;
  if (from.role === 'student' || to.role === 'student') return policy.studentMessaging && (from.role === 'teacher' || to.role === 'teacher');
  if (to.role === 'admin') return from.role === 'teacher' || policy.parentToStaff;
  if (from.role === 'parent' && to.role === 'teacher') {
    const teacher = teacherForUser(db, to.id);
    if (!policy.parentToTeacher || !teacher?.acceptsMessages) return false;
    // A parent can only write to teachers of their own children.
    return childrenOf(db, from.id).some((c) => teacher.classIds.includes(c.classId));
  }
  if (from.role === 'teacher' && to.role === 'parent') {
    const teacher = teacherForUser(db, from.id);
    return childrenOf(db, to.id).some((c) => teacher?.classIds.includes(c.classId));
  }
  return from.role === 'teacher' && to.role === 'teacher';
}

/**
 * Data minimisation for class-wide views shown to families: never expose another
 * student's identity. Returns only aggregate figures.
 */
export function classAggregateOnly<T extends { studentId: string }>(rows: T[], ownStudentId: string): { own: T[]; othersCount: number } {
  return { own: rows.filter((r) => r.studentId === ownStudentId), othersCount: rows.filter((r) => r.studentId !== ownStudentId).length };
}
