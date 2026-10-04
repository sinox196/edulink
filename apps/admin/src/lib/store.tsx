'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createDemoDatabase,
  DEMO_TODAY,
  getStudent,
  normalize,
  stampNow,
  type Announcement,
  type EduLinkDatabase,
  type Locale,
  type NotificationCategory,
  type SchoolModules,
  type Student,
  type User,
} from '@edulink/shared';

export const DEMO_ADMIN_EMAIL = 'nadia.chaabane@horizon.edu.tn';
export const DEMO_PASSWORD = 'edulink2026';
const SESSION_KEY = 'edulink.admin.session';

interface AdminStore {
  db: EduLinkDatabase;
  user: User | null;
  ready: boolean;
  toast: string | null;
  login: (email: string, password: string) => 'ok' | 'invalid' | 'forbidden';
  logout: () => void;
  notify: (msg: string) => void;
  publishAnnouncement: (a: Pick<Announcement, 'title' | 'body' | 'priority' | 'requiresAck' | 'scope' | 'classIds' | 'category'>) => void;
  createEvent: (e: { title: string; emoji: string; date: string; time: string; location: string; description: string; classIds: string[]; requiresAuthorization: boolean }) => void;
  addStudent: (s: { firstName: string; lastName: string; gender: 'F' | 'M'; classId: string; parentEmail: string }) => Student;
  setModule: (key: keyof SchoolModules, value: boolean) => void;
  setMessaging: (patch: Partial<EduLinkDatabase['school']['messaging']>) => void;
  setPrimaryLanguage: (l: Locale) => void;
  reviewJustification: (attendanceId: string, accepted: boolean) => void;
  remindPayment: (paymentId: string) => void;
  markPaid: (paymentId: string) => void;
  setTeacherMessages: (teacherId: string, value: boolean) => void;
  logAccess: (target: string) => void;
  sendPush: (p: { audience: 'all' | 'class'; classId?: string; category: NotificationCategory; title: string; body: string }) => number;
}

const Ctx = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<EduLinkDatabase>(() => createDemoDatabase());
  const dbRef = useRef(db);
  dbRef.current = db;
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const id = sessionStorage.getItem(SESSION_KEY);
      if (id) setUser(dbRef.current.users.find((u) => u.id === id && u.role === 'admin') ?? null);
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 3800);
  }, []);

  const mutate = useCallback((fn: (d: EduLinkDatabase) => void, action?: string, target?: string) => {
    const d = { ...dbRef.current };
    fn(d);
    if (action) {
      const u = d.users.find((x) => x.id === sessionStorageGet());
      d.auditLogs = [{ id: `log-${Date.now()}`, at: stampNow(), actorId: u?.id ?? 'admin', actorName: u ? `${u.title ?? ''} ${u.firstName} ${u.lastName}`.trim() : 'Administration', action, target: target ?? '' }, ...d.auditLogs];
    }
    dbRef.current = d;
    setDb(d);
  }, []);

  const value: AdminStore = {
    db,
    user,
    ready,
    toast,
    notify,
    login: (email, password) => {
      const u = dbRef.current.users.find((x) => normalize(x.email) === normalize(email.trim()));
      if (!u || password !== DEMO_PASSWORD || !u.schoolCode) return 'invalid';
      if (u.role !== 'admin') return 'forbidden';
      setUser(u);
      try {
        sessionStorage.setItem(SESSION_KEY, u.id);
      } catch {
        /* ignore */
      }
      mutate(() => {}, 'Connexion au tableau de bord web', 'admin.edulink');
      return 'ok';
    },
    logout: () => {
      setUser(null);
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* ignore */
      }
    },
    publishAnnouncement: (a) =>
      mutate(
        (d) => {
          const recipients = a.scope === 'school' ? new Set(d.studentParents.map((l) => l.parentId)).size : new Set(d.studentParents.filter((l) => a.classIds.includes(getStudent(d, l.studentId)?.classId ?? '')).map((l) => l.parentId)).size;
          d.announcements = [{ ...a, id: `ann-${Date.now()}`, publishedAt: stampNow(), authorId: user?.id ?? 'admin', authorName: `${user?.title ?? ''} ${user?.firstName ?? ''} ${user?.lastName ?? ''} — Direction`.trim(), acknowledgedBy: [], recipientCount: recipients }, ...d.announcements];
        },
        a.priority === 'critical' ? 'Alerte critique publiée' : 'Annonce publiée',
        a.title,
      ),
    createEvent: (e) =>
      mutate((d) => {
        d.events = [...d.events, { ...e, id: `ev-${Date.now()}`, category: e.classIds.length ? 'class' : 'culture', organizer: 'Direction' }];
      }, 'Événement créé', e.title),
    addStudent: (s) => {
      const id = `stu-new-${Date.now()}`;
      const student: Student = { id, firstName: s.firstName, lastName: s.lastName, gender: s.gender, birthDate: '2015-01-01', classId: s.classId, studentNumber: `HZ-E-${String(9000 + dbRef.current.students.length).slice(-4)}`, avatarColor: '#2563EB', enrolledAt: DEMO_TODAY };
      mutate(
        (d) => {
          const parentId = `u-par-new-${Date.now()}`;
          d.students = [...d.students, student];
          d.users = [...d.users, { id: parentId, role: 'parent', firstName: 'Parent', lastName: s.lastName, email: s.parentEmail, avatarColor: '#14B8A6', activated: false }];
          d.studentParents = [...d.studentParents, { studentId: id, parentId, relation: 'tuteur', isPrimaryContact: true }];
          d.classes = d.classes.map((c) => (c.id === s.classId ? { ...c, studentCount: c.studentCount + 1 } : c));
        },
        'Élève inscrit (invitation parent envoyée)',
        `${s.firstName} ${s.lastName}`,
      );
      return student;
    },
    setModule: (key, v) =>
      mutate((d) => {
        d.school = { ...d.school, modules: { ...d.school.modules, [key]: v } };
      }, `Module ${key} ${v ? 'activé' : 'désactivé'}`, 'Paramètres école'),
    setMessaging: (patch) =>
      mutate((d) => {
        d.school = { ...d.school, messaging: { ...d.school.messaging, ...patch } };
      }, 'Permissions de messagerie modifiées', JSON.stringify(patch)),
    setPrimaryLanguage: (l) =>
      mutate((d) => {
        d.school = { ...d.school, primaryLanguage: l };
      }, 'Langue principale modifiée', l),
    reviewJustification: (attendanceId, accepted) =>
      mutate(
        (d) => {
          d.attendance = d.attendance.map((a) =>
            a.id === attendanceId && a.justification ? { ...a, status: accepted ? 'excused' : 'unexcused', justification: { ...a.justification, status: accepted ? 'accepted' : 'rejected' } } : a,
          );
        },
        accepted ? 'Justificatif accepté' : 'Justificatif refusé',
        attendanceId,
      ),
    logAccess: (target) => mutate(() => {}, 'Consultation fiche élève', target),
    remindPayment: (paymentId) => mutate(() => {}, 'Relance de paiement envoyée', paymentId),
    markPaid: (paymentId) =>
      mutate((d) => {
        d.payments = d.payments.map((p) => (p.id === paymentId ? { ...p, status: 'paid', paidAt: DEMO_TODAY, method: 'cash', receiptNumber: `REC-2026-11-${Math.floor(1000 + Math.random() * 8999)}` } : p));
      }, 'Paiement enregistré au guichet', paymentId),
    setTeacherMessages: (teacherId, v) =>
      mutate((d) => {
        d.teachers = d.teachers.map((t) => (t.id === teacherId ? { ...t, acceptsMessages: v } : t));
      }, `Messagerie enseignant ${v ? 'activée' : 'désactivée'}`, teacherId),
    sendPush: ({ audience, classId, category, title, body }) => {
      const d0 = dbRef.current;
      const parentIds = [...new Set(d0.studentParents.filter((l) => audience === 'all' || getStudent(d0, l.studentId)?.classId === classId).map((l) => l.parentId))];
      mutate(
        (d) => {
          d.notifications = [...parentIds.map((pid, i) => ({ id: `n-push-${Date.now()}-${i}`, userId: pid, category, title, body, createdAt: stampNow(), read: false })), ...d.notifications];
        },
        'Notification push envoyée',
        `${title} → ${parentIds.length} familles`,
      );
      return parentIds.length;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function sessionStorageGet(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function useAdmin(): AdminStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdmin outside provider');
  return v;
}
