import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  dailyDigest,
  eventsThisWeek,
  formatScore,
  isoWeekday,
  latestGrade,
  priorityItems,
  riskInsights,
  subjectName,
  upcomingEvents,
  weekdayName,
} from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { genderize, useInitialLoad, useStudentData } from '../../lib/hooks';
import { Screen, RefreshSkeleton } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Icon, IconBadge, Row, SectionHeader } from '../../components/ui';
import { FadeIn } from '../../components/animated';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import {
  AnnouncementCard,
  AttendanceToday,
  CriticalBanner,
  EventCard,
  ExamCard,
  GradeCard,
  HomeHeader,
  HomeworkRow,
  KpiRow,
  PriorityList,
  StudentCard,
} from './widgets';

/** Parent dashboard — only what needs attention, in the order defined by the product spec. */
export function ParentHome() {
  const { db, user } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const loading = useInitialLoad();

  const derived = useMemo(() => {
    if (!data) return null;
    const { student, cls } = data;
    const announcements = db.announcements
      .filter((a) => a.scope === 'school' || a.classIds.includes(cls.id))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return {
      critical: announcements.find((a) => a.priority === 'critical'),
      latestAnnouncement: announcements.find((a) => a.priority !== 'critical'),
      priorities: priorityItems(db, student.id, locale),
      digest: dailyDigest(db, student.id),
      insights: riskInsights(db, student.id, locale),
      grade: latestGrade(db, student.id),
      nextEvent: upcomingEvents(db, cls.id)[0],
      eventsWeek: eventsThisWeek(db, cls.id).length,
    };
  }, [db, data, locale]);

  if (!user || !data || !derived) return <Screen back={false} inTabs><RefreshSkeleton /></Screen>;
  const { student, cls, today, stats, average, homework, exams } = data;
  const todo = homework.filter((h) => h.status === 'todo');

  return (
    <Screen back={false} inTabs refreshable>
      <FadeIn>
        <HomeHeader />
        <Txt variant="display" style={{ marginTop: space.xl }} accessibilityRole="header">
          {t('home.hello', { name: user.firstName })}
        </Txt>
        <Txt variant="body" tone="secondary" style={{ marginTop: 2 }}>
          {t('home.dayOf', { name: student.firstName })}
        </Txt>
        <View style={{ marginTop: space.lg }}>
          <ChildSwitcher />
        </View>
      </FadeIn>

      {loading ? (
        <RefreshSkeleton />
      ) : (
        <View key={student.id}>
          {derived.critical ? (
            <FadeIn index={1} style={{ marginTop: space.lg }}>
              <CriticalBanner announcement={derived.critical} />
            </FadeIn>
          ) : null}

          <FadeIn index={2} style={{ marginTop: space.lg }}>
            <StudentCard student={student} className={cls.name} schoolName={db.school.name} />
          </FadeIn>

          <FadeIn index={3} style={{ marginTop: space.md }}>
            <AttendanceToday record={today} student={student} />
          </FadeIn>

          <FadeIn index={4} style={{ marginTop: space.md }}>
            <KpiRow rate={stats.rate} average={average?.average} homeworkTodo={todo.length} exam={exams[0]} eventsWeek={derived.eventsWeek} />
          </FadeIn>

          <FadeIn index={5}>
            <SectionHeader title={t('home.dontMiss')} />
            <PriorityList items={derived.priorities} />
          </FadeIn>

          {derived.digest ? (
            <FadeIn index={6}>
              <SectionHeader title={t('home.digest', { name: student.firstName })} action={t('common.seeAll')} onAction={() => router.push('/digest')} />
              <Card tone="primary" onPress={() => router.push('/digest')}>
                <View style={{ gap: 10 }}>
                  <DigestLine emoji={derived.digest.attendance?.status === 'absent' ? '⚠️' : '✅'} text={derived.digest.attendance ? genderize(t(derived.digest.attendance.status === 'present' ? 'home.presentSince' : 'attendance.status.late', { time: derived.digest.attendance.checkIn ?? '' }), student.gender) : '—'} />
                  <DigestLine emoji="📚" text={t('home.digest.lessons', { n: derived.digest.lessons })} />
                  <DigestLine emoji="📝" text={t('home.digest.newHomework', { n: derived.digest.newHomework })} />
                  {derived.digest.newGrades.map((g) => (
                    <DigestLine key={g.subjectId} emoji="📊" text={t('home.digest.newGrade', { subject: subjectName(g.subjectId, locale), score: formatScore(g.score) })} />
                  ))}
                  {derived.digest.nextEvent ? <DigestLine emoji="📅" text={`${derived.digest.nextEvent.title} — ${weekdayName(isoWeekday(derived.digest.nextEvent.date), locale)}`} /> : null}
                </View>
              </Card>
            </FadeIn>
          ) : null}

          <FadeIn index={7}>
            <SectionHeader title={t('home.upcomingHomework')} action={t('common.seeAll')} onAction={() => router.push('/homework')} />
            <Card style={{ paddingVertical: space.sm }}>
              {todo.length ? todo.slice(0, 3).map((h) => <HomeworkRow key={h.homework.id} title={h.homework.title} subjectId={h.homework.subjectId} due={h.homework.dueDate} />) : <Txt variant="body" tone="secondary">{t('homework.emptyTodo')}</Txt>}
            </Card>
          </FadeIn>

          {exams[0] ? (
            <FadeIn index={8}>
              <SectionHeader title={t('home.upcomingExam')} action={t('common.seeAll')} onAction={() => router.push('/exams')} />
              <ExamCard exam={exams[0]} />
            </FadeIn>
          ) : null}

          {derived.grade ? (
            <FadeIn index={9}>
              <SectionHeader title={t('home.latestGrade')} action={t('common.seeAll')} onAction={() => router.push('/grades')} />
              <GradeCard grade={derived.grade} />
            </FadeIn>
          ) : null}

          {derived.insights[0] ? (
            <FadeIn index={10}>
              <SectionHeader title={t('home.insights')} action={t('school.analytics')} onAction={() => router.push('/analytics')} />
              <Card onPress={() => router.push(derived.insights[0].link as never)}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <IconBadge icon="bulb-outline" color={c.academic} bg={c.academicSoft} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="bodyStrong">{derived.insights[0].title}</Txt>
                    <Txt variant="caption" tone="secondary">
                      {derived.insights[0].body}
                    </Txt>
                  </View>
                </Row>
              </Card>
            </FadeIn>
          ) : null}

          {derived.nextEvent ? (
            <FadeIn index={11}>
              <SectionHeader title={t('home.upcomingEvent')} action={t('common.seeAll')} onAction={() => router.push('/events')} />
              <EventCard event={derived.nextEvent} studentId={student.id} />
            </FadeIn>
          ) : null}

          {derived.latestAnnouncement ? (
            <FadeIn index={12}>
              <SectionHeader title={t('home.latestAnnouncement')} action={t('common.seeAll')} onAction={() => router.push('/announcements')} />
              <AnnouncementCard a={derived.latestAnnouncement} />
            </FadeIn>
          ) : null}

          <Row gap={8} style={{ justifyContent: 'center', marginTop: space.xxl }}>
            <Icon name="lock-closed" size={13} color={c.textTertiary} />
            <Txt variant="caption" tone="tertiary">
              {t('settings.privacy.intro')}
            </Txt>
          </Row>
        </View>
      )}
    </Screen>
  );
}

function DigestLine({ emoji, text }: { emoji: string; text: string }) {
  return (
    <Row gap={10}>
      <Txt style={{ width: 24 }} align="center">
        {emoji}
      </Txt>
      <Txt variant="bodyStrong" style={{ flex: 1 }}>
        {text}
      </Txt>
    </Row>
  );
}
