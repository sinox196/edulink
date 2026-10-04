import React from 'react';
import { View } from 'react-native';
import { diffDays, DEMO_TODAY, formatDate, getTeacher, inDays, subjectName, teacherDisplayName, upcomingExams } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { exportPdf } from '../services/pdf';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, Divider, Icon, ListRow, Pill, Row } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';
import { SubjectDot } from '../features/home/widgets';

export default function Exams() {
  const { db, user, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  if (!student) return null;
  const exams = upcomingExams(db, student.classId);
  const soon = exams.find((e) => diffDays(DEMO_TODAY, e.date) <= 2);

  return (
    <Screen title={t('exams.title')} subtitle={student.firstName}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      {soon ? (
        <Card tone="warning" style={{ marginTop: space.lg }}>
          <Row>
            <Icon name="alarm" size={22} color={c.warningText} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {t('exams.reminder', { subject: subjectName(soon.subjectId, locale).toLowerCase(), when: inDays(soon.date, locale).toLowerCase() })}
            </Txt>
          </Row>
        </Card>
      ) : null}
      <View style={{ gap: space.md, marginTop: space.lg }}>
        {exams.map((e, i) => (
          <FadeIn key={e.id} index={i}>
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <SubjectDot subjectId={e.subjectId} size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="heading">{subjectName(e.subjectId, locale)}</Txt>
                  <Txt variant="bodyStrong" tone="secondary">
                    {e.title}
                  </Txt>
                </View>
                <Pill label={inDays(e.date, locale)} tone={diffDays(DEMO_TODAY, e.date) <= 2 ? 'warning' : 'academic'} small />
              </Row>
              <View style={{ marginTop: space.md, gap: 6 }}>
                <Txt variant="body">📅 {formatDate(e.date, locale, 'weekday')} · 🕘 {e.time} · {t('exams.duration', { n: e.durationMinutes })}</Txt>
                <Txt variant="caption" tone="secondary">
                  📍 {t('common.room', { room: e.room })} · {teacherDisplayName(getTeacher(db, e.teacherId))}
                </Txt>
              </View>
              <Divider />
              <Txt variant="captionStrong" tone="secondary" style={{ marginTop: space.md }}>
                {t('exams.chapters')}
              </Txt>
              <View style={{ marginTop: 6, gap: 4 }}>
                {e.chapters.map((ch) => (
                  <Row key={ch} gap={8}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.academic }} />
                    <Txt variant="body">{ch}</Txt>
                  </Row>
                ))}
              </View>
              {e.revisionDocs.length ? (
                <>
                  <Txt variant="captionStrong" tone="secondary" style={{ marginTop: space.md }}>
                    {t('exams.revision')}
                  </Txt>
                  {e.revisionDocs.map((d) => (
                    <ListRow key={d.id} icon="document-text-outline" title={d.name} subtitle={d.size} chevron={false} right={<Icon name="download-outline" size={18} color={c.primary} />} onPress={async () => {
                      await exportPdf(`<h1>${d.name}</h1><p>${e.chapters.join(' · ')}</p>`, d.name);
                    }} />
                  ))}
                </>
              ) : null}
              <Button label={t('exams.setReminder')} icon="notifications-outline" variant="soft" size="sm" style={{ marginTop: space.md }} onPress={() => showToast({ title: t('exams.title'), body: t('exams.reminderSet'), category: 'success' })} />
            </Card>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}
