import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { canTeachClass, DEMO_TODAY, getClass, parentsOf, studentsInClass } from '@edulink/shared';
import { useStore } from '../../../store/AppStore';
import { useTheme } from '../../../theme/ThemeProvider';
import { useI18n } from '../../../i18n/I18nProvider';
import { space } from '../../../theme/tokens';
import { ATTENDANCE_META } from '../../../lib/meta';
import { Screen } from '../../../components/Screen';
import { Txt } from '../../../components/Txt';
import { Avatar, Button, Card, EmptyState, IconButton, Pill, Row, SectionHeader } from '../../../components/ui';

export default function ClassRoster() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, user, startConversation } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const cls = getClass(db, id);
  // Teachers only access their authorised classes.
  if (!user || !cls || !canTeachClass(db, user, id)) return <Screen title={t('teacher.roster')}><EmptyState icon="lock-closed-outline" title={t('messages.notAllowed')} /></Screen>;
  const students = studentsInClass(db, id);

  return (
    <Screen title={cls.name} subtitle={`${t('teacher.students', { n: students.length })} · ${t('teacher.classAverage', { avg: cls.average })}`}>
      <Row gap={space.sm} wrap>
        <Button label={t('teacher.takeAttendance')} icon="checkbox-outline" size="sm" full={false} onPress={() => router.push({ pathname: '/teacher/attendance', params: { classId: id } })} />
        <Button label={t('teacher.addGrade')} icon="stats-chart-outline" size="sm" variant="soft" full={false} onPress={() => router.push('/teacher/grade')} />
        <Button label={t('teacher.addHomework')} icon="create-outline" size="sm" variant="soft" full={false} onPress={() => router.push('/teacher/homework')} />
      </Row>
      <SectionHeader title={t('teacher.roster')} />
      <Card padded={false}>
        {students.map((s, i) => {
          const rec = db.attendance.find((a) => a.studentId === s.id && a.date === DEMO_TODAY);
          const parent = parentsOf(db, s.id)[0];
          return (
            <Row key={s.id} style={{ padding: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}>
              <Avatar name={`${s.firstName} ${s.lastName}`} color={s.avatarColor} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong">
                  {s.lastName} {s.firstName}
                </Txt>
                {rec ? <Pill label={t(ATTENDANCE_META[rec.status].key)} tone={ATTENDANCE_META[rec.status].tone} icon={ATTENDANCE_META[rec.status].icon} small /> : null}
              </View>
              <IconButton icon="star-outline" label={`${t('teacher.addFeedback')} — ${s.firstName}`} size={40} onPress={() => router.push({ pathname: '/teacher/feedback', params: { studentId: s.id, classId: id } })} />
              {parent ? (
                <IconButton icon="chatbubble-ellipses-outline" label={t('teacher.parentsOf', { name: s.firstName })} size={40} onPress={() => router.push(`/chat/${startConversation(parent.id, s.id)}`)} />
              ) : null}
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
