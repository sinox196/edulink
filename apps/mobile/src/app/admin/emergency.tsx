import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Chip, EmptyState, ProgressBar, Row, SectionHeader, TextField, ToggleRow } from '../../components/ui';
import type { TranslationKey } from '../../i18n/fr';

const TEMPLATES: { key: TranslationKey; body: string; category: 'closure' | 'transport' | 'security' }[] = [
  { key: 'admin.template.closure', body: "L'établissement sera exceptionnellement fermé demain. Les cours reprendront normalement le jour suivant.", category: 'closure' },
  { key: 'admin.template.transport', body: 'En raison de travaux, les bus scolaires partiront 15 minutes plus tard ce soir.', category: 'transport' },
  { key: 'admin.template.drill', body: "Un exercice d'évacuation aura lieu demain matin. Il s'agit d'un exercice prévu.", category: 'security' },
];

export default function Emergency() {
  const { db, user, publishAnnouncement, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ack, setAck] = useState(true);
  const [category, setCategory] = useState<'closure' | 'transport' | 'security'>('closure');
  if (user?.role !== 'admin') return <Screen title={t('admin.emergency')}><EmptyState icon="lock-closed-outline" title={t('messages.notAllowed')} /></Screen>;
  const families = new Set(db.studentParents.map((l) => l.parentId)).size;
  const tracked = db.announcements.filter((a) => a.requiresAck);

  return (
    <Screen title={`⚠️ ${t('admin.emergency')}`}>
      <Txt variant="body" tone="secondary">
        {t('admin.emergencyIntro')}
      </Txt>
      <SectionHeader title={t('admin.templates')} />
      <Row gap={8} wrap>
        {TEMPLATES.map((tp) => (
          <Chip key={tp.key} label={t(tp.key)} icon="flash-outline" selected={title === t(tp.key)} onPress={() => { setTitle(t(tp.key)); setBody(tp.body); setCategory(tp.category); }} />
        ))}
      </Row>
      <View style={{ gap: space.lg, marginTop: space.xl }}>
        <TextField label={t('admin.emergencyTitle')} value={title} onChangeText={setTitle} />
        <TextField label={t('admin.emergencyBody')} value={body} onChangeText={setBody} multiline />
        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <ToggleRow icon="checkmark-done-outline" label={t('admin.requireAck')} value={ack} onChange={setAck} />
        </Card>
        <Button
          label={t('admin.sendEmergency')}
          icon="warning"
          disabled={!title.trim() || !body.trim()}
          style={{ backgroundColor: c.error, borderColor: c.error }}
          onPress={() => {
            publishAnnouncement({ title: title.trim(), body: body.trim(), classIds: [], priority: 'critical', requiresAck: ack, scope: 'school', category });
            showToast({ title: t('admin.emergency'), body: t('admin.emergencySent', { n: families }), category: 'urgent' });
            setTitle('');
            setBody('');
          }}
        />
      </View>

      <SectionHeader title={t('admin.ackTracking')} />
      <View style={{ gap: space.md }}>
        {tracked.map((a) => {
          const rate = Math.round((a.acknowledgedBy.length / Math.max(1, a.recipientCount)) * 100);
          return (
            <Card key={a.id} style={{ gap: 8 }}>
              <Txt variant="bodyStrong">{a.title}</Txt>
              <ProgressBar value={rate / 100} color={rate > 70 ? c.success : c.warning} />
              <Txt variant="caption" tone="secondary">
                {t('announcements.ackRate', { n: rate })} · {a.acknowledgedBy.length} / {a.recipientCount}
              </Txt>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
