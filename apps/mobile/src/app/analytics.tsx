import React, { useMemo } from 'react';
import { View } from 'react-native';
import { attendanceByWeek, averageProgression, formatDate, monthShort, progressSummary, riskInsights, subjectName } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { useStudentData } from '../lib/hooks';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Card, Icon, IconBadge, Pill, Row, SectionHeader } from '../components/ui';
import { BarList, Columns, LineChart } from '../components/charts';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';

export default function Analytics() {
  const { db, user } = useStore();
  const { c, subject } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const derived = useMemo(() => {
    if (!data) return null;
    return {
      progression: averageProgression(db, data.student.id),
      summary: progressSummary(db, data.student.id, locale),
      insights: riskInsights(db, data.student.id, locale),
      weeks: attendanceByWeek(data.attendance).slice(-8),
    };
  }, [db, data, locale]);
  if (!data || !derived) return null;
  const { subjects } = data;
  const sorted = [...subjects].sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0));
  const strengths = [...subjects].sort((a, b) => b.average - a.average).slice(0, 3);
  const support = subjects.filter((s) => (s.trend ?? 0) < 0 || s.average < s.classAverage);

  return (
    <Screen title={t('analytics.title')} subtitle={`${data.student.firstName} · ${data.cls.name}`}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}

      <FadeIn style={{ marginTop: space.lg }}>
        <Card tone="academic">
          <Row style={{ alignItems: 'flex-start' }}>
            <IconBadge icon="sparkles" color={c.academic} bg={c.card} />
            <View style={{ flex: 1, gap: 6 }}>
              <Txt variant="label" tone="academic">
                {t('analytics.summary')}
              </Txt>
              <Txt variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
                {derived.summary}
              </Txt>
              <Txt variant="caption" tone="secondary">
                {t('analytics.summaryHint')}
              </Txt>
            </View>
          </Row>
        </Card>
      </FadeIn>

      <FadeIn index={1}>
        <SectionHeader title={t('analytics.progression')} />
        <Card>
          <LineChart
            labels={derived.progression.map((p) => (p.label === 'T3' ? 'T3 N-1' : monthShort(p.month, locale)))}
            min={10}
            max={18}
            series={[
              { label: data.student.firstName, color: c.academic, values: derived.progression.map((p) => p.average) },
              { label: t('grades.class'), color: c.textTertiary, values: derived.progression.map((p) => p.classAverage), dashed: true },
            ]}
          />
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <SectionHeader title={t('analytics.trends')} />
        <Card style={{ gap: space.md }}>
          {sorted.map((s) => {
            const up = (s.trend ?? 0) >= 0;
            return (
              <Row key={s.subject.id}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {subjectName(s.subject.id, locale)}
                </Txt>
                <Row gap={4}>
                  <Icon name={up ? 'arrow-up' : 'arrow-down'} size={15} color={up ? c.successText : c.warningText} style={{ transform: [{ rotate: up ? '45deg' : '-45deg' }] }} />
                  <Txt variant="bodyStrong" color={up ? c.successText : c.warningText}>
                    {up ? '+' : ''}
                    {(s.trend ?? 0).toFixed(1)} {t('common.points', { n: '' }).trim()}
                  </Txt>
                </Row>
              </Row>
            );
          })}
          <Txt variant="caption" tone="tertiary">
            {t('grades.vsPrevious')}
          </Txt>
        </Card>
      </FadeIn>

      <FadeIn index={3}>
        <SectionHeader title={t('analytics.perSubject')} />
        <Card>
          <BarList
            marker={t('grades.class')}
            items={subjects.map((s) => {
              const col = subject(s.subject.color);
              return { label: subjectName(s.subject.id, locale), value: s.average, compare: s.classAverage, color: col.fg, bg: col.bg };
            })}
          />
          <Row gap={6} style={{ marginTop: space.md }}>
            <View style={{ width: 3, height: 14, backgroundColor: c.text, opacity: 0.55, borderRadius: 2 }} />
            <Txt variant="caption" tone="secondary">
              {t('grades.class')}
            </Txt>
          </Row>
        </Card>
      </FadeIn>

      <FadeIn index={4}>
        <Row gap={space.md} style={{ marginTop: space.xxl, alignItems: 'stretch' }}>
          <Card style={{ flex: 1, gap: 8 }}>
            <Txt variant="label" tone="success">
              {t('analytics.strengths')}
            </Txt>
            {strengths.map((s) => (
              <Pill key={s.subject.id} label={`${subjectName(s.subject.id, locale)} · ${s.average}`} tone="success" icon="star" small />
            ))}
          </Card>
          <Card style={{ flex: 1, gap: 8 }}>
            <Txt variant="label" tone="warning">
              {t('analytics.improve')}
            </Txt>
            {support.map((s) => (
              <Pill key={s.subject.id} label={subjectName(s.subject.id, locale)} tone="warning" icon="leaf" small />
            ))}
          </Card>
        </Row>
      </FadeIn>

      {derived.insights.length ? (
        <FadeIn index={5}>
          <SectionHeader title={t('home.insights')} />
          <View style={{ gap: space.md }}>
            {derived.insights.map((i) => (
              <Card key={i.id}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <IconBadge icon="bulb-outline" color={c.primary} bg={c.primarySoft} />
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

      <FadeIn index={6}>
        <SectionHeader title={t('analytics.attendance')} />
        <Card>
          <Columns items={derived.weeks.map((w) => ({ label: formatDate(w.week, locale, 'short'), value: w.rate }))} />
        </Card>
      </FadeIn>
    </Screen>
  );
}
