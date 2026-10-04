import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { formatDate, type AbsenceReason } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { useStudentData } from '../../lib/hooks';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Chip, EmptyState, Icon, Row, TextField } from '../../components/ui';

const REASONS: AbsenceReason[] = ['illness', 'medical', 'family', 'transport', 'other'];

export default function Justify() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { justifyAbsence, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const candidates = (data?.attendance ?? []).filter((a) => ['absent', 'unexcused', 'late'].includes(a.status) && !a.justification).reverse();
  const [recordId, setRecordId] = useState(params.id ?? candidates[0]?.id);
  const [reason, setReason] = useState<AbsenceReason>('illness');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  if (!data) return null;

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: false });
    if (!res.canceled && res.assets?.[0]) setFile(res.assets[0].name);
  };

  return (
    <Screen
      title={t('justify.title')}
      subtitle={`${data.student.firstName} · ${data.cls.name}`}
      footer={
        candidates.length ? (
          <Button
            label={t('justify.submit')}
            icon="send"
            loading={sending}
            disabled={!recordId}
            onPress={() => {
              setSending(true);
              setTimeout(() => {
                justifyAbsence(recordId!, reason, message.trim(), file);
                showToast({ title: t('attendance.justified'), body: t('justify.success'), category: 'success' });
                setSending(false);
                router.back();
              }, 600);
            }}
          />
        ) : undefined
      }
    >
      {!candidates.length ? (
        <EmptyState icon="happy-outline" title={t('justify.none')} />
      ) : (
        <View style={{ gap: space.xl }}>
          <View style={{ gap: space.sm }}>
            <Txt variant="captionStrong" tone="secondary">
              {t('justify.date')}
            </Txt>
            <Row gap={8} wrap accessibilityRole="radiogroup">
              {candidates.map((a) => (
                <Chip key={a.id} label={formatDate(a.date, locale, 'weekday')} icon="calendar-outline" selected={recordId === a.id} onPress={() => setRecordId(a.id)} />
              ))}
            </Row>
          </View>
          <View style={{ gap: space.sm }}>
            <Txt variant="captionStrong" tone="secondary">
              {t('justify.reason')}
            </Txt>
            <Row gap={8} wrap accessibilityRole="radiogroup">
              {REASONS.map((r) => (
                <Chip key={r} label={t(`justify.reason.${r}`)} selected={reason === r} onPress={() => setReason(r)} />
              ))}
            </Row>
          </View>
          <TextField label={t('justify.message')} placeholder={t('justify.messagePlaceholder')} value={message} onChangeText={setMessage} multiline />
          <View style={{ gap: space.sm }}>
            <Txt variant="captionStrong" tone="secondary">
              {t('justify.document')} ({t('common.optional')})
            </Txt>
            <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel={t('justify.attach')} style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: file ? c.success : c.borderStrong, borderRadius: radius.md, padding: space.lg, alignItems: 'center', gap: 6, backgroundColor: file ? c.successSoft : c.card }}>
              <Icon name={file ? 'document-attach' : 'cloud-upload-outline'} size={26} color={file ? c.successText : c.primary} />
              <Txt variant="bodyStrong" tone={file ? 'success' : 'primary'} align="center">
                {file ?? t('justify.attach')}
              </Txt>
              <Txt variant="caption" tone="tertiary" align="center">
                PDF, JPG, PNG · 10 Mo max
              </Txt>
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}
