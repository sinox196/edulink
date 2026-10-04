import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDate, formatScore, getTeacher, subjectName, teacherDisplayName } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { useStudentData } from '../../lib/hooks';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Icon, Pill, Row, SectionHeader } from '../../components/ui';
import { LineChart } from '../../components/charts';
import { FadeIn } from '../../components/animated';

export default function SubjectGrades() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { db, user, startConversation } = useStore();
  const { c, subject } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const summary = data?.subjects.find((s) => s.subject.id === subjectId);
  if (!data || !summary) return <Screen title={subjectName(subjectId, locale)}>{null}</Screen>;
  const col = subject(summary.subject.color);
  const teacher = getTeacher(db, summary.teacherId);
  const chrono = [...summary.grades].reverse();

  return (
    <Screen title={subjectName(subjectId, locale)} subtitle={`${teacherDisplayName(teacher)} · ${t('common.coef', { n: summary.subject.coefficient })}`}>
      <Card style={{ backgroundColor: col.bg, borderColor: col.bg }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt variant="captionStrong" color={col.fg}>
              {t('grades.term', { n: 1 })}
            </Txt>
            <Txt variant="number" color={col.fg} style={{ fontSize: 36, lineHeight: 42 }}>
              {formatScore(summary.average)}
              <Txt variant="body" color={col.fg}>
                {' '}/ 20
              </Txt>
            </Txt>
            <Txt variant="caption" color={col.fg}>
              {t('common.classAvg', { n: summary.classAverage.toFixed(1) })}
            </Txt>
          </View>
          {summary.trend !== null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Pill label={`${summary.trend > 0 ? '↗ +' : '↘ '}${summary.trend.toFixed(1)} pts`} tone={summary.trend >= 0 ? 'success' : 'warning'} />
              <Txt variant="caption" color={col.fg} style={{ marginTop: 4 }}>
                {t('grades.vsPrevious')}
              </Txt>
            </View>
          ) : null}
        </Row>
      </Card>

      {chrono.length > 1 ? (
        <Card style={{ marginTop: space.md }}>
          <LineChart
            labels={chrono.map((g) => formatDate(g.date, locale, 'short'))}
            min={8}
            max={20}
            series={[
              { label: data.student.firstName, color: col.fg, values: chrono.map((g) => (g.score / g.outOf) * 20) },
              { label: t('grades.class'), color: c.textTertiary, values: chrono.map((g) => g.classAverage), dashed: true },
            ]}
          />
        </Card>
      ) : null}

      <SectionHeader title={t('grades.exam')} />
      <View style={{ gap: space.md }}>
        {summary.grades.map((g, i) => (
          <FadeIn key={g.id} index={i}>
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{g.examName}</Txt>
                  <Row gap={10} wrap>
                    <Txt variant="caption" tone="secondary">
                      📅 {formatDate(g.date, locale, 'dayMonth')}
                    </Txt>
                    <Txt variant="caption" tone="secondary">
                      {t('common.coef', { n: g.coefficient })}
                    </Txt>
                    <Txt variant="caption" tone="secondary">
                      {t('common.classAvg', { n: formatScore(g.classAverage) })}
                    </Txt>
                  </Row>
                </View>
                <View style={{ backgroundColor: col.bg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' }}>
                  <Txt variant="heading" color={col.fg}>
                    {formatScore(g.score)}
                  </Txt>
                  <Txt variant="caption" color={col.fg}>
                    / {g.outOf}
                  </Txt>
                </View>
              </Row>
              {g.comment ? (
                <View style={{ marginTop: space.md, borderStartWidth: 3, borderStartColor: col.fg, paddingStart: space.md }}>
                  <Txt variant="caption" tone="secondary">
                    {t('grades.teacherComment')}
                  </Txt>
                  <Txt variant="body" style={{ fontStyle: 'italic' }}>
                    “{g.comment}”
                  </Txt>
                </View>
              ) : null}
            </Card>
          </FadeIn>
        ))}
      </View>

      {user?.role === 'parent' && teacher ? (
        <Button
          label={`${t('messages.new')} — ${teacherDisplayName(teacher)}`}
          variant="soft"
          icon="chatbubble-ellipses-outline"
          style={{ marginTop: space.xl }}
          onPress={() => {
            const id = startConversation(teacher.userId, data.student.id);
            router.push(`/chat/${id}`);
          }}
        />
      ) : null}
      <Row gap={6} style={{ marginTop: space.md, justifyContent: 'center' }}>
        <Icon name="information-circle-outline" size={14} color={c.textTertiary} />
        <Txt variant="caption" tone="tertiary">
          {t('grades.privacyNote')}
        </Txt>
      </Row>
    </Screen>
  );
}
