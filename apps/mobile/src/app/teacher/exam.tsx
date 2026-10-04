import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { addDays, DEMO_TODAY, formatDate, isSchoolDay, subjectName, teacherForUser } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Chip, Row, TextField } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

export default function AddExam() {
  const { db, user, addExam, showToast } = useStore();
  const { t, locale } = useI18n();
  const teacher = user ? teacherForUser(db, user.id) : undefined;
  const classes = useMyClasses();
  const [classId, setClassId] = useState(classes[0]);
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState('');
  const days = Array.from({ length: 21 }, (_, i) => addDays(DEMO_TODAY, i + 2)).filter(isSchoolDay).slice(0, 8);
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState('09:00');
  const subjectId = teacher?.subjectIds[0] ?? 'sub-maths';

  return (
    <Screen
      title={t('teacher.addExam')}
      subtitle={subjectName(subjectId, locale)}
      footer={
        <Button
          label={t('common.save')}
          icon="calendar-outline"
          disabled={!title.trim()}
          onPress={() => {
            addExam({ classId, subjectId, title: title.trim(), date, time, chapters: chapters.split(',').map((c) => c.trim()).filter(Boolean), room: 'B12' });
            showToast({ title: t('exams.title'), body: t('teacher.examSaved'), category: 'success' });
            router.back();
          }}
        />
      }
    >
      <View style={{ gap: space.lg }}>
        <ClassPicker value={classId} onChange={setClassId} />
        <TextField label={t('common.title')} placeholder="Contrôle N°4" value={title} onChangeText={setTitle} />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('common.date')}
          </Txt>
          <Row gap={8} wrap>
            {days.map((d) => (
              <Chip key={d} label={formatDate(d, locale, 'weekday')} selected={date === d} onPress={() => setDate(d)} />
            ))}
          </Row>
        </View>
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('common.time')}
          </Txt>
          <Row gap={8} wrap>
            {['08:00', '09:00', '10:15', '11:15', '13:30', '14:30'].map((h) => (
              <Chip key={h} label={h} selected={time === h} onPress={() => setTime(h)} />
            ))}
          </Row>
        </View>
        <TextField label={t('teacher.chapters')} value={chapters} onChangeText={setChapters} placeholder="Fractions, Équations, Géométrie" />
      </View>
    </Screen>
  );
}
