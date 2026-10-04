import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatDate, formatMoney, type RSVP } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Icon, IconBadge, Pill, Row, SectionHeader, type IconName } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { SignaturePad } from '../../components/SignaturePad';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, user, rsvp, signAuthorization, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const ev = db.events.find((e) => e.id === id);
  if (!ev) return <Screen title={t('events.title')}>{null}</Screen>;
  const part = student ? db.eventParticipants.find((p) => p.eventId === ev.id && p.studentId === student.id) : undefined;
  const isParent = user?.role === 'parent';

  const options: { value: RSVP; label: string; icon: IconName }[] = [
    { value: 'yes', label: t('events.rsvp.yes'), icon: 'checkmark-circle' },
    { value: 'no', label: t('events.rsvp.no'), icon: 'close-circle' },
    { value: 'maybe', label: t('events.rsvp.maybe'), icon: 'help-circle' },
  ];

  return (
    <Screen>
      <View style={{ alignItems: 'center', backgroundColor: c.eventSoft, borderRadius: radius.xl, paddingVertical: space.xxl }}>
        <Txt style={{ fontSize: 56, lineHeight: 68 }}>{ev.emoji}</Txt>
      </View>
      <Txt variant="display" style={{ marginTop: space.xl }} accessibilityRole="header">
        {ev.title}
      </Txt>
      <Card style={{ marginTop: space.lg, gap: space.md }}>
        <InfoLine icon="calendar-outline" text={`📅 ${formatDate(ev.date, locale, 'long')}`} />
        {ev.time ? <InfoLine icon="time-outline" text={`🕒 ${ev.time}${ev.endTime ? ` — ${ev.endTime}` : ''}`} /> : null}
        <InfoLine icon="location-outline" text={`📍 ${ev.location}`} />
        <InfoLine icon="person-outline" text={t('events.organizer', { name: ev.organizer })} />
        {ev.cost ? <InfoLine icon="card-outline" text={t('events.cost', { amount: formatMoney(ev.cost, db.school.currency) })} /> : null}
      </Card>
      <Txt variant="body" style={{ marginTop: space.lg, fontSize: 16, lineHeight: 25 }}>
        {ev.description}
      </Txt>

      {isParent && student ? (
        <>
          <SectionHeader title={`${t('events.rsvp')} — ${student.firstName}`} />
          <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
            {options.map((o) => {
              const selected = part?.response === o.value;
              return (
                <Pressable key={o.value} onPress={() => rsvp(ev.id, student.id, o.value)} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingHorizontal: space.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primarySoft : c.card }}>
                  <Icon name={o.icon} size={22} color={selected ? c.primary : c.textSecondary} />
                  <Txt variant="bodyStrong" tone={selected ? 'primary' : 'default'} style={{ flex: 1 }}>
                    {o.label}
                  </Txt>
                  {selected ? <Icon name="checkmark" size={20} color={c.primary} /> : null}
                </Pressable>
              );
            })}
          </View>

          {ev.requiresAuthorization ? (
            <>
              <SectionHeader title={t('events.authorization')} />
              {part?.authorizationSignedAt ? (
                <Card tone="success">
                  <Row>
                    <IconBadge icon="shield-checkmark" color={c.successText} bg={c.card} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      {t('events.authorizationSigned', { date: `${formatDate(part.authorizationSignedAt.slice(0, 10), locale, 'dayMonth')} ${part.authorizationSignedAt.slice(11, 16)}` })}
                    </Txt>
                  </Row>
                </Card>
              ) : (
                <Card tone="warning" style={{ gap: space.md }}>
                  <Row>
                    <Icon name="alert-circle" size={20} color={c.warningText} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      {t('events.authorizationRequired')}
                    </Txt>
                  </Row>
                  <Button label={t('events.signAuthorization')} icon="create-outline" onPress={() => setSigning(true)} />
                </Card>
              )}
            </>
          ) : null}
        </>
      ) : null}

      <Sheet visible={signing} onClose={() => setSigning(false)} title={t('signature.title')}>
        <Txt variant="bodyStrong">
          {ev.title} — {student?.firstName} {student?.lastName}
        </Txt>
        <SignaturePad onChange={setSignature} />
        <Pressable onPress={() => setConsent((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: consent ? c.primary : c.borderStrong, backgroundColor: consent ? c.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            {consent ? <Icon name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Txt variant="body" style={{ flex: 1 }}>
            {t('signature.consent')}
          </Txt>
        </Pressable>
        <Button
          label={t('signature.submit')}
          icon="checkmark-done"
          disabled={!signature || !consent}
          onPress={() => {
            if (!student) return;
            signAuthorization(ev.id, student.id);
            setSigning(false);
            showToast({ title: t('signature.title'), body: t('signature.done'), category: 'success' });
          }}
        />
        <Row gap={6}>
          <Icon name="lock-closed" size={13} color={c.textTertiary} />
          <Txt variant="caption" tone="tertiary" style={{ flex: 1 }}>
            {t('documents.secure')}
          </Txt>
        </Row>
      </Sheet>
      {ev.requiresAuthorization && !isParent ? <Pill label={t('events.authorizationRequired')} tone="warning" /> : null}
    </Screen>
  );
}

function InfoLine({ text }: { icon: IconName; text: string }) {
  return <Txt variant="bodyStrong">{text}</Txt>;
}
