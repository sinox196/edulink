import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DEMO_TODAY, getClass, getTeacher, isoWeekday, slotState, subjectName, teacherDisplayName, teacherForUser, timetableForClass, timetableForTeacher, weekdayName, type TimetableSlot } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Chip, Icon, Pill, Row, Segmented } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';

export default function Timetable() {
  const { db, user } = useStore();
  const { c, subject } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const today = isoWeekday(DEMO_TODAY);
  const [mode, setMode] = useState<'today' | 'week'>('today');
  const [day, setDay] = useState(today <= 5 ? today : 1);
  const teacher = user?.role === 'teacher' ? teacherForUser(db, user.id) : undefined;
  const slotsFor = (d: number) => (teacher ? timetableForTeacher(db, teacher.id, d) : student ? timetableForClass(db, student.classId, d) : []);
  const shownDay = mode === 'today' ? today : day;
  const slots = slotsFor(shownDay);

  const renderSlot = (s: TimetableSlot, i: number) => {
    if (!s.subjectId) {
      return (
        <Row key={s.id} gap={10} style={{ paddingVertical: 6, paddingHorizontal: space.md }}>
          <Txt variant="caption" tone="tertiary" style={{ width: 92 }}>
            {s.start} — {s.end}
          </Txt>
          <Icon name={s.label === 'Pause' ? 'cafe-outline' : 'restaurant-outline'} size={15} color={c.textTertiary} />
          <Txt variant="captionStrong" tone="tertiary">
            {s.label === 'Pause' ? t('timetable.break') : t('timetable.lunch')}
          </Txt>
        </Row>
      );
    }
    const sub = db.subjects.find((x) => x.id === s.subjectId)!;
    const col = subject(sub.color);
    const state = shownDay === today ? slotState(s) : 'upcoming';
    return (
      <FadeIn key={s.id} index={i}>
        <Row style={{ alignItems: 'stretch', opacity: state === 'past' ? 0.72 : 1 }}>
          <View style={{ width: 52, paddingTop: 12 }}>
            <Txt variant="captionStrong">{s.start}</Txt>
            <Txt variant="caption" tone="tertiary">
              {s.end}
            </Txt>
          </View>
          <View
            accessible
            accessibilityLabel={`${s.start} — ${s.end}, ${subjectName(s.subjectId, locale)}, ${t('common.room', { room: s.room ?? '' })}`}
            style={{ flex: 1, backgroundColor: col.bg, borderRadius: radius.md, padding: space.md, borderStartWidth: 4, borderStartColor: col.fg, gap: 2 }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="bodyStrong" color={col.fg}>
                {subjectName(s.subjectId, locale)}
              </Txt>
              {state === 'current' ? <Pill label={t('timetable.now')} tone="success" small /> : null}
            </Row>
            <Txt variant="caption" color={col.fg} style={{ opacity: 0.85 }}>
              {teacher ? getClass(db, s.classId)?.name : teacherDisplayName(getTeacher(db, s.teacherId))} · {t('common.room', { room: s.room ?? '' })}
            </Txt>
          </View>
        </Row>
      </FadeIn>
    );
  };

  return (
    <Screen title={t('timetable.title')} subtitle={teacher ? teacherDisplayName(teacher) : student ? `${student.firstName} · ${getClass(db, student.classId)?.name}` : undefined}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <View style={{ marginVertical: space.lg }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'today', label: t('timetable.today') },
            { value: 'week', label: t('timetable.week') },
          ]}
        />
      </View>
      {mode === 'week' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: space.lg }}>
          {[1, 2, 3, 4, 5].map((d) => (
            <Chip key={d} label={weekdayName(d, locale)} selected={day === d} onPress={() => setDay(d)} count={slotsFor(d).filter((s) => s.subjectId).length} />
          ))}
        </ScrollView>
      ) : (
        <Txt variant="heading" style={{ marginBottom: space.md, textTransform: 'capitalize' }}>
          {weekdayName(today, locale)}
        </Txt>
      )}
      <View style={{ gap: space.sm }}>{slots.length ? slots.map(renderSlot) : <Txt tone="secondary">{t('timetable.noClass')}</Txt>}</View>
    </Screen>
  );
}
