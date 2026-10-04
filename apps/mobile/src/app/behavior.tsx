import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { formatDate, getTeacher, subjectName, teacherDisplayName, type TeacherFeedback } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Card, Chip, Row, SectionHeader } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';

/** Non-punitive design: soft colours, encouragements first, "points à travailler" phrased as growth. */
export default function Behavior() {
  const { db, user, startConversation } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  if (!student) return null;
  const items = db.feedback.filter((f) => f.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const positive = items.filter((f) => f.kind === 'positive');
  const improve = items.filter((f) => f.kind === 'improvement');

  const Item = ({ f, i }: { f: TeacherFeedback; i: number }) => {
    const teacher = getTeacher(db, f.teacherId);
    const pos = f.kind === 'positive';
    return (
      <FadeIn index={i}>
        <Card style={{ borderStartWidth: 4, borderStartColor: pos ? c.success : c.warning }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Txt style={{ fontSize: 20 }}>{pos ? '⭐' : '🌱'}</Txt>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="bodyStrong">{f.text}</Txt>
              <Txt variant="caption" tone="secondary">
                {teacherDisplayName(teacher)} · {subjectName(f.subjectId, locale)} · {formatDate(f.date, locale, 'dayMonth')}
              </Txt>
              {user?.role === 'parent' && teacher ? (
                <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <Chip label={t('behavior.reply')} icon="chatbubble-outline" onPress={() => router.push(`/chat/${startConversation(teacher.userId, student.id)}`)} />
                </View>
              ) : null}
            </View>
          </Row>
        </Card>
      </FadeIn>
    );
  };

  return (
    <Screen title={t('behavior.title')}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <Card tone="success" style={{ marginTop: space.lg }}>
        <Row>
          <View style={{ width: 56, height: 56, borderRadius: radius.lg, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="title" tone="success">
              {positive.length}
            </Txt>
          </View>
          <Txt variant="body" style={{ flex: 1 }}>
            {t('behavior.intro', { name: student.firstName })}
          </Txt>
        </Row>
      </Card>
      <SectionHeader title={`⭐ ${t('behavior.positive')}`} />
      <View style={{ gap: space.md }}>
        {positive.map((f, i) => (
          <Item key={f.id} f={f} i={i} />
        ))}
      </View>
      {improve.length ? (
        <>
          <SectionHeader title={`🌱 ${t('behavior.improvement')}`} />
          <View style={{ gap: space.md }}>
            {improve.map((f, i) => (
              <Item key={f.id} f={f} i={i} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
