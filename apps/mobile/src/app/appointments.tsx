import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DEMO_TODAY, formatDate, getTeacher, subjectName, teacherDisplayName } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Avatar, Button, Card, Chip, Icon, Pill, PressableScale, Row, SectionHeader, Segmented, TextField } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';

export default function Appointments() {
  const { db, user, bookAppointment, cancelAppointment, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const teacherIds = useMemo(() => {
    if (!student) return [];
    return [...new Set(db.timetable.filter((s) => s.classId === student.classId && s.teacherId).map((s) => s.teacherId!))].filter((id) => db.appointmentSlots.some((sl) => sl.teacherId === id));
  }, [db, student]);
  const [teacherId, setTeacherId] = useState<string | undefined>(teacherIds[0]);
  const [slotId, setSlotId] = useState<string | undefined>();
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'in_person' | 'video'>('in_person');
  if (!student || !user) return null;
  const tid = teacherIds.includes(teacherId ?? '') ? teacherId : teacherIds[0];
  const slots = db.appointmentSlots.filter((s) => s.teacherId === tid && s.date >= DEMO_TODAY).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const history = db.appointments.filter((a) => a.parentId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const teacher = getTeacher(db, tid);
  const slot = slots.find((s) => s.id === slotId);

  return (
    <Screen title={t('appointments.title')}>
      <ChildSwitcher />
      <SectionHeader title={t('appointments.chooseTeacher')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
        {teacherIds.map((id) => {
          const tt = getTeacher(db, id)!;
          const selected = id === tid;
          return (
            <PressableScale key={id} onPress={() => { setTeacherId(id); setSlotId(undefined); }} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${teacherDisplayName(tt)}, ${subjectName(tt.subjectIds[0], locale)}`} style={{ width: 132, padding: space.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primarySoft : c.card, alignItems: 'center', gap: 6 }}>
              <Avatar name={`${tt.firstName} ${tt.lastName}`} color={db.users.find((u) => u.id === tt.userId)?.avatarColor ?? c.primary} size={48} />
              <Txt variant="captionStrong" align="center" numberOfLines={1}>
                {teacherDisplayName(tt)}
              </Txt>
              <Txt variant="caption" tone="secondary" align="center" numberOfLines={1}>
                {subjectName(tt.subjectIds[0], locale)}
              </Txt>
            </PressableScale>
          );
        })}
      </ScrollView>

      <SectionHeader title={t('appointments.chooseSlot')} />
      {slots.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {slots.map((s) => {
            const booked = !!s.bookedBy;
            const selected = s.id === slotId;
            return (
              <PressableScale key={s.id} disabled={booked} onPress={() => setSlotId(s.id)} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: booked }} style={{ flexBasis: '47%', flexGrow: 1, padding: space.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary : booked ? c.backgroundAlt : c.card }}>
                <Txt variant="captionStrong" color={selected ? '#FFFFFF' : booked ? c.textTertiary : c.text} style={{ textTransform: 'capitalize' }}>
                  {formatDate(s.date, locale, 'weekday')}
                </Txt>
                <Txt variant="heading" color={selected ? '#FFFFFF' : booked ? c.textTertiary : c.primary}>
                  {s.start} – {s.end}
                </Txt>
                {booked ? (
                  <Txt variant="caption" tone="tertiary">
                    {t('clubs.full')}
                  </Txt>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      ) : (
        <Txt tone="secondary">{t('appointments.noSlots')}</Txt>
      )}

      <View style={{ marginTop: space.xl, gap: space.lg }}>
        <TextField label={t('appointments.reason')} placeholder={t('appointments.reasonPlaceholder')} value={reason} onChangeText={setReason} multiline />
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary">
            {t('appointments.mode')}
          </Txt>
          <Segmented value={mode} onChange={setMode} options={[{ value: 'in_person', label: t('appointments.mode.in_person') }, { value: 'video', label: t('appointments.mode.video') }]} />
        </View>
        <Button
          label={t('appointments.book')}
          icon="calendar-outline"
          disabled={!slot || reason.trim().length < 3}
          onPress={() => {
            if (!slot) return;
            bookAppointment(slot.id, student.id, reason.trim(), mode);
            showToast({ title: t('appointments.title'), body: t('appointments.confirmed', { name: teacherDisplayName(teacher), date: formatDate(slot.date, locale, 'weekday'), time: slot.start }), category: 'success' });
            setSlotId(undefined);
            setReason('');
          }}
        />
      </View>

      <SectionHeader title={t('appointments.history')} />
      <View style={{ gap: space.md }}>
        {history.map((a) => {
          const tt = getTeacher(db, a.teacherId);
          const tone = a.status === 'confirmed' ? 'success' : a.status === 'cancelled' ? 'error' : a.status === 'completed' ? 'neutral' : 'warning';
          return (
            <Card key={a.id}>
              <Row style={{ alignItems: 'flex-start' }}>
                <Icon name={a.mode === 'video' ? 'videocam-outline' : 'people-outline'} size={22} color={c.primary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">
                    {teacherDisplayName(tt)} · {subjectName(tt?.subjectIds[0], locale)}
                  </Txt>
                  <Txt variant="caption" tone="secondary">
                    {formatDate(a.date, locale, 'weekday')} · {a.start} – {a.end}
                  </Txt>
                  <Txt variant="caption">{a.reason}</Txt>
                </View>
                <Pill label={t(`appointments.status.${a.status}`)} tone={tone} small />
              </Row>
              {a.status === 'confirmed' ? <Chip label={t('appointments.cancel')} icon="close" onPress={() => cancelAppointment(a.id)} /> : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
