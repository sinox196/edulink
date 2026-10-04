import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DEMO_TODAY, getClass, isoWeekday, studentsInClass, teacherForUser, timetableForTeacher, type AttendanceStatus } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Avatar, Button, Card, Chip, Icon, Row } from '../../components/ui';
import { ClassPicker } from '../../features/teacher/ClassPicker';

type Mark = 'present' | 'absent' | 'late';

/** Rapid roll call: "Tout marquer présent", then tap the exceptions. */
export default function TakeAttendance() {
  const params = useLocalSearchParams<{ classId?: string; start?: string }>();
  const { db, user, saveAttendance, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const teacher = user ? teacherForUser(db, user.id) : undefined;
  const todaySlots = teacher ? timetableForTeacher(db, teacher.id, isoWeekday(DEMO_TODAY)) : [];
  const [classId, setClassId] = useState(params.classId ?? todaySlots.find((s) => s.classId === 'cls-4-b')?.classId ?? teacher?.classIds[0] ?? '');
  const slot = todaySlots.find((s) => s.classId === classId && (!params.start || s.start === params.start)) ?? todaySlots.find((s) => s.classId === classId);
  const start = params.start ?? slot?.start ?? '08:00';
  const students = useMemo(() => studentsInClass(db, classId), [db, classId]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [late, setLate] = useState<Record<string, number>>({});

  // Pre-fill with what is already known today (QR check-ins, previous roll call).
  useEffect(() => {
    const init: Record<string, Mark> = {};
    for (const s of students) {
      const rec = db.attendance.find((a) => a.studentId === s.id && a.date === DEMO_TODAY);
      if (rec) init[s.id] = rec.status === 'late' ? 'late' : rec.status === 'present' || rec.status === 'early_leave' ? 'present' : 'absent';
    }
    setMarks(init);
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = { present: 0, absent: 0, late: 0, unmarked: 0 };
  for (const s of students) {
    const m = marks[s.id];
    if (m) counts[m]++;
    else counts.unmarked++;
  }

  const options: { value: Mark; emoji: string; label: string; color: string; bg: string }[] = [
    { value: 'present', emoji: '✅', label: t('attendance.status.present'), color: c.successText, bg: c.successSoft },
    { value: 'absent', emoji: '❌', label: t('attendance.status.absent'), color: c.errorText, bg: c.errorSoft },
    { value: 'late', emoji: '⏰', label: t('attendance.status.late'), color: c.warningText, bg: c.warningSoft },
  ];

  return (
    <Screen
      title={t('teacher.takeAttendance')}
      subtitle={`${getClass(db, classId)?.name ?? ''} · ${start}`}
      footer={
        <View style={{ gap: space.sm }}>
          <Txt variant="captionStrong" tone="secondary" align="center">
            {t('teacher.summary', { present: counts.present, absent: counts.absent, late: counts.late })}
          </Txt>
          <Button
            label={t('teacher.submitAttendance')}
            icon="checkmark-done"
            disabled={counts.unmarked > 0}
            onPress={() => {
              const entries = students.map((s) => ({ studentId: s.id, status: marks[s.id] as AttendanceStatus, minutesLate: marks[s.id] === 'late' ? late[s.id] ?? 10 : undefined }));
              const res = saveAttendance(classId, start, entries);
              showToast({ title: t('teacher.attendanceDone'), body: t('teacher.attendanceSaved', { absent: res.absent, late: res.late }), category: 'success' });
              router.back();
            }}
          />
        </View>
      }
    >
      <ClassPicker value={classId} onChange={setClassId} />
      <Button
        label={t('teacher.markAllPresent')}
        variant="soft"
        icon="checkmark-circle-outline"
        style={{ marginTop: space.lg }}
        onPress={() => setMarks(Object.fromEntries(students.map((s) => [s.id, marks[s.id] === 'absent' || marks[s.id] === 'late' ? marks[s.id] : 'present'])) as Record<string, Mark>)}
      />
      <Card padded={false} style={{ marginTop: space.lg }}>
        {students.map((s, i) => {
          const m = marks[s.id];
          return (
            <View key={s.id} style={{ paddingHorizontal: space.md, paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, gap: 6 }}>
              <Row>
                <Avatar name={`${s.firstName} ${s.lastName}`} color={s.avatarColor} size={36} />
                <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {s.lastName} {s.firstName}
                </Txt>
                <Row gap={6}>
                  {options.map((o) => {
                    const selected = m === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setMarks((prev) => ({ ...prev, [s.id]: o.value }))}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`${s.firstName} ${s.lastName} : ${o.label}`}
                        style={{ width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? o.bg : c.backgroundAlt, borderWidth: 2, borderColor: selected ? o.color : 'transparent' }}
                      >
                        <Txt style={{ fontSize: 18, opacity: selected ? 1 : 0.45 }}>{o.emoji}</Txt>
                      </Pressable>
                    );
                  })}
                </Row>
              </Row>
              {m === 'late' ? (
                <Row gap={6} style={{ paddingStart: 48 }}>
                  <Icon name="time-outline" size={15} color={c.warningText} />
                  {[5, 10, 15, 20].map((n) => (
                    <Chip key={n} label={`${n} min`} selected={(late[s.id] ?? 10) === n} onPress={() => setLate((prev) => ({ ...prev, [s.id]: n }))} color={c.warning} />
                  ))}
                </Row>
              ) : null}
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
