import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Segmented, TextField, ToggleRow } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

export default function CreateAnnouncement() {
  const { user, publishAnnouncement, showToast } = useStore();
  const { t } = useI18n();
  const classes = useMyClasses();
  const isAdmin = user?.role === 'admin';
  const [classIds, setClassIds] = useState<string[]>(classes.slice(0, 1));
  const [schoolWide, setSchoolWide] = useState(isAdmin);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important'>('normal');

  return (
    <Screen
      title={t('teacher.createAnnouncement')}
      footer={
        <Button
          label={t('common.publish')}
          icon="megaphone-outline"
          disabled={!title.trim() || !body.trim() || (!schoolWide && !classIds.length)}
          onPress={() => {
            publishAnnouncement({ title: title.trim(), body: body.trim(), classIds: schoolWide ? [] : classIds, priority, requiresAck: false, scope: schoolWide ? 'school' : 'class' });
            showToast({ title: t('announcements.title'), body: t('teacher.announcementSaved'), category: 'success' });
            router.back();
          }}
        />
      }
    >
      <View style={{ gap: space.lg }}>
        {isAdmin ? <ToggleRow icon="business-outline" label={t('teacher.wholeSchool')} value={schoolWide} onChange={setSchoolWide} /> : null}
        {!schoolWide ? <ClassPicker multiple values={classIds} onChangeMany={setClassIds} /> : null}
        <TextField label={t('common.title')} value={title} onChangeText={setTitle} />
        <TextField label={t('common.message')} value={body} onChangeText={setBody} multiline />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('teacher.priority')}
          </Txt>
          <Segmented value={priority} onChange={setPriority} options={[{ value: 'normal', label: t('teacher.priority.normal') }, { value: 'important', label: t('teacher.priority.important') }]} />
        </View>
      </View>
    </Screen>
  );
}
