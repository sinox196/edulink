import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { DEMO_TODAY, getClass, isoWeekday, slotState, subjectName, teacherDisplayName, teacherForUser, timetableForTeacher } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { useInitialLoad } from '../../lib/hooks';
import { RefreshSkeleton, Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Icon, IconBadge, Pill, PressableScale, Row, SectionHeader, type IconName } from '../../components/ui';
import { FadeIn } from '../../components/animated';
import { HomeHeader } from './widgets';
import { conversationTitle } from '../../lib/conversations';
import type { TranslationKey } from '../../i18n/fr';

const ACTIONS: { key: TranslationKey; icon: IconName; route: string; color: 'primary' | 'academic' | 'success' | 'event' | 'warning' }[] = [
  { key: 'teacher.takeAttendance', icon: 'checkbox-outline', route: '/teacher/attendance', color: 'success' },
  { key: 'teacher.addGrade', icon: 'stats-chart-outline', route: '/teacher/grade', color: 'academic' },
  { key: 'teacher.addHomework', icon: 'create-outline', route: '/teacher/homework', color: 'primary' },
  { key: 'teacher.createAnnouncement', icon: 'megaphone-outline', route: '/teacher/announcement', color: 'event' },
  { key: 'teacher.addFeedback', icon: 'star-outline', route: '/teacher/feedback', color: 'warning' },
  { key: 'teacher.addExam', icon: 'document-text-outline', route: '/teacher/exam', color: 'academic' },
  { key: 'teacher.createEvent', icon: 'calendar-outline', route: '/teacher/event', color: 'event' },
  { key: 'teacher.shareDocument', icon: 'folder-open-outline', route: '/teacher/document', color: 'primary' },
];

export function TeacherHome() {
  const { db, user, attendanceSessions } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const loading = useInitialLoad();
  const teacher = user ? teacherForUser(db, user.id) : undefined;
  if (!user || !teacher) return <Screen back={false} inTabs><RefreshSkeleton /></Screen>;
  const slots = timetableForTeacher(db, teacher.id, isoWeekday(DEMO_TODAY));
  const tone = (k: (typeof ACTIONS)[number]['color']) =>
    ({ primary: [c.primary, c.primarySoft], academic: [c.academic, c.academicSoft], success: [c.successText, c.successSoft], event: [c.event, c.eventSoft], warning: [c.warningText, c.warningSoft] })[k];
  const unreadConvs = db.conversations.filter((cv) => cv.participantIds.includes(user.id));

  return (
    <Screen back={false} inTabs refreshable>
      <FadeIn>
        <HomeHeader />
        <Txt variant="display" style={{ marginTop: space.xl }} accessibilityRole="header">
          {t('teacher.hello', { name: teacherDisplayName(teacher) })}
        </Txt>
        <Txt variant="body" tone="secondary">
          {subjectName(teacher.subjectIds[0], locale)} · {teacher.classIds.length} {t('admin.classes').toLowerCase()}
        </Txt>
      </FadeIn>

      {loading ? (
        <RefreshSkeleton />
      ) : (
        <>
          <FadeIn index={1}>
            <SectionHeader title={t('teacher.todayClasses')} action={t('timetable.week')} onAction={() => router.push('/timetable')} />
            <View style={{ gap: space.sm }}>
              {slots.map((s) => {
                const cls = getClass(db, s.classId)!;
                const done = attendanceSessions.some((a) => a.classId === s.classId && a.start === s.start && a.date === DEMO_TODAY);
                const state = slotState(s);
                return (
                  <Card key={s.id} onPress={() => router.push({ pathname: '/teacher/attendance', params: { classId: s.classId, start: s.start } })} accessibilityLabel={`${s.start}, ${cls.name}, ${done ? t('teacher.attendanceDone') : t('teacher.attendancePending')}`}>
                    <Row>
                      <View style={{ width: 64, alignItems: 'center', paddingVertical: 6, borderRadius: radius.md, backgroundColor: c.primarySoft }}>
                        <Txt variant="heading" tone="primary">
                          {s.start}
                        </Txt>
                        <Txt variant="caption" tone="primary">
                          {s.end}
                        </Txt>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Txt variant="heading">{cls.name}</Txt>
                        <Txt variant="caption" tone="secondary">
                          {subjectName(s.subjectId, locale)} · {t('common.room', { room: s.room ?? '' })} · {t('teacher.students', { n: cls.studentCount })}
                        </Txt>
                        <Row gap={6}>
                          {done ? <Pill label={t('teacher.attendanceDone')} tone="success" icon="checkmark-circle" small /> : <Pill label={t('teacher.attendancePending')} tone="warning" icon="alert-circle" small />}
                          {state !== 'upcoming' ? <Pill label={state === 'current' ? t('timetable.now') : t('teacher.pastClass')} tone="neutral" small /> : <Pill label={t('teacher.nextClass')} tone="info" small />}
                        </Row>
                      </View>
                      <Icon name="chevron-forward" color={c.textTertiary} />
                    </Row>
                  </Card>
                );
              })}
            </View>
          </FadeIn>

          <FadeIn index={2}>
            <SectionHeader title={t('teacher.quickActions')} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              {ACTIONS.map((a) => {
                const [fg, bg] = tone(a.color);
                return (
                  <PressableScale key={a.key} onPress={() => router.push(a.route as never)} accessibilityRole="button" accessibilityLabel={t(a.key)} style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: space.lg, gap: space.md }}>
                    <IconBadge icon={a.icon} color={fg} bg={bg} />
                    <Txt variant="bodyStrong">{t(a.key)}</Txt>
                  </PressableScale>
                );
              })}
            </View>
          </FadeIn>

          <FadeIn index={3}>
            <SectionHeader title={t('teacher.messageParents')} action={t('common.seeAll')} onAction={() => router.push('/(tabs)/messages')} />
            <Card style={{ gap: space.sm }}>
              {unreadConvs.slice(0, 3).map((cv) => (
                <PressableScale key={cv.id} onPress={() => router.push(`/chat/${cv.id}`)} accessibilityRole="button" accessibilityLabel={cv.title}>
                  <Row style={{ minHeight: 48 }}>
                    <IconBadge icon="chatbubble-ellipses-outline" color={c.primary} bg={c.primarySoft} size={36} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong">{conversationTitle(db, cv, user.id).title}</Txt>
                      <Txt variant="caption" tone="secondary">
                        {conversationTitle(db, cv, user.id).subtitle}
                      </Txt>
                    </View>
                    <Icon name="chevron-forward" color={c.textTertiary} size={16} />
                  </Row>
                </PressableScale>
              ))}
            </Card>
          </FadeIn>
        </>
      )}
    </Screen>
  );
}
