import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { formatScore, gradesFor, subjectName } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { useStudentData } from '../../lib/hooks';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Icon, IconBadge, ProgressBar, Row, SectionHeader, type IconName } from '../../components/ui';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { AnimatedNumber, FadeIn } from '../../components/animated';
import { GradeCard } from '../../features/home/widgets';

export default function Grades() {
  const { db, user } = useStore();
  const { c, subject } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  if (!data) return null;
  const { student, average, subjects } = data;
  const recent = gradesFor(db, student.id).slice(0, 4);

  return (
    <Screen title={t('grades.title')} subtitle={`${student.firstName} · ${t('grades.term', { n: 1 })}`}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <FadeIn style={{ marginTop: space.lg }}>
        <View style={{ borderRadius: radius.xl, padding: space.xl, backgroundColor: c.academic, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF', opacity: 0.08, top: -80, end: -60 }} />
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Txt variant="captionStrong" color="rgba(255,255,255,0.85)">
                {t('grades.general')}
              </Txt>
              <Row gap={4} style={{ alignItems: 'flex-end' }}>
                <AnimatedNumber value={average?.average ?? 0} decimals={1} color="#FFFFFF" style={{ fontSize: 44, lineHeight: 50 }} />
                <Txt variant="heading" color="rgba(255,255,255,0.8)" style={{ marginBottom: 6 }}>
                  / 20
                </Txt>
              </Row>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="captionStrong" color="rgba(255,255,255,0.85)">
                {t('grades.class')}
              </Txt>
              <Txt variant="title" color="#FFFFFF">
                {average?.classAverage.toFixed(1)} / 20
              </Txt>
            </View>
          </Row>
          <Card onPress={() => router.push('/analytics')} style={{ marginTop: space.lg, backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'transparent' }}>
            <Row>
              <Icon name="sparkles" color="#FFFFFF" size={18} />
              <Txt variant="bodyStrong" color="#FFFFFF" style={{ flex: 1 }}>
                {t('grades.analytics')}
              </Txt>
              <Icon name="chevron-forward" color="#FFFFFF" size={18} />
            </Row>
          </Card>
        </View>
      </FadeIn>

      <SectionHeader title={t('grades.bySubject')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {subjects.map((s, i) => {
          const col = subject(s.subject.color);
          return (
            <FadeIn key={s.subject.id} index={i} style={{ flexBasis: '46%', flexGrow: 1 }}>
              <Card onPress={() => router.push(`/grades/${s.subject.id}`)} style={{ gap: space.sm }} accessibilityLabel={`${subjectName(s.subject.id, locale)} ${formatScore(s.average)} / 20, ${t('common.classAvg', { n: s.classAverage })}`}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <IconBadge icon={s.subject.icon as IconName} color={col.fg} bg={col.bg} size={36} />
                  {s.trend !== null ? (
                    <Row gap={2}>
                      <Icon name={s.trend >= 0 ? 'trending-up' : 'trending-down'} size={15} color={s.trend >= 0 ? c.successText : c.warningText} />
                      <Txt variant="captionStrong" color={s.trend >= 0 ? c.successText : c.warningText}>
                        {s.trend > 0 ? '+' : ''}
                        {s.trend.toFixed(1)}
                      </Txt>
                    </Row>
                  ) : null}
                </Row>
                <Txt variant="captionStrong" numberOfLines={1}>
                  {subjectName(s.subject.id, locale)}
                </Txt>
                <Txt variant="number" color={col.fg} style={{ fontSize: 24 }}>
                  {formatScore(s.average)}
                  <Txt variant="caption" tone="secondary">
                    {' '}/ 20
                  </Txt>
                </Txt>
                <ProgressBar value={s.average / 20} color={col.fg} height={6} />
                <Txt variant="caption" tone="secondary">
                  {t('common.classAvg', { n: s.classAverage.toFixed(1) })}
                </Txt>
              </Card>
            </FadeIn>
          );
        })}
      </View>

      <SectionHeader title={t('grades.recent')} />
      <View style={{ gap: space.md }}>
        {recent.map((g, i) => (
          <FadeIn key={g.id} index={i}>
            <GradeCard grade={g} />
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
