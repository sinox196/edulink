import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { studentsInClass } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Chip, Row, Segmented, TextField } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

const PRESETS = {
  positive: ['Excellente participation en classe.', "Très bon travail d'équipe.", 'Beaux progrès ce mois-ci, bravo !', 'Travail soigné et rigoureux.'],
  improvement: ['Devoir non remis — à rattraper.', 'Manque de concentration, à encourager.', 'Penser à apporter le matériel.', 'Participation orale à développer.'],
};

export default function AddFeedback() {
  const params = useLocalSearchParams<{ studentId?: string; classId?: string }>();
  const { db, addFeedback, showToast } = useStore();
  const { t } = useI18n();
  const classes = useMyClasses();
  const [classId, setClassId] = useState(params.classId ?? (classes.includes('cls-6-b') ? 'cls-6-b' : classes[0]));
  const students = useMemo(() => studentsInClass(db, classId), [db, classId]);
  const [studentId, setStudentId] = useState<string | undefined>(params.studentId);
  const [kind, setKind] = useState<'positive' | 'improvement'>('positive');
  const [text, setText] = useState('');

  return (
    <Screen
      title={t('teacher.addFeedback')}
      footer={
        <Button
          label={t('common.send')}
          icon="send"
          disabled={!studentId || !text.trim()}
          onPress={() => {
            addFeedback({ studentId: studentId!, kind, text: text.trim() });
            showToast({ title: t('behavior.title'), body: t('teacher.feedbackSaved'), category: 'success' });
            router.back();
          }}
        />
      }
    >
      <View style={{ gap: space.lg }}>
        <ClassPicker value={classId} onChange={(id) => { setClassId(id); setStudentId(undefined); }} />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('teacher.student')}
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {students.map((s) => (
              <Chip key={s.id} label={`${s.firstName} ${s.lastName.charAt(0)}.`} selected={studentId === s.id} onPress={() => setStudentId(s.id)} />
            ))}
          </ScrollView>
        </View>
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('teacher.feedbackKind')}
          </Txt>
          <Segmented value={kind} onChange={(k) => { setKind(k); setText(''); }} options={[{ value: 'positive', label: `⭐ ${t('behavior.positive')}` }, { value: 'improvement', label: `🌱 ${t('behavior.improvement')}` }]} />
        </View>
        <Row gap={8} wrap>
          {PRESETS[kind].map((p) => (
            <Chip key={p} label={p} selected={text === p} onPress={() => setText(p)} />
          ))}
        </Row>
        <TextField label={t('common.message')} value={text} onChangeText={setText} multiline />
      </View>
    </Screen>
  );
}
