import type { AttendanceStatus, NotificationCategory, PaymentCategory, DocumentCategory, EventCategory } from '@edulink/shared';
import type { IconName, PillTone } from '../components/ui';
import type { TranslationKey } from '../i18n/fr';

/** Attendance status → icon + emoji + tone + label. Status is never conveyed by colour alone. */
export const ATTENDANCE_META: Record<AttendanceStatus, { icon: IconName; emoji: string; tone: PillTone; key: TranslationKey }> = {
  present: { icon: 'checkmark-circle', emoji: '✅', tone: 'success', key: 'attendance.status.present' },
  late: { icon: 'time', emoji: '⏰', tone: 'warning', key: 'attendance.status.late' },
  absent: { icon: 'close-circle', emoji: '🔴', tone: 'error', key: 'attendance.status.absent' },
  excused: { icon: 'document-text', emoji: '🔵', tone: 'info', key: 'attendance.status.excused' },
  unexcused: { icon: 'alert-circle', emoji: '🔴', tone: 'error', key: 'attendance.status.unexcused' },
  early_leave: { icon: 'exit', emoji: '🟣', tone: 'academic', key: 'attendance.status.early_leave' },
};

export const NOTIFICATION_META: Record<NotificationCategory, { icon: IconName; emoji: string; tone: PillTone; key: TranslationKey }> = {
  urgent: { icon: 'warning', emoji: '🔴', tone: 'error', key: 'notifications.cat.urgent' },
  grades: { icon: 'stats-chart', emoji: '📚', tone: 'academic', key: 'notifications.cat.grades' },
  attendance: { icon: 'checkmark-done', emoji: '✅', tone: 'success', key: 'notifications.cat.attendance' },
  events: { icon: 'calendar', emoji: '📅', tone: 'event', key: 'notifications.cat.events' },
  homework: { icon: 'create', emoji: '📝', tone: 'info', key: 'notifications.cat.homework' },
  messages: { icon: 'chatbubbles', emoji: '💬', tone: 'info', key: 'notifications.cat.messages' },
  payments: { icon: 'card', emoji: '💳', tone: 'neutral', key: 'notifications.cat.payments' },
  transport: { icon: 'bus', emoji: '🚌', tone: 'warning', key: 'notifications.cat.transport' },
};

export const PAYMENT_ICON: Record<PaymentCategory, { icon: IconName; key: TranslationKey }> = {
  tuition: { icon: 'school', key: 'payments.cat.tuition' },
  transport: { icon: 'bus', key: 'payments.cat.transport' },
  canteen: { icon: 'restaurant', key: 'payments.cat.canteen' },
  activities: { icon: 'color-palette', key: 'payments.cat.activities' },
  books: { icon: 'book', key: 'payments.cat.books' },
  trips: { icon: 'map', key: 'payments.cat.trips' },
};

export const DOCUMENT_ICON: Record<DocumentCategory, IconName> = {
  report_card: 'ribbon',
  certificate: 'shield-checkmark',
  rules: 'reader',
  authorization: 'create',
  timetable: 'grid',
  invoice: 'receipt',
  pedagogical: 'library',
};

export const EVENT_TONE: Record<EventCategory, PillTone> = {
  show: 'event',
  sport: 'warning',
  meeting: 'info',
  trip: 'academic',
  culture: 'academic',
  ceremony: 'event',
  class: 'info',
};

export function toneColors(c: { successText: string; successSoft: string; warningText: string; warningSoft: string; errorText: string; errorSoft: string; primary: string; primarySoft: string; textSecondary: string; backgroundAlt: string; academic: string; academicSoft: string; event: string; eventSoft: string }, tone: PillTone): [string, string] {
  switch (tone) {
    case 'success':
      return [c.successText, c.successSoft];
    case 'warning':
      return [c.warningText, c.warningSoft];
    case 'error':
      return [c.errorText, c.errorSoft];
    case 'info':
      return [c.primary, c.primarySoft];
    case 'academic':
      return [c.academic, c.academicSoft];
    case 'event':
      return [c.event, c.eventSoft];
    default:
      return [c.textSecondary, c.backgroundAlt];
  }
}
