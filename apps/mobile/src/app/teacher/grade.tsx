import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { DEMO_TODAY, studentsInClass, subjectName, teacherForUser } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Avatar, Button, Card, Chip, Row, TextField } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

export default function AddGrade() {
  const { db, user, publishGrades, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const teacher = user ? teacherForUser(db, user.id) : undefined;
  const classes = useMyClasses();
  const [classId, setClassId] = useState(classes.includes('cls-6-b') ? 'cls-6-b' : classes[0]);
  const [examName, setExamName] = useState('');
  const [coef, setCoef] = useState(1);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const students = useMemo(() => studentsInClass(db, classId), [db, classId]);
  const subjectId = teacher?.subjectIds[0] ?? 'sub-maths';

  const valid = Object.entries(scores).filter(([, v]) => v.trim() !== '' && !isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) >= 0 && Number(v.replace(',', '.')) <= 20);
  const avg = valid.length ? Math.round((valid.reduce((s, [, v]) => s + Number(v.replace(',', '.')), 0) / valid.length) * 10) / 10 : null;

  return (
    <Screen
      title={t('teacher.addGrade')}
      subtitle={subjectName(subjectId, locale)}
      footer={
        <View style={{ gap: space.sm }}>
          {avg !== null ? (
            <Txt variant="captionStrong" tone="academic" align="center">
              {t('teacher.classAverage', { avg })} · {valid.length}/{students.length}
            </Txt>
          ) : null}
          <Button
            label={t('teacher.publishGrades')}
            icon="cloud-upload-outline"
            disabled={!examName.trim() || !valid.length}
            onPress={() => {
              const n = publishGrades({
                classId,
                subjectId,
                examName: examName.trim(),
                coefficient: coef,
                date: DEMO_TODAY,
                entries: valid.map(([studentId, v]) => ({ studentId, score: Number(v.replace(',', '.')), comment: comments[studentId]?.trim() || undefined })),
              });
              showToast({ title: t('teacher.addGrade'), body: t('teacher.gradesSaved', { n, avg: avg ?? '-' }), category: 'success' });
              router.back();
            }}
          />
        </View>
      }
    >
      <View style={{ gap: space.lg }}>
        <ClassPicker value={classId} onChange={(id) => { setClassId(id); setScores({}); }} />
        <TextField label={t('teacher.gradeTitle')} placeholder={t('teacher.gradeTitlePlaceholder')} value={examName} onChangeText={setExamName} />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('teacher.coefficient')}
          </Txt>
          <Row gap={8}>
            {[0.5, 1, 2, 3].map((n) => (
              <Chip key={n} label={`× ${n}`} selected={coef === n} onPress={() => setCoef(n)} />
            ))}
          </Row>
        </View>
      </View>
      <Card padded={false} style={{ marginTop: space.xl }}>
        {students.map((s, i) => {
          const v = scores[s.id] ?? '';
          const num = Number(v.replace(',', '.'));
          const bad = v !== '' && (isNaN(num) || num < 0 || num > 20);
          return (
            <View key={s.id} style={{ padding: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, gap: 6 }}>
              <Row>
                <Avatar name={`${s.firstName} ${s.lastName}`} color={s.avatarColor} size={34} />
                <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {s.lastName} {s.firstName}
                </Txt>
                <TextInput
                  value={v}
                  onChangeText={(x) => setScores((p) => ({ ...p, [s.id]: x }))}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={c.textTertiary}
                  accessibilityLabel={`${t('teacher.score')} ${s.firstName} ${s.lastName}`}
                  style={{ width: 70, height: 44, borderRadius: radius.sm, borderWidth: 1.5, borderColor: bad ? c.error : v ? c.academic : c.border, textAlign: 'center', fontSize: 16, fontWeight: '700', color: c.text, backgroundColor: c.card }}
                />
                <Txt variant="caption" tone="secondary">
                  /20
                </Txt>
              </Row>
              {v && !bad ? (
                <TextInput
                  value={comments[s.id] ?? ''}
                  onChangeText={(x) => setComments((p) => ({ ...p, [s.id]: x }))}
                  placeholder={`${t('teacher.comment')} (${t('common.optional')})`}
                  placeholderTextColor={c.textTertiary}
                  accessibilityLabel={`${t('teacher.comment')} ${s.firstName}`}
                  style={{ marginStart: 46, minHeight: 40, borderRadius: radius.sm, backgroundColor: c.backgroundAlt, paddingHorizontal: 12, color: c.text, fontSize: 14 }}
                />
              ) : null}
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
