import React, { useMemo } from 'react';
import { View } from 'react-native';
import { dailyDigest, formatDate, formatScore, isoWeekday, riskInsights, subjectName, weekdayName, weeklySummary } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { genderize, useStudentData } from '../lib/hooks';
import { ATTENDANCE_META } from '../lib/meta';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Card, IconBadge, Row, SectionHeader } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn, ProgressRing } from '../components/animated';

export default function Digest() {
  const { db, user } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const d = useMemo(() => (data ? { daily: dailyDigest(db, data.student.id), weekly: weeklySummary(db, data.student.id), insights: riskInsights(db, data.student.id, locale) } : null), [db, data, locale]);
  if (!data || !d?.daily) return null;
  const { student } = data;
  const { daily, weekly } = d;
  const att = daily.attendance;

  const line = (emoji: string, text: string) => (
    <Row gap={12} style={{ minHeight: 34 }}>
      <Txt style={{ fontSize: 20, width: 28 }} align="center">
        {emoji}
      </Txt>
      <Txt variant="bodyStrong" style={{ flex: 1 }}>
        {text}
      </Txt>
    </Row>
  );

  return (
    <Screen title={t('digest.title')} subtitle={student.firstName}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <FadeIn style={{ marginTop: space.lg }}>
        <SectionHeader title={t('home.digest', { name: student.firstName })} style={{ marginTop: 0 }} />
        <Card tone="primary" style={{ gap: 8 }}>
          <Txt variant="caption" tone="secondary">
            {formatDate(daily.date, locale, 'long')}
          </Txt>
          {line(att ? ATTENDANCE_META[att.status].emoji : '—', att ? genderize(t(att.status === 'present' || att.status === 'late' ? 'home.presentSince' : ATTENDANCE_META[att.status].key, { time: att.checkIn ?? '' }), student.gender) : '—')}
          {line('📚', t('home.digest.lessons', { n: daily.lessons }))}
          {line('📝', t('home.digest.newHomework', { n: daily.newHomework }))}
          {daily.newGrades.map((g) => (
            <React.Fragment key={g.subjectId}>{line('📊', t('home.digest.newGrade', { subject: subjectName(g.subjectId, locale), score: formatScore(g.score) }))}</React.Fragment>
          ))}
          {daily.nextEvent ? line('📅', `${daily.nextEvent.title} — ${weekdayName(isoWeekday(daily.nextEvent.date), locale)}`) : null}
        </Card>
      </FadeIn>

      <FadeIn index={1}>
        <SectionHeader title={`${t('digest.weekly')} · ${formatDate(weekly.weekStart, locale, 'dayMonth')}`} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          <Card style={{ flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: 6 }}>
            <ProgressRing progress={weekly.attendanceRate / 100} size={70} stroke={8} color={c.success}>
              <Txt variant="bodyStrong" tone="success">
                {weekly.attendanceRate}%
              </Txt>
            </ProgressRing>
            <Txt variant="captionStrong" tone="secondary">
              {t('digest.attendance')}
            </Txt>
          </Card>
          <Card style={{ flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: 6 }}>
            <ProgressRing progress={(weekly.average ?? 0) / 20} size={70} stroke={8} color={c.academic}>
              <Txt variant="bodyStrong" tone="academic">
                {weekly.average ?? '—'}
              </Txt>
            </ProgressRing>
            <Txt variant="captionStrong" tone="secondary">
              {t('digest.average')}
            </Txt>
          </Card>
          <Card style={{ flexBasis: '47%', flexGrow: 1, gap: 6 }}>
            <IconBadge icon="create" color={c.primary} bg={c.primarySoft} size={36} />
            <Txt variant="heading">{t('digest.homeworkDone', { done: weekly.homeworkDone, total: weekly.homeworkTotal })}</Txt>
            <Txt variant="caption" tone="secondary">
              {t('digest.homework')}
            </Txt>
          </Card>
          <Card style={{ flexBasis: '47%', flexGrow: 1, gap: 6 }}>
            <IconBadge icon="star" color={c.successText} bg={c.successSoft} size={36} />
            <Txt variant="heading">{t('digest.feedbackPositive', { n: weekly.positiveFeedback })}</Txt>
            <Txt variant="caption" tone="secondary">
              {t('digest.feedback')}
            </Txt>
          </Card>
        </View>
      </FadeIn>

      {d.insights.length ? (
        <FadeIn index={2}>
          <SectionHeader title={t('home.insights')} />
          <View style={{ gap: space.md }}>
            {d.insights.map((i) => (
              <Card key={i.id}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <IconBadge icon="bulb-outline" color={c.academic} bg={c.academicSoft} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="bodyStrong">{i.title}</Txt>
                    <Txt variant="caption" tone="secondary">
                      {i.body}
                    </Txt>
                  </View>
                </Row>
              </Card>
            ))}
          </View>
        </FadeIn>
      ) : null}
    </Screen>
  );
}
