import type { ClassRoom, EduLinkDatabase, Locale, Student, Subject, Teacher, User } from '../types';

const SUBJECT_NAMES: Record<string, Record<Locale, string>> = {
  'sub-maths': { fr: 'Mathématiques', en: 'Mathematics', ar: 'الرياضيات' },
  'sub-fr': { fr: 'Français', en: 'French', ar: 'الفرنسية' },
  'sub-en': { fr: 'Anglais', en: 'English', ar: 'الإنجليزية' },
  'sub-sci': { fr: 'Sciences', en: 'Science', ar: 'العلوم' },
  'sub-hg': { fr: 'Histoire-Géographie', en: 'History-Geography', ar: 'التاريخ والجغرافيا' },
  'sub-ar': { fr: 'Arabe', en: 'Arabic', ar: 'العربية' },
  'sub-eps': { fr: 'Éducation physique', en: 'Physical education', ar: 'التربية البدنية' },
  'sub-art': { fr: 'Arts plastiques', en: 'Visual arts', ar: 'الفنون التشكيلية' },
};

export function subjectName(subjectId: string | null | undefined, locale: Locale): string {
  if (!subjectId) return '';
  return SUBJECT_NAMES[subjectId]?.[locale] ?? subjectId;
}

export function byId<T extends { id: string }>(items: T[], id: string | undefined): T | undefined {
  if (!id) return undefined;
  return items.find((i) => i.id === id);
}

export const getSubject = (db: EduLinkDatabase, id: string): Subject | undefined => byId(db.subjects, id);
export const getStudent = (db: EduLinkDatabase, id: string): Student | undefined => byId(db.students, id);
export const getClass = (db: EduLinkDatabase, id: string): ClassRoom | undefined => byId(db.classes, id);
export const getTeacher = (db: EduLinkDatabase, id: string | undefined): Teacher | undefined => byId(db.teachers, id);
export const getUser = (db: EduLinkDatabase, id: string): User | undefined => byId(db.users, id);

export function teacherDisplayName(t: Pick<Teacher, 'title' | 'lastName'> | undefined): string {
  return t ? `${t.title} ${t.lastName}` : '';
}

export function userDisplayName(u: User | undefined): string {
  if (!u) return '';
  if (u.role === 'admin' && !u.title) return `${u.firstName} ${u.lastName}`.trim();
  return u.title ? `${u.title} ${u.lastName}` : `${u.firstName} ${u.lastName}`;
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
}

export function initials(p: { firstName: string; lastName: string }): string {
  return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
}

export function teacherForUser(db: EduLinkDatabase, userId: string): Teacher | undefined {
  return db.teachers.find((t) => t.userId === userId);
}

export function studentForUser(db: EduLinkDatabase, userId: string): Student | undefined {
  return db.students.find((s) => s.userId === userId);
}

export function childrenOf(db: EduLinkDatabase, parentId: string): Student[] {
  const ids = db.studentParents.filter((l) => l.parentId === parentId).map((l) => l.studentId);
  return db.students.filter((s) => ids.includes(s.id));
}

export function parentsOf(db: EduLinkDatabase, studentId: string): User[] {
  const ids = db.studentParents.filter((l) => l.studentId === studentId).map((l) => l.parentId);
  return db.users.filter((u) => ids.includes(u.id));
}

export function studentsInClass(db: EduLinkDatabase, classId: string): Student[] {
  return db.students
    .filter((s) => s.classId === classId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr') || a.firstName.localeCompare(b.firstName, 'fr'));
}

/** Remove accents and case for search/matching. */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

export function formatMoney(amount: number, currency = 'DT'): string {
  return `${amount.toLocaleString('fr-FR').replace(/ | /g, ' ')} ${currency}`;
}
