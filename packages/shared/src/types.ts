/**
 * EduLink domain model.
 *
 * These types mirror the PostgreSQL schema in `supabase/migrations` (snake_case in SQL,
 * camelCase here). Dates are ISO strings: `YYYY-MM-DD` for calendar days, `HH:mm` for
 * times of day and full ISO-8601 for timestamps.
 */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // 2026-11-16T08:05:00
export type TimeOfDay = string; // HH:mm

export type Locale = 'fr' | 'ar' | 'en';
export type Role = 'parent' | 'student' | 'teacher' | 'admin';
export type SchoolLevel = 'primaire' | 'college' | 'lycee';

export interface SchoolModules {
  payments: boolean;
  transport: boolean;
  canteen: boolean;
  clubs: boolean;
  appointments: boolean;
  qrCheckIn: boolean;
  voiceMessages: boolean;
}

export interface MessagingPolicy {
  /** Parents may start a conversation with a teacher. */
  parentToTeacher: boolean;
  /** Parents may contact administration, transport and accounting. */
  parentToStaff: boolean;
  /** Students may use messaging at all. */
  studentMessaging: boolean;
  /** Attachments (images, documents) allowed. */
  attachments: boolean;
  /** Messages outside these hours are delivered next morning (teacher well-being). */
  quietHours: { start: TimeOfDay; end: TimeOfDay };
}

export interface School {
  id: ID;
  name: string;
  shortName: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principal: string;
  primaryLanguage: Locale;
  levels: SchoolLevel[];
  academicYear: string;
  currency: string;
  modules: SchoolModules;
  messaging: MessagingPolicy;
}

export interface User {
  id: ID;
  role: Role;
  firstName: string;
  lastName: string;
  title?: 'M.' | 'Mme';
  email: string;
  phone?: string;
  /** School-issued identifier usable at login (e.g. HZ-P-0001). */
  schoolCode?: string;
  avatarColor: string;
  activated: boolean;
  lastActiveAt?: ISODateTime;
  preferredLocale?: Locale;
}

export interface Subject {
  id: ID;
  name: string;
  shortName: string;
  /** Key into the pastel subject palette. */
  color: SubjectColor;
  icon: string;
  coefficient: number;
}

export type SubjectColor =
  | 'blue'
  | 'violet'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'green'
  | 'sky'
  | 'orange'
  | 'slate';

export interface Teacher {
  id: ID;
  userId: ID;
  title: 'M.' | 'Mme';
  firstName: string;
  lastName: string;
  subjectIds: ID[];
  classIds: ID[];
  email: string;
  /** Teachers can opt out of direct messages; administration controls this too. */
  acceptsMessages: boolean;
}

export interface ClassRoom {
  id: ID;
  name: string; // "6ème B"
  level: SchoolLevel;
  grade: string; // "6ème"
  section: string; // "B"
  homeroomTeacherId: ID;
  room: string;
  studentCount: number;
  /** Aggregated class average for the current term (analytics). */
  average: number;
}

export interface Student {
  id: ID;
  userId?: ID;
  firstName: string;
  lastName: string;
  gender: 'F' | 'M';
  birthDate: ISODate;
  classId: ID;
  studentNumber: string;
  avatarColor: string;
  enrolledAt: ISODate;
}

export interface StudentParent {
  studentId: ID;
  parentId: ID;
  relation: 'mère' | 'père' | 'tuteur' | 'tutrice';
  isPrimaryContact: boolean;
}

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused'
  | 'unexcused'
  | 'early_leave';

export type CheckInSource = 'qr' | 'rfid' | 'nfc' | 'badge' | 'teacher' | 'admin';

export interface AttendanceRecord {
  id: ID;
  studentId: ID;
  date: ISODate;
  status: AttendanceStatus;
  checkIn?: TimeOfDay;
  checkOut?: TimeOfDay;
  minutesLate?: number;
  source: CheckInSource;
  /** Justification sent by a parent. */
  justification?: AbsenceJustification;
  note?: string;
}

export type AbsenceReason = 'illness' | 'medical' | 'family' | 'transport' | 'other';

export interface AbsenceJustification {
  reason: AbsenceReason;
  message: string;
  attachmentName?: string;
  submittedAt: ISODateTime;
  submittedBy: ID;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Grade {
  id: ID;
  studentId: ID;
  subjectId: ID;
  teacherId: ID;
  examName: string;
  date: ISODate;
  score: number;
  outOf: number;
  coefficient: number;
  classAverage: number;
  comment?: string;
  term: number;
}

export interface Attachment {
  id: ID;
  name: string;
  kind: 'pdf' | 'image' | 'document' | 'link' | 'audio';
  size?: string;
  url?: string;
}

export interface Exam {
  id: ID;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  title: string;
  date: ISODate;
  time: TimeOfDay;
  durationMinutes: number;
  room: string;
  chapters: string[];
  revisionDocs: Attachment[];
}

export interface Homework {
  id: ID;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  title: string;
  description: string;
  assignedAt: ISODate;
  dueDate: ISODate;
  attachments: Attachment[];
  estimatedMinutes?: number;
}

export interface HomeworkCompletion {
  homeworkId: ID;
  studentId: ID;
  completedAt: ISODateTime;
}

export interface TimetableSlot {
  id: ID;
  classId: ID;
  /** 1 = Monday … 5 = Friday */
  day: number;
  start: TimeOfDay;
  end: TimeOfDay;
  /** null for breaks/lunch */
  subjectId: ID | null;
  label?: string;
  room?: string;
  teacherId?: ID;
}

export type AnnouncementCategory =
  | 'closure'
  | 'timetable'
  | 'teacher_absence'
  | 'transport'
  | 'administrative'
  | 'security'
  | 'general';

export type Priority = 'normal' | 'important' | 'critical';

export interface Announcement {
  id: ID;
  title: string;
  body: string;
  publishedAt: ISODateTime;
  authorId: ID;
  authorName: string;
  scope: 'school' | 'class';
  classIds: ID[];
  category: AnnouncementCategory;
  priority: Priority;
  /** Emergency communication: parents must confirm "J'ai lu l'information". */
  requiresAck: boolean;
  acknowledgedBy: ID[];
  /** Number of parent recipients — used for acknowledgement rate. */
  recipientCount: number;
}

export type NewsCategory = 'school' | 'class' | 'activities' | 'sport' | 'culture' | 'administrative';

export interface NewsArticle {
  id: ID;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: ISODate;
  category: NewsCategory;
  cover: { from: string; to: string; icon: string };
  readMinutes: number;
}

export type EventCategory = 'show' | 'sport' | 'meeting' | 'trip' | 'culture' | 'ceremony' | 'class';

export interface SchoolEvent {
  id: ID;
  title: string;
  emoji: string;
  description: string;
  date: ISODate;
  time?: TimeOfDay;
  endTime?: TimeOfDay;
  location: string;
  category: EventCategory;
  classIds: ID[]; // empty = whole school
  requiresAuthorization: boolean;
  cost?: number;
  organizer: string;
}

export type RSVP = 'yes' | 'no' | 'maybe';

export interface EventParticipation {
  eventId: ID;
  studentId: ID;
  response?: RSVP;
  authorizationSignedAt?: ISODateTime;
  signedBy?: ID;
}

export type ConversationCategory = 'teacher' | 'administration' | 'transport' | 'accounting';

export interface Conversation {
  id: ID;
  category: ConversationCategory;
  /** User ids (parent, teacher, staff) */
  participantIds: ID[];
  studentId?: ID;
  title: string;
  subtitle: string;
  avatarColor: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  body: string;
  sentAt: ISODateTime;
  readAt?: ISODateTime;
  attachment?: Attachment;
}

export type DocumentCategory =
  | 'report_card'
  | 'certificate'
  | 'rules'
  | 'authorization'
  | 'timetable'
  | 'invoice'
  | 'pedagogical';

export interface SchoolDocument {
  id: ID;
  title: string;
  category: DocumentCategory;
  date: ISODate;
  size: string;
  fileType: 'pdf' | 'docx' | 'image';
  /** undefined = available to every family in the classes listed */
  studentId?: ID;
  classIds?: ID[];
  requiresSignature: boolean;
  signedAt?: ISODateTime;
  signedBy?: ID;
  sharedBy?: string;
}

export interface ReportCardSubject {
  subjectId: ID;
  average: number;
  classAverage: number;
  appreciation: string;
}

export interface ReportCard {
  id: ID;
  studentId: ID;
  academicYear: string;
  classLabel: string;
  period: string; // "Trimestre 1"
  term: number;
  average: number;
  classAverage: number;
  rank?: number;
  classSize?: number;
  subjects: ReportCardSubject[];
  teacherObservation: string;
  principalComment: string;
  mention?: string;
  publishedAt: ISODate;
  status: 'published' | 'in_progress';
}

export type PaymentCategory = 'tuition' | 'transport' | 'canteen' | 'activities' | 'books' | 'trips';

export interface Payment {
  id: ID;
  studentId: ID;
  category: PaymentCategory;
  label: string;
  amount: number;
  dueDate: ISODate;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: ISODate;
  receiptNumber?: string;
  method?: 'card' | 'transfer' | 'cash' | 'cheque';
}

export interface Bus {
  id: ID;
  number: number;
  driverFirstName: string;
  plate: string;
  capacity: number;
}

export interface TransportStop {
  id: ID;
  name: string;
  time: TimeOfDay;
}

export interface TransportRoute {
  id: ID;
  busId: ID;
  name: string;
  direction: 'to_school' | 'to_home';
  stops: TransportStop[];
}

export interface BusAssignment {
  studentId: ID;
  busId: ID;
  morningRouteId: ID;
  eveningRouteId: ID;
  /** The family's own stop — the only location shown to that family. */
  stopName: string;
}

export interface TransportLiveStatus {
  busId: ID;
  routeId: ID;
  state: 'en_route' | 'at_school' | 'parked' | 'delayed';
  /** Index of the next stop on the route */
  nextStopIndex: number;
  etaToFamilyStop?: TimeOfDay;
  delayMinutes: number;
  updatedAt: ISODateTime;
}

export type NotificationCategory =
  | 'urgent'
  | 'grades'
  | 'attendance'
  | 'events'
  | 'homework'
  | 'messages'
  | 'payments'
  | 'transport';

export interface AppNotification {
  id: ID;
  userId: ID;
  studentId?: ID;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: ISODateTime;
  read: boolean;
  /** In-app route, e.g. "/attendance" */
  link?: string;
}

export interface TeacherFeedback {
  id: ID;
  studentId: ID;
  teacherId: ID;
  subjectId?: ID;
  kind: 'positive' | 'improvement';
  text: string;
  date: ISODate;
}

export interface AppointmentSlot {
  id: ID;
  teacherId: ID;
  date: ISODate;
  start: TimeOfDay;
  end: TimeOfDay;
  bookedBy?: ID;
}

export interface Appointment {
  id: ID;
  slotId: ID;
  parentId: ID;
  teacherId: ID;
  studentId: ID;
  date: ISODate;
  start: TimeOfDay;
  end: TimeOfDay;
  reason: string;
  mode: 'in_person' | 'video';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

export interface Club {
  id: ID;
  name: string;
  emoji: string;
  description: string;
  schedule: string;
  supervisor: string;
  capacity: number;
  enrolled: number;
  levels: SchoolLevel[];
  fee?: number;
}

export interface ClubRegistration {
  clubId: ID;
  studentId: ID;
  status: 'registered' | 'waitlist';
  registeredAt: ISODate;
}

export interface CanteenMenu {
  date: ISODate;
  starter: string;
  main: string;
  side?: string;
  dessert: string;
  vegetarian: string;
  allergens: string[];
}

export interface DietaryProfile {
  studentId: ID;
  allergies: string[];
  preferences: string[];
  notes: string;
  updatedAt?: ISODate;
}

export interface Holiday {
  id: ID;
  label: string;
  start: ISODate;
  end: ISODate;
}

export interface AuditLog {
  id: ID;
  at: ISODateTime;
  actorId: ID;
  actorName: string;
  action: string;
  target: string;
}

export interface EduLinkDatabase {
  school: School;
  users: User[];
  students: Student[];
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  studentParents: StudentParent[];
  attendance: AttendanceRecord[];
  grades: Grade[];
  exams: Exam[];
  homework: Homework[];
  homeworkCompletions: HomeworkCompletion[];
  timetable: TimetableSlot[];
  announcements: Announcement[];
  news: NewsArticle[];
  events: SchoolEvent[];
  eventParticipants: EventParticipation[];
  conversations: Conversation[];
  messages: Message[];
  documents: SchoolDocument[];
  reportCards: ReportCard[];
  payments: Payment[];
  buses: Bus[];
  routes: TransportRoute[];
  busAssignments: BusAssignment[];
  transportLive: TransportLiveStatus[];
  notifications: AppNotification[];
  feedback: TeacherFeedback[];
  appointmentSlots: AppointmentSlot[];
  appointments: Appointment[];
  clubs: Club[];
  clubRegistrations: ClubRegistration[];
  canteenMenus: CanteenMenu[];
  dietaryProfiles: DietaryProfile[];
  holidays: Holiday[];
  auditLogs: AuditLog[];
}

export interface Session {
  userId: ID;
  role: Role;
  /** Opaque token (JWT in production). */
  token: string;
  issuedAt: ISODateTime;
  expiresAt: ISODateTime;
}
