import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  childrenOf,
  createDemoDatabase,
  DEMO_TODAY,
  formatDate,
  getStudent,
  parentsOf,
  stampNow,
  studentForUser,
  subjectName,
  teacherDisplayName,
  teacherForUser,
  type AbsenceReason,
  type Announcement,
  type AppNotification,
  type AttendanceStatus,
  type Attachment,
  type DietaryProfile,
  type EduLinkDatabase,
  type Locale,
  type NotificationCategory,
  type Priority,
  type RSVP,
  type Session,
  type User,
} from '@edulink/shared';
import type { ThemeMode } from '../theme/ThemeProvider';
import type { TextScale } from '../theme/tokens';
import { translate } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/fr';
import { isSessionValid, login as authLogin, type LoginMethod, type LoginResult } from '../services/auth';
import { secureStorage, storage } from '../services/storage';

/* --------------------------------------------------------------------------------- */

export interface Prefs {
  locale: Locale;
  themeMode: ThemeMode;
  textScale: TextScale;
  onboardingDone: boolean;
  biometricEnabled: boolean;
  biometricPrompted: boolean;
  autoLockMinutes: number;
  notifications: Record<NotificationCategory, boolean>;
  dailyDigest: boolean;
  weeklySummary: boolean;
  privacy: { photo: boolean; contact: boolean; analytics: boolean };
}

export const DEFAULT_PREFS: Prefs = {
  locale: 'fr',
  themeMode: 'system',
  textScale: 1,
  onboardingDone: false,
  biometricEnabled: false,
  biometricPrompted: false,
  autoLockMinutes: 5,
  notifications: { urgent: true, grades: true, attendance: true, events: true, homework: true, messages: true, payments: true, transport: true },
  dailyDigest: true,
  weeklySummary: true,
  privacy: { photo: true, contact: false, analytics: true },
};

export interface Toast {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory | 'success' | 'info';
  link?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  start: string;
  submittedAt: string;
}

interface StoreValue {
  ready: boolean;
  db: EduLinkDatabase;
  prefs: Prefs;
  session: Session | null;
  user: User | null;
  locked: boolean;
  selectedChildId: string | null;
  toasts: Toast[];
  attendanceSessions: AttendanceSession[];
  /* Session */
  login: (method: LoginMethod, identifier: string, password: string) => LoginResult;
  logout: () => Promise<void>;
  setLocked: (v: boolean) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  selectChild: (id: string) => void;
  /* UI */
  showToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  /* Family actions */
  justifyAbsence: (attendanceId: string, reason: AbsenceReason, message: string, attachmentName?: string) => void;
  toggleHomework: (homeworkId: string, studentId: string) => void;
  rsvp: (eventId: string, studentId: string, response: RSVP) => void;
  signAuthorization: (eventId: string, studentId: string) => void;
  signDocument: (documentId: string) => void;
  acknowledgeAnnouncement: (announcementId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendMessage: (conversationId: string, body: string, attachment?: Attachment) => void;
  markConversationRead: (conversationId: string) => void;
  startConversation: (otherUserId: string, studentId?: string) => string;
  bookAppointment: (slotId: string, studentId: string, reason: string, mode: 'in_person' | 'video') => void;
  cancelAppointment: (appointmentId: string) => void;
  registerClub: (clubId: string, studentId: string) => 'registered' | 'waitlist';
  updateDietary: (profile: DietaryProfile) => void;
  payPayment: (paymentId: string) => void;
  /* Teacher actions */
  saveAttendance: (classId: string, start: string, entries: { studentId: string; status: AttendanceStatus; minutesLate?: number }[]) => { absent: number; late: number };
  publishGrades: (input: { classId: string; subjectId: string; examName: string; coefficient: number; date: string; entries: { studentId: string; score: number; comment?: string }[] }) => number;
  addHomework: (input: { classId: string; subjectId: string; title: string; description: string; dueDate: string; attachments: Attachment[] }) => void;
  addExam: (input: { classId: string; subjectId: string; title: string; date: string; time: string; chapters: string[]; room: string }) => void;
  addFeedback: (input: { studentId: string; kind: 'positive' | 'improvement'; text: string }) => void;
  publishAnnouncement: (input: { title: string; body: string; classIds: string[]; priority: Priority; requiresAck: boolean; scope: 'school' | 'class'; category?: Announcement['category'] }) => void;
  createEvent: (input: { title: string; emoji: string; date: string; time: string; location: string; classIds: string[]; requiresAuthorization: boolean; description: string }) => void;
  shareDocument: (input: { title: string; classIds: string[] }) => void;
  /* School actions */
  checkIn: (studentId: string, kind: 'entry' | 'exit', source: 'qr' | 'rfid' | 'nfc' | 'badge') => string;
  simulateTransport: (studentId: string, kind: 'arriving' | 'boarded' | 'arrivedSchool', minutes?: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const PREFS_KEY = 'edulink.prefs.v1';
const SESSION_KEY = 'edulink.session';
const CHILD_KEY = 'edulink.selectedChild';

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
const nowTime = () => stampNow().slice(11, 16);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<EduLinkDatabase>(() => createDemoDatabase());
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([
    { id: 'as-1', classId: 'cls-6-b', date: DEMO_TODAY, start: '08:00', submittedAt: `${DEMO_TODAY}T08:02:00` },
    { id: 'as-2', classId: 'cls-5-a', date: DEMO_TODAY, start: '09:00', submittedAt: `${DEMO_TODAY}T09:03:00` },
    { id: 'as-3', classId: 'cls-6-a', date: DEMO_TODAY, start: '10:15', submittedAt: `${DEMO_TODAY}T10:17:00` },
  ]);

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const dbRef = useRef(db);
  dbRef.current = db;

  /* Hydration */
  useEffect(() => {
    (async () => {
      const [p, s, c] = await Promise.all([storage.get<Partial<Prefs>>(PREFS_KEY), secureStorage.get(SESSION_KEY), storage.get<string>(CHILD_KEY)]);
      if (p) setPrefsState({ ...DEFAULT_PREFS, ...p, notifications: { ...DEFAULT_PREFS.notifications, ...(p.notifications ?? {}) } });
      if (s) {
        try {
          const parsed = JSON.parse(s) as Session;
          if (isSessionValid(parsed)) {
            setSession(parsed);
            if (p?.biometricEnabled) setLocked(true);
          }
        } catch {
          /* corrupted — ignore */
        }
      }
      if (c) setSelectedChildId(c);
      setReady(true);
    })();
  }, []);

  const user = useMemo(() => (session ? db.users.find((u) => u.id === session.userId) ?? null : null), [db.users, session]);

  /* Make sure a valid child is selected for parents/students. */
  useEffect(() => {
    if (!user) return;
    if (user.role === 'parent') {
      const kids = childrenOf(db, user.id);
      if (!kids.some((k) => k.id === selectedChildId)) setSelectedChildId(kids[0]?.id ?? null);
    } else if (user.role === 'student') {
      const me = studentForUser(db, user.id);
      if (me && me.id !== selectedChildId) setSelectedChildId(me.id);
    }
  }, [user, db, selectedChildId]);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      storage.set(PREFS_KEY, next);
      return next;
    });
  }, []);

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    const toast = { ...t, id: uid('toast') };
    setToasts((prev) => [...prev.slice(-2), toast]);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(t.category === 'urgent' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  /**
   * Creates notifications for every parent of a student (and the student account when
   * relevant) — the equivalent of the server's push fan-out (FCM / APNs). If the
   * signed-in user is a recipient, the push is displayed in-app as a banner.
   */
  const notifyFamily = useCallback(
    (draft: EduLinkDatabase, studentId: string, category: NotificationCategory, titleKey: TranslationKey, bodyKey: TranslationKey, params: Record<string, string | number>, link?: string, includeStudent = false) => {
      const locale = prefsRef.current.locale;
      const recipients = parentsOf(draft, studentId).map((p) => p.id);
      const student = getStudent(draft, studentId);
      if (includeStudent && student?.userId) recipients.push(student.userId);
      const created: AppNotification[] = recipients.map((userId) => ({
        id: uid('n'),
        userId,
        studentId,
        category,
        title: translate(locale, titleKey),
        body: translate(locale, bodyKey, params),
        createdAt: stampNow(),
        read: false,
        link,
      }));
      draft.notifications = [...created, ...draft.notifications];
      const me = sessionRef.current?.userId;
      const mine = created.find((n) => n.userId === me);
      if (mine && prefsRef.current.notifications[category]) {
        setTimeout(() => showToast({ title: mine.title, body: mine.body, category, link }), 0);
      }
    },
    [showToast],
  );

  /**
   * Applies a change synchronously on the latest snapshot (shallow copy + replaced arrays).
   * Not a functional updater on purpose: side effects such as push banners must run once.
   */
  const mutate = useCallback((fn: (draft: EduLinkDatabase) => void) => {
    const draft = { ...dbRef.current };
    fn(draft);
    dbRef.current = draft;
    setDb(draft);
  }, []);

  const audit = (draft: EduLinkDatabase, action: string, target: string) => {
    const u = draft.users.find((x) => x.id === sessionRef.current?.userId);
    draft.auditLogs = [{ id: uid('log'), at: stampNow(), actorId: u?.id ?? 'system', actorName: u ? `${u.title ?? ''} ${u.firstName} ${u.lastName}`.trim() : 'Système', action, target }, ...draft.auditLogs];
  };

  /* ------------------------------------------------------------------ Session */

  const login = useCallback<StoreValue['login']>((method, identifier, password) => {
    const res = authLogin(dbRef.current, method, identifier, password);
    if (res.ok) {
      setSession(res.session);
      setLocked(false);
      secureStorage.set(SESSION_KEY, JSON.stringify(res.session));
      mutate((d) => audit(d, 'Connexion réussie', `Application mobile — ${Platform.OS}`));
      if (res.user.role === 'parent' && !selectedChildId) {
        setSelectedChildId(childrenOf(dbRef.current, res.user.id)[0]?.id ?? null);
      }
    }
    return res;
  }, [mutate, selectedChildId]);

  const logout = useCallback(async () => {
    await secureStorage.remove(SESSION_KEY);
    setSession(null);
    setLocked(false);
    setToasts([]);
  }, []);

  const selectChild = useCallback((id: string) => {
    setSelectedChildId(id);
    storage.set(CHILD_KEY, id);
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
  }, []);

  /* ------------------------------------------------------------------ Family */

  const justifyAbsence: StoreValue['justifyAbsence'] = (attendanceId, reason, message, attachmentName) =>
    mutate((d) => {
      d.attendance = d.attendance.map((a) =>
        a.id === attendanceId
          ? { ...a, justification: { reason, message, attachmentName, submittedAt: stampNow(), submittedBy: sessionRef.current!.userId, status: 'pending' } }
          : a,
      );
      audit(d, 'Justificatif d\'absence envoyé', attendanceId);
    });

  const toggleHomework: StoreValue['toggleHomework'] = (homeworkId, studentId) =>
    mutate((d) => {
      const exists = d.homeworkCompletions.some((c) => c.homeworkId === homeworkId && c.studentId === studentId);
      d.homeworkCompletions = exists
        ? d.homeworkCompletions.filter((c) => !(c.homeworkId === homeworkId && c.studentId === studentId))
        : [...d.homeworkCompletions, { homeworkId, studentId, completedAt: stampNow() }];
    });

  const upsertParticipation = (d: EduLinkDatabase, eventId: string, studentId: string, patch: Partial<EduLinkDatabase['eventParticipants'][number]>) => {
    const exists = d.eventParticipants.some((p) => p.eventId === eventId && p.studentId === studentId);
    d.eventParticipants = exists
      ? d.eventParticipants.map((p) => (p.eventId === eventId && p.studentId === studentId ? { ...p, ...patch } : p))
      : [...d.eventParticipants, { eventId, studentId, ...patch }];
  };

  const rsvp: StoreValue['rsvp'] = (eventId, studentId, response) => mutate((d) => upsertParticipation(d, eventId, studentId, { response }));

  const signAuthorization: StoreValue['signAuthorization'] = (eventId, studentId) =>
    mutate((d) => {
      upsertParticipation(d, eventId, studentId, { authorizationSignedAt: stampNow(), signedBy: sessionRef.current!.userId, response: 'yes' });
      const ev = d.events.find((e) => e.id === eventId);
      d.documents = d.documents.map((doc) =>
        doc.category === 'authorization' && ev && doc.title.includes(ev.title) ? { ...doc, signedAt: stampNow(), signedBy: sessionRef.current!.userId } : doc,
      );
      audit(d, 'Autorisation signée électroniquement', ev?.title ?? eventId);
    });

  const signDocument: StoreValue['signDocument'] = (documentId) =>
    mutate((d) => {
      const doc = d.documents.find((x) => x.id === documentId);
      d.documents = d.documents.map((x) => (x.id === documentId ? { ...x, signedAt: stampNow(), signedBy: sessionRef.current!.userId } : x));
      // Signing the Bardo authorisation also records the event authorisation for the children concerned.
      if (doc?.category === 'authorization') {
        const ev = d.events.find((e) => doc.title.includes(e.title));
        if (ev) for (const kid of childrenOf(d, sessionRef.current!.userId)) {
          if (ev.classIds.length === 0 || ev.classIds.includes(kid.classId)) upsertParticipation(d, ev.id, kid.id, { authorizationSignedAt: stampNow(), signedBy: sessionRef.current!.userId });
        }
      }
      audit(d, 'Document signé électroniquement', doc?.title ?? documentId);
    });

  const acknowledgeAnnouncement: StoreValue['acknowledgeAnnouncement'] = (id) =>
    mutate((d) => {
      const me = sessionRef.current!.userId;
      d.announcements = d.announcements.map((a) => (a.id === id && !a.acknowledgedBy.includes(me) ? { ...a, acknowledgedBy: [...a.acknowledgedBy, me] } : a));
    });

  const markNotificationRead: StoreValue['markNotificationRead'] = (id) =>
    mutate((d) => {
      d.notifications = d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    });

  const markAllNotificationsRead = () =>
    mutate((d) => {
      const me = sessionRef.current?.userId;
      d.notifications = d.notifications.map((n) => (n.userId === me ? { ...n, read: true } : n));
    });

  const sendMessage: StoreValue['sendMessage'] = (conversationId, body, attachment) => {
    const me = sessionRef.current!.userId;
    mutate((d) => {
      d.messages = [...d.messages, { id: uid('m'), conversationId, senderId: me, body, sentAt: stampNow(), attachment }];
      const conv = d.conversations.find((c) => c.id === conversationId);
      const sender = d.users.find((u) => u.id === me);
      for (const other of conv?.participantIds.filter((p) => p !== me) ?? []) {
        d.notifications = [{ id: uid('n'), userId: other, category: 'messages', title: translate(prefsRef.current.locale, 'notifications.cat.messages'), body: translate(prefsRef.current.locale, 'push.newMessage', { name: sender ? `${sender.title ?? sender.firstName} ${sender.lastName}` : '' }), createdAt: stampNow(), read: false, link: `/chat/${conversationId}` }, ...d.notifications];
      }
    });
    // Simulated read receipt a few seconds later (the teacher opens the message).
    setTimeout(() => {
      mutate((d) => {
        d.messages = d.messages.map((m) => (m.conversationId === conversationId && m.senderId === me && !m.readAt ? { ...m, readAt: stampNow() } : m));
      });
    }, 4000);
  };

  const markConversationRead: StoreValue['markConversationRead'] = (conversationId) => {
    const me = sessionRef.current?.userId;
    if (!me) return;
    const unread = dbRef.current.messages.some((m) => m.conversationId === conversationId && m.senderId !== me && !m.readAt);
    if (!unread) return;
    mutate((d) => {
      d.messages = d.messages.map((m) => (m.conversationId === conversationId && m.senderId !== me && !m.readAt ? { ...m, readAt: stampNow() } : m));
      d.notifications = d.notifications.map((n) => (n.userId === me && n.link === `/chat/${conversationId}` ? { ...n, read: true } : n));
    });
  };

  const startConversation: StoreValue['startConversation'] = (otherUserId, studentId) => {
    const me = sessionRef.current!.userId;
    const existing = dbRef.current.conversations.find((c) => c.participantIds.includes(me) && c.participantIds.includes(otherUserId) && (!studentId || c.studentId === studentId));
    if (existing) return existing.id;
    const id = uid('conv');
    mutate((d) => {
      const other = d.users.find((u) => u.id === otherUserId)!;
      const teacher = teacherForUser(d, otherUserId);
      const category = other.role === 'teacher' ? 'teacher' : other.role === 'parent' ? 'teacher' : 'administration';
      const title = other.role === 'teacher' ? teacherDisplayName(teacher) : other.role === 'parent' ? `${other.title ?? ''} ${other.firstName} ${other.lastName}`.trim() : `${other.firstName} ${other.lastName}`;
      const subtitle = teacher ? `Professeur de ${subjectName(teacher.subjectIds[0], 'fr')}` : other.role === 'parent' && studentId ? `Parent de ${getStudent(d, studentId)?.firstName}` : 'Administration';
      d.conversations = [{ id, category, participantIds: [me, otherUserId], studentId, title, subtitle, avatarColor: other.avatarColor }, ...d.conversations];
    });
    return id;
  };

  const bookAppointment: StoreValue['bookAppointment'] = (slotId, studentId, reason, mode) =>
    mutate((d) => {
      const slot = d.appointmentSlots.find((s) => s.id === slotId);
      if (!slot || slot.bookedBy) return;
      const me = sessionRef.current!.userId;
      d.appointmentSlots = d.appointmentSlots.map((s) => (s.id === slotId ? { ...s, bookedBy: me } : s));
      d.appointments = [{ id: uid('apt'), slotId, parentId: me, teacherId: slot.teacherId, studentId, date: slot.date, start: slot.start, end: slot.end, reason, mode, status: 'confirmed' }, ...d.appointments];
    });

  const cancelAppointment: StoreValue['cancelAppointment'] = (appointmentId) =>
    mutate((d) => {
      const apt = d.appointments.find((a) => a.id === appointmentId);
      d.appointments = d.appointments.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' } : a));
      if (apt) d.appointmentSlots = d.appointmentSlots.map((s) => (s.id === apt.slotId ? { ...s, bookedBy: undefined } : s));
    });

  const registerClub: StoreValue['registerClub'] = (clubId, studentId) => {
    const club = dbRef.current.clubs.find((c) => c.id === clubId)!;
    const status = club.enrolled >= club.capacity ? 'waitlist' : 'registered';
    mutate((d) => {
      d.clubRegistrations = [...d.clubRegistrations.filter((r) => !(r.clubId === clubId && r.studentId === studentId)), { clubId, studentId, status, registeredAt: DEMO_TODAY }];
      if (status === 'registered') d.clubs = d.clubs.map((c) => (c.id === clubId ? { ...c, enrolled: c.enrolled + 1 } : c));
    });
    return status;
  };

  const updateDietary: StoreValue['updateDietary'] = (profile) =>
    mutate((d) => {
      d.dietaryProfiles = [...d.dietaryProfiles.filter((p) => p.studentId !== profile.studentId), { ...profile, updatedAt: DEMO_TODAY }];
    });

  const payPayment: StoreValue['payPayment'] = (paymentId) =>
    mutate((d) => {
      d.payments = d.payments.map((p) => (p.id === paymentId ? { ...p, status: 'paid', paidAt: DEMO_TODAY, method: 'card', receiptNumber: `REC-2026-11-${Math.floor(1000 + Math.random() * 8999)}` } : p));
      audit(d, 'Paiement en ligne', paymentId);
    });

  /* ------------------------------------------------------------------ Teacher */

  const myTeacher = () => teacherForUser(dbRef.current, sessionRef.current?.userId ?? '');

  const saveAttendance: StoreValue['saveAttendance'] = (classId, start, entries) => {
    let absent = 0;
    let late = 0;
    mutate((d) => {
      for (const e of entries) {
        const id = `att-${e.studentId}-${DEMO_TODAY}`;
        const prev = d.attendance.find((a) => a.id === id);
        const student = getStudent(d, e.studentId)!;
        // Don't override a QR check-in that already recorded a present student.
        const checkIn = e.status === 'present' ? prev?.checkIn ?? start : e.status === 'late' ? addMinutes(start, e.minutesLate ?? 10) : undefined;
        const record = { ...(prev ?? {}), id, studentId: e.studentId, date: DEMO_TODAY, status: e.status, checkIn, checkOut: e.status === 'absent' ? undefined : prev?.checkOut, minutesLate: e.status === 'late' ? e.minutesLate ?? 10 : undefined, source: prev?.source === 'qr' && e.status === 'present' ? 'qr' as const : 'teacher' as const };
        d.attendance = prev ? d.attendance.map((a) => (a.id === id ? record : a)) : [...d.attendance, record];
        const changed = !prev || prev.status !== e.status;
        if (e.status === 'absent') {
          absent++;
          if (changed) notifyFamily(d, e.studentId, 'attendance', 'attendance.status.absent', 'push.absent', { name: student.firstName }, '/attendance');
        }
        if (e.status === 'late') {
          late++;
          if (changed) notifyFamily(d, e.studentId, 'attendance', 'attendance.status.late', 'push.late', { name: student.firstName, n: e.minutesLate ?? 10 }, '/attendance');
        }
      }
      audit(d, 'Appel effectué', `${d.classes.find((c) => c.id === classId)?.name} — ${start}`);
    });
    setAttendanceSessions((prev) => [...prev.filter((s) => !(s.classId === classId && s.start === start)), { id: uid('as'), classId, date: DEMO_TODAY, start, submittedAt: stampNow() }]);
    return { absent, late };
  };

  const publishGrades: StoreValue['publishGrades'] = ({ classId, subjectId, examName, coefficient, date, entries }) => {
    const teacher = myTeacher();
    if (!teacher || !entries.length) return 0;
    const avg = Math.round((entries.reduce((s, e) => s + e.score, 0) / entries.length) * 10) / 10;
    mutate((d) => {
      d.grades = [
        ...entries.map((e) => ({ id: uid('gr'), studentId: e.studentId, subjectId, teacherId: teacher.id, examName, date, score: e.score, outOf: 20, coefficient, classAverage: avg, comment: e.comment, term: 1 })),
        ...d.grades,
      ];
      for (const e of entries) {
        notifyFamily(d, e.studentId, 'grades', 'notifications.cat.grades', 'push.newGrade', { subject: subjectName(subjectId, prefsRef.current.locale), score: e.score, outOf: 20 }, `/grades/${subjectId}`, true);
      }
      audit(d, 'Notes publiées', `${d.classes.find((c) => c.id === classId)?.name} — ${examName}`);
    });
    return entries.length;
  };

  const addHomework: StoreValue['addHomework'] = ({ classId, subjectId, title, description, dueDate, attachments }) => {
    const teacher = myTeacher();
    if (!teacher) return;
    mutate((d) => {
      d.homework = [{ id: uid('hw'), classId, subjectId, teacherId: teacher.id, title, description, assignedAt: DEMO_TODAY, dueDate, attachments }, ...d.homework];
      for (const s of d.students.filter((x) => x.classId === classId)) {
        notifyFamily(d, s.id, 'homework', 'notifications.cat.homework', 'push.newHomework', { subject: subjectName(subjectId, prefsRef.current.locale), date: formatDate(dueDate, prefsRef.current.locale, 'dayMonth') }, '/homework', true);
      }
    });
  };

  const addExam: StoreValue['addExam'] = ({ classId, subjectId, title, date, time, chapters, room }) => {
    const teacher = myTeacher();
    if (!teacher) return;
    mutate((d) => {
      d.exams = [...d.exams, { id: uid('ex'), classId, subjectId, teacherId: teacher.id, title, date, time, durationMinutes: 55, room, chapters, revisionDocs: [] }];
    });
  };

  const addFeedback: StoreValue['addFeedback'] = ({ studentId, kind, text }) => {
    const teacher = myTeacher();
    if (!teacher) return;
    mutate((d) => {
      d.feedback = [{ id: uid('fb'), studentId, teacherId: teacher.id, subjectId: teacher.subjectIds[0], kind, text, date: DEMO_TODAY }, ...d.feedback];
      notifyFamily(d, studentId, 'grades', 'behavior.title', 'push.feedback', { name: teacherDisplayName(teacher) }, '/behavior');
    });
  };

  const publishAnnouncement: StoreValue['publishAnnouncement'] = ({ title, body, classIds, priority, requiresAck, scope, category }) =>
    mutate((d) => {
      const u = d.users.find((x) => x.id === sessionRef.current?.userId);
      const teacher = u ? teacherForUser(d, u.id) : undefined;
      const recipients = scope === 'school' ? d.users.filter((x) => x.role === 'parent').length : d.studentParents.filter((l) => classIds.includes(getStudent(d, l.studentId)?.classId ?? '')).length;
      d.announcements = [{
        id: uid('ann'), title, body, publishedAt: stampNow(), authorId: u?.id ?? 'system',
        authorName: teacher ? teacherDisplayName(teacher) : u ? `${u.title ?? ''} ${u.firstName} ${u.lastName} — Direction`.trim() : 'Direction',
        scope, classIds, category: category ?? (priority === 'critical' ? 'closure' : 'general'), priority, requiresAck, acknowledgedBy: [], recipientCount: recipients,
      }, ...d.announcements];
      const targets = scope === 'school' ? d.studentParents : d.studentParents.filter((l) => classIds.includes(getStudent(d, l.studentId)?.classId ?? ''));
      const locale = prefsRef.current.locale;
      const parentIds = [...new Set(targets.map((l) => l.parentId))];
      d.notifications = [
        ...parentIds.map((pid) => ({ id: uid('n'), userId: pid, category: (priority === 'critical' ? 'urgent' : 'events') as NotificationCategory, title: priority === 'critical' ? translate(locale, 'home.importantInfo') : translate(locale, 'announcements.title'), body: title, createdAt: stampNow(), read: false, link: '/announcements' })),
        ...d.notifications,
      ];
      audit(d, priority === 'critical' ? 'Alerte critique publiée' : 'Annonce publiée', title);
    });

  const createEvent: StoreValue['createEvent'] = ({ title, emoji, date, time, location, classIds, requiresAuthorization, description }) =>
    mutate((d) => {
      const teacher = myTeacher();
      d.events = [...d.events, { id: uid('ev'), title, emoji, description, date, time, location, category: 'class', classIds, requiresAuthorization, organizer: teacher ? teacherDisplayName(teacher) : 'Direction' }];
    });

  const shareDocument: StoreValue['shareDocument'] = ({ title, classIds }) =>
    mutate((d) => {
      const teacher = myTeacher();
      d.documents = [{ id: uid('doc'), title, category: 'pedagogical', date: DEMO_TODAY, size: '210 Ko', fileType: 'pdf', classIds, requiresSignature: false, sharedBy: teacherDisplayName(teacher) }, ...d.documents];
    });

  /* ------------------------------------------------------------------ School */

  const checkIn: StoreValue['checkIn'] = (studentId, kind, source) => {
    const time = nowTime();
    mutate((d) => {
      const id = `att-${studentId}-${DEMO_TODAY}`;
      const prev = d.attendance.find((a) => a.id === id);
      const student = getStudent(d, studentId)!;
      const base = prev ?? { id, studentId, date: DEMO_TODAY, status: 'present' as AttendanceStatus, source };
      const next = kind === 'entry'
        ? { ...base, status: (time > '08:05' ? 'late' : 'present') as AttendanceStatus, checkIn: time, minutesLate: time > '08:05' ? Math.max(1, toMin(time) - toMin('08:00')) : undefined, checkOut: undefined, source }
        : { ...base, checkOut: time, source };
      d.attendance = prev ? d.attendance.map((a) => (a.id === id ? next : a)) : [...d.attendance, next];
      if (kind === 'entry') notifyFamily(d, studentId, 'attendance', 'attendance.entry', 'push.entered', { name: student.firstName, time }, '/attendance');
      else notifyFamily(d, studentId, 'attendance', 'attendance.exit', 'push.left', { name: student.firstName, time }, '/attendance');
    });
    return time;
  };

  const simulateTransport: StoreValue['simulateTransport'] = (studentId, kind, minutes) =>
    mutate((d) => {
      const student = getStudent(d, studentId)!;
      if (kind === 'arriving') notifyFamily(d, studentId, 'transport', 'transport.title', 'transport.arrivingSoon', { n: minutes ?? 5 }, '/transport');
      if (kind === 'boarded') notifyFamily(d, studentId, 'transport', 'transport.title', 'push.boarded', { name: student.firstName }, '/transport');
      if (kind === 'arrivedSchool') notifyFamily(d, studentId, 'transport', 'transport.title', 'transport.arrived', {}, '/transport');
    });

  const value: StoreValue = {
    ready, db, prefs, session, user, locked, selectedChildId, toasts, attendanceSessions,
    login, logout, setLocked, setPrefs, selectChild, showToast, dismissToast,
    justifyAbsence, toggleHomework, rsvp, signAuthorization, signDocument, acknowledgeAnnouncement,
    markNotificationRead, markAllNotificationsRead, sendMessage, markConversationRead, startConversation,
    bookAppointment, cancelAppointment, registerClub, updateDietary, payPayment,
    saveAttendance, publishGrades, addHomework, addExam, addFeedback, publishAnnouncement, createEvent, shareDocument,
    checkIn, simulateTransport,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
function addMinutes(t: string, n: number) {
  const m = toMin(t) + n;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}

/** The currently selected child (parents) or the student themself. */
export function useCurrentStudent() {
  const { db, selectedChildId } = useStore();
  return selectedChildId ? getStudent(db, selectedChildId) ?? null : null;
}

