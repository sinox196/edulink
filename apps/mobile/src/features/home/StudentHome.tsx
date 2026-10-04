import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { addDays, DEMO_TODAY, getTeacher, gradesFor, isoWeekday, slotState, subjectName, teacherDisplayName, timetableForClass, upcomingEvents, inDays } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { useInitialLoad, useStudentData } from '../../lib/hooks';
import { RefreshSkeleton, Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Icon, Pill, Row, SectionHeader } from '../../components/ui';
import { FadeIn } from '../../components/animated';
import { EventCard, ExamCard, GradeCard, HomeHeader, HomeworkRow, KpiRow } from './widgets';

export function StudentHome() {
  const { db, user, toggleHomework } = useStore();
  const { c, subject } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const loading = useInitialLoad();
  if (!user || !data) return <Screen back={false} inTabs><RefreshSkeleton /></Screen>;
  const { student, cls, stats, average, homework, exams } = data;
  const tomorrow = addDays(DEMO_TODAY, 1);
  const slots = timetableForClass(db, cls.id, isoWeekday(tomorrow)).filter((s) => s.subjectId);
  const todo = homework.filter((h) => h.status !== 'done' || h.completedAt?.startsWith(DEMO_TODAY));
  const feedback = db.feedback.filter((f) => f.studentId === student.id && f.kind === 'positive').slice(0, 2);
  const grades = gradesFor(db, student.id).slice(0, 2);
  const event = upcomingEvents(db, cls.id)[0];

  return (
    <Screen back={false} inTabs refreshable>
      <FadeIn>
        <HomeHeader />
        <Txt variant="display" style={{ marginTop: space.xl }} accessibilityRole="header">
          {t('home.hello', { name: user.firstName })}
        </Txt>
        <Txt variant="body" tone="secondary">
          {t('child.class', { name: cls.name })} · {db.school.shortName}
        </Txt>
      </FadeIn>
      {loading ? (
        <RefreshSkeleton />
      ) : (
        <>
          <FadeIn index={1} style={{ marginTop: space.lg }}>
            <KpiRow rate={stats.rate} average={average?.average} homeworkTodo={homework.filter((h) => h.status === 'todo').length} exam={exams[0]} eventsWeek={0} />
          </FadeIn>

          {exams[0] ? (
            <FadeIn index={2} style={{ marginTop: space.lg }}>
              <Card tone="academic">
                <Row>
                  <Icon name="alarm" size={22} color={c.academic} />
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>
                    {t('exams.reminder', { subject: subjectName(exams[0].subjectId, locale).toLowerCase(), when: inDays(exams[0].date, locale).toLowerCase() })}
                  </Txt>
                </Row>
              </Card>
            </FadeIn>
          ) : null}

          <FadeIn index={3}>
            <SectionHeader title={`${t('timetable.title')} — ${t('common.tomorrow')}`} action={t('timetable.week')} onAction={() => router.push('/timetable')} />
            <View style={{ gap: space.sm }}>
              {slots.map((s) => {
                const sub = db.subjects.find((x) => x.id === s.subjectId)!;
                const col = subject(sub.color);
                const state = slotState(s, tomorrow);
                return (
                  <Row key={s.id} style={{ backgroundColor: col.bg, borderRadius: radius.md, padding: space.md }}>
                    <View style={{ width: 54 }}>
                      <Txt variant="captionStrong" color={col.fg}>
                        {s.start}
                      </Txt>
                      <Txt variant="caption" color={col.fg} style={{ opacity: 0.75 }}>
                        {s.end}
                      </Txt>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong" color={col.fg}>
                        {subjectName(s.subjectId, locale)}
                      </Txt>
                      <Txt variant="caption" color={col.fg} style={{ opacity: 0.8 }}>
                        {t('common.room', { room: s.room ?? '' })} · {teacherDisplayName(getTeacher(db, s.teacherId))}
                      </Txt>
                    </View>
                    {state === 'current' ? <Pill label={t('timetable.now')} tone="success" small /> : null}
                  </Row>
                );
              })}
            </View>
          </FadeIn>

          <FadeIn index={4}>
            <SectionHeader title={t('homework.title')} action={t('common.seeAll')} onAction={() => router.push('/homework')} />
            <Card style={{ paddingVertical: space.sm }}>
              {todo.slice(0, 4).map((h) => (
                <HomeworkRow key={h.homework.id} title={h.homework.title} subjectId={h.homework.subjectId} due={h.homework.dueDate} done={h.status === 'done'} onToggle={() => toggleHomework(h.homework.id, student.id)} />
              ))}
            </Card>
          </FadeIn>

          {exams[0] ? (
            <FadeIn index={5}>
              <SectionHeader title={t('exams.title')} action={t('common.seeAll')} onAction={() => router.push('/exams')} />
              <ExamCard exam={exams[0]} />
            </FadeIn>
          ) : null}

          <FadeIn index={6}>
            <SectionHeader title={t('grades.recent')} action={t('common.seeAll')} onAction={() => router.push('/grades')} />
            <View style={{ gap: space.md }}>
              {grades.map((g) => (
                <GradeCard key={g.id} grade={g} compact />
              ))}
            </View>
          </FadeIn>

          {feedback.length ? (
            <FadeIn index={7}>
              <SectionHeader title={t('behavior.positive')} action={t('common.seeAll')} onAction={() => router.push('/behavior')} />
              <Card tone="success" style={{ gap: space.sm }}>
                {feedback.map((f) => (
                  <Row key={f.id} style={{ alignItems: 'flex-start' }}>
                    <Txt>⭐</Txt>
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong">{f.text}</Txt>
                      <Txt variant="caption" tone="secondary">
                        {teacherDisplayName(getTeacher(db, f.teacherId))}
                      </Txt>
                    </View>
                  </Row>
                ))}
              </Card>
            </FadeIn>
          ) : null}

          {event ? (
            <FadeIn index={8}>
              <SectionHeader title={t('home.upcomingEvent')} action={t('common.seeAll')} onAction={() => router.push('/events')} />
              <EventCard event={event} />
            </FadeIn>
          ) : null}
        </>
      )}
    </Screen>
  );
}
