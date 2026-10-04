import React from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatDate, getTeacher, homeworkFor, subjectName, teacherDisplayName, type Attachment } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { exportPdf } from '../../services/pdf';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Icon, ListRow, Pill, Row, SectionHeader, type IconName } from '../../components/ui';
import { SubjectDot } from '../../features/home/widgets';

const ATT_ICON: Record<Attachment['kind'], IconName> = { pdf: 'document-text', image: 'image', document: 'document', link: 'link', audio: 'musical-notes' };

export default function HomeworkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, user, toggleHomework, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const item = student ? homeworkFor(db, student.id).find((h) => h.homework.id === id) : undefined;
  if (!item || !student) return <Screen title={t('homework.title')}>{null}</Screen>;
  const h = item.homework;

  const open = async (a: Attachment) => {
    if (a.kind === 'link' && a.url) {
      Linking.openURL(a.url);
      return;
    }
    await exportPdf(`<h1>${a.name}</h1><p>${subjectName(h.subjectId, 'fr')} — ${h.title}</p>`, a.name);
    showToast({ title: a.name, body: t('documents.generated'), category: 'success' });
  };

  return (
    <Screen
      title={subjectName(h.subjectId, locale)}
      footer={
        user?.role === 'student' ? (
          <Button label={item.status === 'done' ? t('homework.markTodo') : t('homework.markDone')} variant={item.status === 'done' ? 'secondary' : 'success'} icon={item.status === 'done' ? 'refresh' : 'checkmark-circle'} onPress={() => toggleHomework(h.id, student.id)} />
        ) : undefined
      }
    >
      <Card>
        <Row style={{ alignItems: 'flex-start' }}>
          <SubjectDot subjectId={h.subjectId} size={48} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="title">{h.title}</Txt>
            <Pill label={item.status === 'done' ? t('homework.done') : item.status === 'late' ? t('homework.late') : t('homework.todo')} tone={item.status === 'done' ? 'success' : item.status === 'late' ? 'warning' : 'info'} icon={item.status === 'done' ? 'checkmark-circle' : 'time-outline'} />
          </View>
        </Row>
        <Txt variant="body" style={{ marginTop: space.lg }}>
          {h.description}
        </Txt>
        <View style={{ marginTop: space.lg, gap: 8 }}>
          <Row gap={8}>
            <Icon name="calendar-outline" size={17} color={c.textSecondary} />
            <Txt variant="bodyStrong">{t('homework.due', { date: formatDate(h.dueDate, locale, 'weekday') })}</Txt>
          </Row>
          <Row gap={8}>
            <Icon name="person-outline" size={17} color={c.textSecondary} />
            <Txt variant="body">
              {t('common.teacher')} : {teacherDisplayName(getTeacher(db, h.teacherId))}
            </Txt>
          </Row>
          {h.estimatedMinutes ? (
            <Row gap={8}>
              <Icon name="hourglass-outline" size={17} color={c.textSecondary} />
              <Txt variant="body">{t('homework.estimated', { n: h.estimatedMinutes })}</Txt>
            </Row>
          ) : null}
        </View>
      </Card>
      {h.attachments.length ? (
        <>
          <SectionHeader title={t('common.attachments')} />
          <Card padded={false} style={{ paddingHorizontal: space.lg }}>
            {h.attachments.map((a) => (
              <ListRow key={a.id} icon={ATT_ICON[a.kind]} title={a.name} subtitle={a.size ?? a.url} onPress={() => open(a)} right={<Icon name={a.kind === 'link' ? 'open-outline' : 'download-outline'} size={18} color={c.primary} />} chevron={false} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
