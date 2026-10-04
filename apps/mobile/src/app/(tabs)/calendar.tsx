import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { calendarItems, DEMO_TODAY, eachDay, formatDate, subjectName, teacherForUser, type CalendarItem, type CalendarKind, type EduLinkDatabase } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Chip, IconBadge, Pill, Row, SectionHeader, type IconName } from '../../components/ui';
import { MonthCalendar } from '../../components/MonthCalendar';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { FadeIn } from '../../components/animated';
import type { TranslationKey } from '../../i18n/fr';

type Filter = 'all' | CalendarKind;
const FILTERS: { key: Filter; label: TranslationKey }[] = [
  { key: 'all', label: 'calendar.filter.all' },
  { key: 'exam', label: 'calendar.filter.exam' },
  { key: 'homework', label: 'calendar.filter.homework' },
  { key: 'event', label: 'calendar.filter.event' },
  { key: 'holiday', label: 'calendar.filter.holiday' },
  { key: 'meeting', label: 'calendar.filter.meeting' },
  { key: 'admin', label: 'calendar.filter.admin' },
];

const KIND_ICON: Record<CalendarKind, IconName> = {
  exam: 'document-text',
  homework: 'create',
  event: 'sparkles',
  holiday: 'sunny',
  meeting: 'people',
  admin: 'briefcase',
};

/** Calendar items for staff (classes they teach / whole school). */
function staffItems(db: EduLinkDatabase, userId: string): CalendarItem[] {
  const t = teacherForUser(db, userId);
  const classIds = t ? t.classIds : db.classes.map((c) => c.id);
  const items: CalendarItem[] = [];
  for (const h of db.holidays) for (const d of eachDay(h.start, h.end)) items.push({ id: `${h.id}-${d}`, date: d, kind: 'holiday', title: h.label });
  for (const e of db.exams.filter((x) => classIds.includes(x.classId) && (!t || x.teacherId === t.id))) items.push({ id: e.id, date: e.date, kind: 'exam', title: `${subjectName(e.subjectId, 'fr')} — ${e.title}`, subtitle: db.classes.find((c) => c.id === e.classId)?.name, time: e.time });
  for (const h of db.homework.filter((x) => t && x.teacherId === t.id)) items.push({ id: h.id, date: h.dueDate, kind: 'homework', title: h.title, subtitle: db.classes.find((c) => c.id === h.classId)?.name });
  for (const e of db.events.filter((x) => x.classIds.length === 0 || x.classIds.some((c) => classIds.includes(c)))) items.push({ id: e.id, date: e.date, kind: e.category === 'meeting' ? 'meeting' : 'event', title: `${e.emoji} ${e.title}`, subtitle: e.location, time: e.time, link: `/events/${e.id}` });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export default function CalendarTab() {
  const { db, user } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  const [filter, setFilter] = useState<Filter>('all');
  const [month, setMonth] = useState({ y: 2026, m: 10 });
  const [selected, setSelected] = useState(DEMO_TODAY);

  const kindColor: Record<CalendarKind, [string, string]> = {
    exam: [c.academic, c.academicSoft],
    homework: [c.primary, c.primarySoft],
    event: [c.event, c.eventSoft],
    holiday: [c.successText, c.successSoft],
    meeting: [c.secondary, c.secondarySoft],
    admin: [c.textSecondary, c.backgroundAlt],
  };

  const items = useMemo(() => {
    if (!user) return [];
    const all = user.role === 'parent' || user.role === 'student' ? (student ? calendarItems(db, student.id, locale, user.role === 'parent' ? user.id : undefined) : []) : staffItems(db, user.id);
    return filter === 'all' ? all : all.filter((i) => i.kind === filter);
  }, [db, user, student, locale, filter]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const i of items) m.set(i.date, [...(m.get(i.date) ?? []), i]);
    return m;
  }, [items]);

  const dayItems = byDay.get(selected) ?? [];
  const upcoming = items.filter((i) => i.date > selected && i.kind !== 'holiday').slice(0, 6);

  return (
    <Screen title={t('calendar.title')} back={false} inTabs>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: space.md }}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={t(f.label)} icon={f.key === 'all' ? undefined : KIND_ICON[f.key]} selected={filter === f.key} onPress={() => setFilter(f.key)} color={f.key === 'all' ? undefined : kindColor[f.key][0]} />
        ))}
      </ScrollView>

      <Card>
        <MonthCalendar
          year={month.y}
          month={month.m}
          onChangeMonth={(y, m) => setMonth({ y, m })}
          selected={selected}
          onSelect={setSelected}
          decorate={(d) => {
            const its = byDay.get(d) ?? [];
            const holiday = its.some((i) => i.kind === 'holiday');
            return {
              dots: [...new Set(its.filter((i) => i.kind !== 'holiday').map((i) => kindColor[i.kind][0]))],
              bg: holiday ? kindColor.holiday[1] : undefined,
              a11y: its.map((i) => i.title).join(', '),
            };
          }}
        />
        <Row gap={12} wrap style={{ marginTop: space.md }}>
          {(Object.keys(kindColor) as CalendarKind[]).map((k) => (
            <Row key={k} gap={5}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: kindColor[k][0] }} />
              <Txt variant="caption" tone="secondary">
                {t(FILTERS.find((f) => f.key === k)!.label)}
              </Txt>
            </Row>
          ))}
        </Row>
      </Card>

      <SectionHeader title={formatDate(selected, locale, 'weekday')} />
      {dayItems.length ? (
        <View style={{ gap: space.sm }}>
          {dayItems.map((i, idx) => (
            <FadeIn key={i.id} index={idx}>
              <AgendaRow item={i} colors={kindColor[i.kind]} />
            </FadeIn>
          ))}
        </View>
      ) : (
        <Card>
          <Txt variant="body" tone="secondary" align="center">
            {t('calendar.nothing')}
          </Txt>
        </Card>
      )}

      <SectionHeader title={t('calendar.agenda')} />
      <View style={{ gap: space.sm }}>
        {upcoming.map((i) => (
          <AgendaRow key={i.id} item={i} colors={kindColor[i.kind]} showDate />
        ))}
      </View>
    </Screen>
  );
}

function AgendaRow({ item, colors, showDate }: { item: CalendarItem; colors: [string, string]; showDate?: boolean }) {
  const { t, locale } = useI18n();
  const label = t(FILTERS.find((f) => f.key === item.kind)!.label);
  return (
    <Card onPress={item.link ? () => router.push(item.link as never) : undefined} accessibilityLabel={`${label}: ${item.title}`}>
      <Row>
        <IconBadge icon={KIND_ICON[item.kind]} color={colors[0]} bg={colors[1]} size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" numberOfLines={2}>
            {item.title}
          </Txt>
          <Txt variant="caption" tone="secondary" numberOfLines={1}>
            {[showDate ? formatDate(item.date, locale, 'weekday') : null, item.time, item.subtitle].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        <Pill label={label} tone="neutral" small />
      </Row>
    </Card>
  );
}
