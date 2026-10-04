import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { addDays, DEMO_TODAY, formatDate, getClass, isSchoolDay, subjectName, teacherForUser, type Attachment } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Chip, Row, TextField } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

export default function AddHomework() {
  const { db, user, addHomework, showToast } = useStore();
  const { t, locale } = useI18n();
  const teacher = user ? teacherForUser(db, user.id) : undefined;
  const classes = useMyClasses();
  const [classId, setClassId] = useState(classes.includes('cls-6-b') ? 'cls-6-b' : classes[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const days = Array.from({ length: 14 }, (_, i) => addDays(DEMO_TODAY, i + 1)).filter(isSchoolDay).slice(0, 6);
  const [due, setDue] = useState(days[0]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const subjectId = teacher?.subjectIds[0] ?? 'sub-maths';

  return (
    <Screen
      title={t('teacher.addHomework')}
      subtitle={subjectName(subjectId, locale)}
      footer={
        <Button
          label={t('common.publish')}
          icon="send"
          disabled={!title.trim()}
          onPress={() => {
            addHomework({ classId, subjectId, title: title.trim(), description: description.trim(), dueDate: due, attachments });
            showToast({ title: t('teacher.addHomework'), body: t('teacher.homeworkSaved', { class: getClass(db, classId)?.name ?? '' }), category: 'success' });
            router.back();
          }}
        />
      }
    >
      <View style={{ gap: space.lg }}>
        <ClassPicker value={classId} onChange={setClassId} />
        <TextField label={t('common.title')} placeholder={t('teacher.homeworkTitlePlaceholder')} value={title} onChangeText={setTitle} />
        <TextField label={t('common.description')} value={description} onChangeText={setDescription} multiline />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('teacher.dueDate')}
          </Txt>
          <Row gap={8} wrap>
            {days.map((d) => (
              <Chip key={d} label={formatDate(d, locale, 'weekday')} selected={due === d} onPress={() => setDue(d)} />
            ))}
          </Row>
        </View>
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('common.attachments')}
          </Txt>
          <Row gap={8} wrap>
            {attachments.map((a) => (
              <Chip key={a.id} label={a.name} icon="attach" selected onPress={() => setAttachments((p) => p.filter((x) => x.id !== a.id))} />
            ))}
            <Chip
              label={t('teacher.pickFile')}
              icon="add"
              onPress={async () => {
                const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
                if (!res.canceled && res.assets?.[0]) {
                  const f = res.assets[0];
                  setAttachments((p) => [...p, { id: `att-${Date.now()}`, name: f.name, kind: f.mimeType?.startsWith('image') ? 'image' : f.mimeType === 'application/pdf' ? 'pdf' : 'document', size: f.size ? `${Math.round(f.size / 1024)} Ko` : undefined }]);
                }
              }}
            />
          </Row>
        </View>
      </View>
    </Screen>
  );
}
