import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  DEMO_TODAY,
  diffDays,
  formatDate,
  formatScore,
  formatStamp,
  getTeacher,
  inDays,
  relativeDay,
  subjectName,
  teacherDisplayName,
  type Announcement,
  type AttendanceRecord,
  type Exam,
  type Grade,
  type PriorityItem,
  type SchoolEvent,
  type Student,
} from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { ATTENDANCE_META, toneColors } from '../../lib/meta';
import { genderize, useUnreadCount } from '../../lib/hooks';
import { Txt } from '../../components/Txt';
import { Button, Card, Icon, IconBadge, IconButton, Pill, PressableScale, Row, type IconName } from '../../components/ui';
import { AnimatedNumber, ProgressRing, Pulse } from '../../components/animated';
import { SchoolCrest } from '../../components/brand';

/* ------------------------------------------------------------------ Header */

export function HomeHeader() {
  const { db } = useStore();
  const { t, locale } = useI18n();
  const unread = useUnreadCount();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Row gap={10} style={{ flex: 1 }}>
        <SchoolCrest size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="captionStrong" numberOfLines={1}>
            {db.school.name}
          </Txt>
          <Txt variant="caption" tone="secondary" numberOfLines={1}>
            {formatDate(DEMO_TODAY, locale, 'weekday')}
          </Txt>
        </View>
      </Row>
      <Row gap={8}>
        <IconButton icon="search" label={t('search.title')} onPress={() => router.push('/search')} />
        <Pulse active={unread > 0}>
          <IconButton icon="notifications-outline" label={t('notifications.title')} badge={unread} onPress={() => router.push('/notifications')} />
        </Pulse>
      </Row>
    </Row>
  );
}

/* ------------------------------------------------- Emergency / announcements */

export function CriticalBanner({ announcement }: { announcement: Announcement }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { user, acknowledgeAnnouncement } = useStore();
  const acked = !!user && announcement.acknowledgedBy.includes(user.id);
  return (
    <View accessibilityRole="alert" style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1.5, borderColor: acked ? c.border : c.error, backgroundColor: acked ? c.card : c.errorSoft }}>
      <View style={{ padding: space.lg, gap: space.sm }}>
        <Row gap={8}>
          <Icon name="warning" size={18} color={c.errorText} />
          <Txt variant="label" tone="error">
            {t('home.importantInfo')}
          </Txt>
        </Row>
        <Txt variant="heading">{announcement.title}</Txt>
        <Txt variant="body" tone="secondary" numberOfLines={3}>
          {announcement.body}
        </Txt>
        {announcement.requiresAck ? (
          acked ? (
            <Pill label={t('home.ackDone')} tone="success" icon="checkmark-circle" />
          ) : (
            <Button label={t('home.ackRequired')} icon="checkmark-done" onPress={() => acknowledgeAnnouncement(announcement.id)} style={{ marginTop: space.xs, backgroundColor: c.error, borderColor: c.error }} />
          )
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------- Child card */

export function StudentCard({ student, className, schoolName }: { student: Student; className: string; schoolName: string }) {
  const { t } = useI18n();
  return (
    <PressableScale onPress={() => router.push('/timetable')} accessibilityRole="button" accessibilityLabel={`${student.firstName} ${student.lastName}, ${className}, ${schoolName}`} style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
      <View style={{ backgroundColor: '#1D4ED8', padding: space.lg }}>
        {/* subtle decorative circles */}
        <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#14B8A6', opacity: 0.35, top: -70, end: -50 }} />
        <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#3B82F6', opacity: 0.5, bottom: -60, end: 60 }} />
        <Row gap={14}>
          <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}>
            <Txt style={{ fontSize: 30, lineHeight: 38 }} align="center">
              {student.gender === 'F' ? '👧' : '👦'}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title" color="#FFFFFF">
              {student.firstName} {student.lastName}
            </Txt>
            <Txt variant="captionStrong" color="rgba(255,255,255,0.85)">
              {t('child.class', { name: className })} · {schoolName}
            </Txt>
          </View>
          <Icon name="chevron-forward" color="rgba(255,255,255,0.85)" />
        </Row>
      </View>
    </PressableScale>
  );
}

/* ------------------------------------------------------- Attendance today */

export function AttendanceToday({ record, student }: { record?: AttendanceRecord; student: Student }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const meta = record ? ATTENDANCE_META[record.status] : null;
  const [fg, bg] = meta ? toneColors(c, meta.tone) : [c.textSecondary, c.backgroundAlt];
  const headline = !record
    ? '—'
    : record.status === 'present' || record.status === 'late'
      ? `${meta!.emoji} ${genderize(t('home.presentSince', { time: record.checkIn ?? '' }), student.gender)}`
      : `${meta!.emoji} ${t(meta!.key)}`;
  return (
    <Card onPress={() => router.push('/attendance')} accessibilityLabel={`${t('home.attendanceToday')}: ${headline}`}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="label" tone="secondary">
            {t('home.today')}
          </Txt>
          <Txt variant="subheading" tone="secondary">
            {t('home.attendanceToday')}
          </Txt>
          <Txt variant="heading" style={{ fontSize: 19 }}>
            {headline}
          </Txt>
        </View>
        <IconBadge icon={meta?.icon ?? 'help-circle'} color={fg} bg={bg} size={48} />
      </Row>
      {record ? (
        <Row gap={10} style={{ marginTop: space.lg }}>
          <TimeChip icon="log-in-outline" label={t('attendance.entry')} value={record.checkIn ?? '—'} />
          <TimeChip icon="log-out-outline" label={t('attendance.exit')} value={record.checkOut ?? '—'} />
          {record.status === 'late' ? <TimeChip icon="time-outline" label={t('attendance.status.late')} value={t('common.minutes', { n: record.minutesLate ?? 0 })} tone="warning" /> : null}
        </Row>
      ) : null}
    </Card>
  );
}

function TimeChip({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone?: 'warning' }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tone ? c.warningSoft : c.backgroundAlt, borderRadius: radius.md, padding: space.md }}>
      <Row gap={6}>
        <Icon name={icon} size={15} color={tone ? c.warningText : c.textSecondary} />
        <Txt variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </Txt>
      </Row>
      <Txt variant="heading" style={{ marginTop: 2 }}>
        {value}
      </Txt>
    </View>
  );
}

/* --------------------------------------------------------------------- KPIs */

const KPI_HEIGHT = 124;

export function KpiTile({ label, children, icon, color, bg, onPress, width = 156 }: { label: string; children: React.ReactNode; icon: IconName; color: string; bg: string; onPress?: () => void; width?: number }) {
  return (
    <Card onPress={onPress} style={{ width, height: KPI_HEIGHT, padding: space.md, gap: space.sm }} accessibilityLabel={label}>
      <IconBadge icon={icon} color={color} bg={bg} size={34} />
      <Txt variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Txt>
      {children}
    </Card>
  );
}

export function KpiRow({ rate, average, homeworkTodo, exam, eventsWeek }: { rate: number; average?: number; homeworkTodo: number; exam?: Exam; eventsWeek: number }) {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingVertical: 4, paddingHorizontal: 2 }} style={{ marginHorizontal: -2 }}>
      <Card onPress={() => router.push('/attendance')} style={{ width: 156, height: KPI_HEIGHT, padding: space.md, justifyContent: 'center' }} accessibilityLabel={`${t('home.kpi.attendance')} ${rate}%`}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt variant="caption" tone="secondary">
              {t('home.kpi.attendance')}
            </Txt>
            <AnimatedNumber value={rate} suffix="%" color={c.successText} />
          </View>
          <ProgressRing progress={rate / 100} size={50} stroke={6} color={c.success}>
            <Icon name="checkmark" size={18} color={c.successText} />
          </ProgressRing>
        </Row>
      </Card>
      <Card onPress={() => router.push('/grades')} style={{ width: 168, height: KPI_HEIGHT, padding: space.md, justifyContent: 'center' }} accessibilityLabel={`${t('home.kpi.average')} ${average} / 20`}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt variant="caption" tone="secondary">
              {t('home.kpi.average')}
            </Txt>
            <Row gap={2} style={{ alignItems: 'flex-end' }}>
              <AnimatedNumber value={average ?? 0} decimals={1} color={c.academic} />
              <Txt variant="caption" tone="secondary" style={{ marginBottom: 4 }}>
                /20
              </Txt>
            </Row>
          </View>
          <ProgressRing progress={(average ?? 0) / 20} size={50} stroke={6} color={c.academic} delay={120}>
            <Icon name="trending-up" size={18} color={c.academic} />
          </ProgressRing>
        </Row>
      </Card>
      <KpiTile label={t('home.kpi.homework')} icon="create-outline" color={c.primary} bg={c.primarySoft} onPress={() => router.push('/homework')}>
        <AnimatedNumber value={homeworkTodo} color={c.primary} delay={200} />
      </KpiTile>
      <KpiTile label={t('home.kpi.nextExam')} icon="document-text-outline" color={c.academic} bg={c.academicSoft} onPress={() => router.push('/exams')} width={180}>
        <Txt variant="bodyStrong" numberOfLines={2}>
          {exam ? `${subjectName(exam.subjectId, locale)} — ${relativeDay(exam.date, locale).split(' ')[0]}` : '—'}
        </Txt>
      </KpiTile>
      <KpiTile label={t('home.kpi.events')} icon="calendar-outline" color={c.event} bg={c.eventSoft} onPress={() => router.push('/events')}>
        <Txt variant="bodyStrong">{t('home.kpi.eventsWeek', { n: eventsWeek })}</Txt>
      </KpiTile>
    </ScrollView>
  );
}

/* ---------------------------------------------------------- Priority list */

const PRIORITY_ICON: Record<PriorityItem['kind'], { icon: IconName; emoji: string }> = {
  homework: { icon: 'create', emoji: '📝' },
  grade: { icon: 'stats-chart', emoji: '📊' },
  meeting: { icon: 'people', emoji: '📅' },
  authorization: { icon: 'create', emoji: '⚠️' },
  justification: { icon: 'document-text', emoji: '🩺' },
  exam: { icon: 'school', emoji: '🧮' },
};

export function PriorityList({ items }: { items: PriorityItem[] }) {
  const { c } = useTheme();
  const { t } = useI18n();
  if (!items.length) {
    return (
      <Card>
        <Txt variant="bodyStrong" align="center">
          {t('home.allClear')}
        </Txt>
      </Card>
    );
  }
  return (
    <Card padded={false}>
      {items.map((it, i) => {
        const tone = it.tone === 'warning' ? 'warning' : it.tone === 'academic' ? 'academic' : it.tone === 'event' ? 'event' : it.tone === 'success' ? 'success' : 'info';
        const [fg, bg] = toneColors(c, tone);
        return (
          <PressableScale key={it.id} onPress={() => router.push(it.link as never)} accessibilityRole="button" accessibilityLabel={it.text} scale={0.99}>
            <Row style={{ paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, minHeight: 58 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ fontSize: 18, lineHeight: 22 }} align="center">
                  {PRIORITY_ICON[it.kind].emoji}
                </Txt>
              </View>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {it.text}
              </Txt>
              <Icon name="chevron-forward" size={16} color={fg} />
            </Row>
          </PressableScale>
        );
      })}
    </Card>
  );
}

/* --------------------------------------------------------------- Cards */

export function SubjectDot({ subjectId, size = 40 }: { subjectId: string; size?: number }) {
  const { db } = useStore();
  const { subject } = useTheme();
  const s = db.subjects.find((x) => x.id === subjectId);
  if (!s) return null;
  const col = subject(s.color);
  return <IconBadge icon={s.icon as IconName} color={col.fg} bg={col.bg} size={size} />;
}

export function ExamCard({ exam }: { exam: Exam }) {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const days = diffDays(DEMO_TODAY, exam.date);
  return (
    <Card onPress={() => router.push('/exams')}>
      <Row>
        <SubjectDot subjectId={exam.subjectId} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">{subjectName(exam.subjectId, locale)}</Txt>
          <Txt variant="caption" tone="secondary">
            {exam.title}
          </Txt>
        </View>
        <Pill label={inDays(exam.date, locale)} tone={days <= 2 ? 'warning' : 'academic'} icon="alarm-outline" small />
      </Row>
      <Row gap={14} style={{ marginTop: space.md }}>
        <Row gap={6}>
          <Icon name="calendar-outline" size={15} color={c.textSecondary} />
          <Txt variant="caption" tone="secondary">
            {formatDate(exam.date, locale, 'weekday')}
          </Txt>
        </Row>
        <Row gap={6}>
          <Icon name="time-outline" size={15} color={c.textSecondary} />
          <Txt variant="caption" tone="secondary">
            {exam.time}
          </Txt>
        </Row>
        <Row gap={6}>
          <Icon name="location-outline" size={15} color={c.textSecondary} />
          <Txt variant="caption" tone="secondary">
            {t('common.room', { room: exam.room })}
          </Txt>
        </Row>
      </Row>
    </Card>
  );
}

export function GradeCard({ grade, compact }: { grade: Grade; compact?: boolean }) {
  const { c } = useTheme();
  const { db } = useStore();
  const { t, locale } = useI18n();
  const above = grade.score / grade.outOf >= grade.classAverage / 20;
  return (
    <Card onPress={() => router.push(`/grades/${grade.subjectId}`)} accessibilityLabel={`${subjectName(grade.subjectId, locale)}, ${grade.examName}, ${formatScore(grade.score)} / ${grade.outOf}`}>
      <Row>
        <SubjectDot subjectId={grade.subjectId} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">{subjectName(grade.subjectId, locale)}</Txt>
          <Txt variant="caption" tone="secondary" numberOfLines={1}>
            {grade.examName}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="number" color={c.academic} style={{ fontSize: 24 }}>
            {formatScore(grade.score)}
            <Txt variant="caption" tone="secondary">
              {' '}/ {grade.outOf}
            </Txt>
          </Txt>
          <Txt variant="caption" tone={above ? 'success' : 'secondary'}>
            {t('common.classAvg', { n: formatScore(grade.classAverage) })}
          </Txt>
        </View>
      </Row>
      {!compact && grade.comment ? (
        <View style={{ marginTop: space.md, backgroundColor: c.backgroundAlt, borderRadius: radius.md, padding: space.md }}>
          <Txt variant="caption" tone="secondary">
            {teacherDisplayName(getTeacher(db, grade.teacherId))} · {formatDate(grade.date, locale, 'dayMonth')}
          </Txt>
          <Txt variant="body" style={{ fontStyle: 'italic' }}>
            “{grade.comment}”
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}

export function EventCard({ event, studentId }: { event: SchoolEvent; studentId?: string }) {
  const { c } = useTheme();
  const { db } = useStore();
  const { t, locale } = useI18n();
  const part = studentId ? db.eventParticipants.find((p) => p.eventId === event.id && p.studentId === studentId) : undefined;
  return (
    <Card onPress={() => router.push(`/events/${event.id}`)}>
      <Row>
        <View style={{ width: 52, borderRadius: 14, backgroundColor: c.eventSoft, alignItems: 'center', paddingVertical: 6 }}>
          <Txt variant="label" tone="event" align="center">
            {formatDate(event.date, locale, 'short').split(' ')[locale === 'en' ? 0 : 1]}
          </Txt>
          <Txt variant="title" tone="event" align="center">
            {Number(event.date.slice(8))}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">
            {event.emoji} {event.title}
          </Txt>
          <Txt variant="caption" tone="secondary" numberOfLines={1}>
            {event.time ? `🕒 ${event.time} · ` : ''}📍 {event.location}
          </Txt>
          {event.requiresAuthorization && studentId ? (
            part?.authorizationSignedAt ? (
              <Pill label={t('common.signed')} tone="success" icon="checkmark-circle" small />
            ) : (
              <Pill label={t('events.authorizationRequired')} tone="warning" icon="create-outline" small />
            )
          ) : part?.response ? (
            <Pill label={t(`events.rsvp.${part.response}`)} tone="success" icon="checkmark" small />
          ) : null}
        </View>
      </Row>
    </Card>
  );
}

export function AnnouncementCard({ a }: { a: Announcement }) {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const tone = a.priority === 'critical' ? 'error' : a.priority === 'important' ? 'warning' : 'info';
  const [fg, bg] = toneColors(c, tone);
  return (
    <Card onPress={() => router.push('/announcements')}>
      <Row style={{ alignItems: 'flex-start' }}>
        <IconBadge icon={a.priority === 'normal' ? 'megaphone-outline' : 'warning-outline'} color={fg} bg={bg} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6} wrap>
            <Pill label={t(`announcements.cat.${a.category}`)} tone={tone} small />
            <Txt variant="caption" tone="tertiary">
              {formatStamp(a.publishedAt, locale)}
            </Txt>
          </Row>
          <Txt variant="bodyStrong">{a.title}</Txt>
          <Txt variant="caption" tone="secondary" numberOfLines={2}>
            {a.body}
          </Txt>
        </View>
      </Row>
    </Card>
  );
}

export function HomeworkRow({ title, subjectId, due, done, onToggle }: { title: string; subjectId: string; due: string; done?: boolean; onToggle?: () => void }) {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  return (
    <Row style={{ paddingVertical: space.sm, minHeight: 56 }}>
      <SubjectDot subjectId={subjectId} size={38} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" numberOfLines={1} style={done ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}>
          {subjectName(subjectId, locale)}
        </Txt>
        <Txt variant="caption" tone="secondary" numberOfLines={1}>
          {title}
        </Txt>
      </View>
      {onToggle ? (
        <PressableScale onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: !!done }} accessibilityLabel={done ? t('homework.markTodo') : t('homework.markDone')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: done ? c.success : c.borderStrong, backgroundColor: done ? c.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {done ? <Icon name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
        </PressableScale>
      ) : (
        <Pill label={relativeDay(due, locale)} tone={diffDays(DEMO_TODAY, due) <= 1 ? 'warning' : 'info'} small />
      )}
    </Row>
  );
}
