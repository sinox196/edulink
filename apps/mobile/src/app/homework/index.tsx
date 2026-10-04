import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { formatDate, getTeacher, subjectName, teacherDisplayName, type HomeworkStatus } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { useStudentData } from '../../lib/hooks';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, EmptyState, Icon, Pill, PressableScale, Row, Segmented } from '../../components/ui';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { FadeIn } from '../../components/animated';
import { SubjectDot } from '../../features/home/widgets';

export default function HomeworkList() {
  const { db, user, toggleHomework } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const [tab, setTab] = useState<HomeworkStatus>('todo');
  if (!data) return null;
  const items = data.homework.filter((h) => h.status === tab);
  const count = (s: HomeworkStatus) => data.homework.filter((h) => h.status === s).length;
  const isStudent = user?.role === 'student';

  return (
    <Screen title={t('homework.title')} subtitle={`${data.student.firstName} · ${data.cls.name}`}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <View style={{ marginVertical: space.lg }}>
        <Segmented<HomeworkStatus>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'todo', label: t('homework.todo'), count: count('todo') },
            { value: 'done', label: t('homework.done'), count: count('done') },
            { value: 'late', label: t('homework.late'), count: count('late') },
          ]}
        />
      </View>
      {!isStudent ? (
        <Row gap={6} style={{ marginBottom: space.md }}>
          <Icon name="eye-outline" size={15} color={c.textSecondary} />
          <Txt variant="caption" tone="secondary">
            {t('homework.parentView')}
          </Txt>
        </Row>
      ) : null}
      {!items.length ? (
        <EmptyState icon="happy-outline" title={tab === 'todo' ? t('homework.emptyTodo') : t('common.empty')} />
      ) : (
        <View style={{ gap: space.md }}>
          {items.map(({ homework: h, status, completedAt }, i) => (
            <FadeIn key={h.id} index={i}>
              <Card onPress={() => router.push(`/homework/${h.id}`)}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <SubjectDot subjectId={h.subjectId} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt variant="label" tone="secondary">
                      {subjectName(h.subjectId, locale)}
                    </Txt>
                    <Txt variant="bodyStrong" style={status === 'done' ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}>
                      {h.title}
                    </Txt>
                    <Txt variant="caption" tone="secondary">
                      {t('homework.due', { date: formatDate(h.dueDate, locale, 'weekday') })} · {teacherDisplayName(getTeacher(db, h.teacherId))}
                    </Txt>
                    <Row gap={6} wrap style={{ marginTop: 4 }}>
                      {status === 'todo' ? <Pill label={t('homework.todo')} tone="info" icon="ellipse-outline" small /> : null}
                      {status === 'done' ? <Pill label={completedAt ? t('homework.completedAt', { date: formatDate(completedAt.slice(0, 10), locale, 'dayMonth') }) : t('homework.done')} tone="success" icon="checkmark-circle" small /> : null}
                      {status === 'late' ? <Pill label={t('homework.late')} tone="warning" icon="alert-circle" small /> : null}
                      {h.attachments.length ? <Pill label={String(h.attachments.length)} tone="neutral" icon="attach" small /> : null}
                    </Row>
                  </View>
                  {isStudent ? (
                    <PressableScale onPress={() => toggleHomework(h.id, data.student.id)} accessibilityRole="checkbox" accessibilityState={{ checked: status === 'done' }} accessibilityLabel={status === 'done' ? t('homework.markTodo') : t('homework.markDone')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: status === 'done' ? c.success : c.borderStrong, backgroundColor: status === 'done' ? c.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {status === 'done' ? <Icon name="checkmark" size={18} color="#FFFFFF" /> : null}
                      </View>
                    </PressableScale>
                  ) : null}
                </Row>
              </Card>
            </FadeIn>
          ))}
        </View>
      )}
    </Screen>
  );
}
