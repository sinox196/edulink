import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Icon, TextField } from '../../components/ui';
import { ClassPicker, useMyClasses } from '../../features/teacher/ClassPicker';

export default function ShareDocument() {
  const { shareDocument, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const classes = useMyClasses();
  const [classIds, setClassIds] = useState<string[]>(classes.slice(0, 1));
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<string>();

  return (
    <Screen
      title={t('teacher.shareDocument')}
      footer={
        <Button
          label={t('common.publish')}
          icon="share-outline"
          disabled={!title.trim() || !classIds.length}
          onPress={() => {
            shareDocument({ title: title.trim(), classIds });
            showToast({ title: t('documents.title'), body: t('teacher.documentSaved'), category: 'success' });
            router.back();
          }}
        />
      }
    >
      <View style={{ gap: space.lg }}>
        <ClassPicker multiple values={classIds} onChangeMany={setClassIds} />
        <TextField label={t('common.title')} value={title} onChangeText={setTitle} placeholder="Fiche de révision — Chapitre 4" />
        <Pressable
          onPress={async () => {
            const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
            if (!res.canceled && res.assets?.[0]) {
              setFile(res.assets[0].name);
              if (!title) setTitle(res.assets[0].name.replace(/\.[a-z0-9]+$/i, ''));
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('teacher.pickFile')}
          style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: file ? c.success : c.borderStrong, borderRadius: radius.md, padding: space.xl, alignItems: 'center', gap: 6, backgroundColor: file ? c.successSoft : c.card }}
        >
          <Icon name={file ? 'document-attach' : 'cloud-upload-outline'} size={28} color={file ? c.successText : c.primary} />
          <Txt variant="bodyStrong" tone={file ? 'success' : 'primary'}>
            {file ?? t('teacher.pickFile')}
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}
