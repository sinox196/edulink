import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { attendanceByWeek, attendanceStats, formatDate, isSchoolDay, isWeekend, type AttendanceRecord } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { ATTENDANCE_META, toneColors } from '../../lib/meta';
import { genderize, useStudentData } from '../../lib/hooks';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Icon, IconBadge, Pill, Row, SectionHeader } from '../../components/ui';
import { MonthCalendar } from '../../components/MonthCalendar';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { Columns } from '../../components/charts';
import { AnimatedNumber, FadeIn, ProgressRing } from '../../components/animated';

export default function Attendance() {
  const { user } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const [month, setMonth] = useState({ y: 2026, m: 10 });
  const [selected, setSelected] = useState<string | undefined>();

  const byDate = useMemo(() => new Map((data?.attendance ?? []).map((a) => [a.date, a])), [data]);
  const monthRecords = useMemo(() => (data?.attendance ?? []).filter((a) => a.date.startsWith(`${month.y}-${String(month.m + 1).padStart(2, '0')}`)), [data, month]);
  if (!data) return null;
  const { student, today, stats } = data;
  const mStats = attendanceStats(monthRecords);
  const weeks = attendanceByWeek(data.attendance).slice(-8);
  const notable = [...data.attendance].reverse().filter((a) => a.status !== 'present').slice(0, 6);
  const sel = selected ? byDate.get(selected) : undefined;
  const isParent = user?.role === 'parent';

  return (
    <Screen title={t('attendance.title')} subtitle={`${student.firstName} · ${data.cls.name}`}>
      {isParent ? <ChildSwitcher /> : null}

      <FadeIn style={{ marginTop: space.lg }}>
        <SectionHeader title={t('attendance.today')} style={{ marginTop: 0 }} />
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <InfoCol label={t('attendance.entry')} value={today?.checkIn ?? t('attendance.notYet')} icon="log-in-outline" />
            <InfoCol label={t('attendance.status')} value={today ? `${ATTENDANCE_META[today.status].emoji} ${genderize(t(ATTENDANCE_META[today.status].key), student.gender)}` : '—'} icon="pulse-outline" />
            <InfoCol label={t('attendance.exit')} value={today?.checkOut ?? t('attendance.notYet')} icon="log-out-outline" />
          </Row>
          {today ? (
            <Txt variant="caption" tone="secondary" style={{ marginTop: space.md }}>
              {t('attendance.via', { source: t(`attendance.source.${today.source}`) })}
            </Txt>
          ) : null}
        </Card>
      </FadeIn>

      <FadeIn index={1}>
        <SectionHeader title={t('attendance.monthly')} />
        <Card>
          <MonthCalendar
            year={month.y}
            month={month.m}
            onChangeMonth={(y, m) => setMonth({ y, m })}
            selected={selected}
            onSelect={setSelected}
            decorate={(d) => {
              const r = byDate.get(d);
              if (r) {
                const [, bg] = toneColors(c, ATTENDANCE_META[r.status].tone);
                return { emoji: r.status === 'present' ? '🟢' : r.status === 'late' ? '🟠' : ATTENDANCE_META[r.status].emoji, bg: r.status === 'present' ? undefined : bg, a11y: t(ATTENDANCE_META[r.status].key) };
              }
              if (isWeekend(d)) return { muted: true, a11y: t('attendance.status.weekend') };
              if (!isSchoolDay(d)) return { muted: true, bg: c.backgroundAlt, a11y: t('attendance.status.holiday') };
              return {};
            }}
          />
          <Row gap={14} wrap style={{ marginTop: space.md }}>
            <Legend emoji="🟢" label={t('attendance.status.present')} />
            <Legend emoji="🔴" label={t('attendance.status.absent')} />
            <Legend emoji="🟠" label={t('attendance.status.late')} />
            <Legend emoji="🔵" label={t('attendance.status.excused')} />
          </Row>
          {sel ? <DayDetail record={sel} /> : null}
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <SectionHeader title={t('attendance.stats')} />
        <Card>
          <Row gap={16}>
            <ProgressRing progress={stats.rate / 100} size={92} stroke={10} color={c.success}>
              <AnimatedNumber value={stats.rate} suffix="%" color={c.successText} style={{ fontSize: 22 }} />
            </ProgressRing>
            <View style={{ flex: 1, gap: 8 }}>
              <StatLine label={t('attendance.stats.absences')} value={stats.absences} icon="close-circle" color={c.errorText} />
              <StatLine label={t('attendance.stats.late')} value={stats.late} icon="time" color={c.warningText} />
              <StatLine label={t('attendance.stats.excused')} value={stats.excused} icon="document-text" color={c.primary} />
            </View>
          </Row>
          <Txt variant="caption" tone="secondary" style={{ marginTop: space.md }}>
            {formatDate(`${month.y}-${String(month.m + 1).padStart(2, '0')}-01`, locale, 'monthYear')} : {mStats.rate}% · {mStats.absences} {t('attendance.stats.absences').toLowerCase()} · {mStats.late} {t('attendance.stats.late').toLowerCase()}
          </Txt>
        </Card>
      </FadeIn>

      {isParent ? <Button label={t('attendance.justify')} icon="document-attach-outline" style={{ marginTop: space.xl }} onPress={() => router.push('/attendance/justify')} /> : null}

      <FadeIn index={3}>
        <SectionHeader title={t('attendance.evolution')} />
        <Card>
          <Columns items={weeks.map((w) => ({ label: formatDate(w.week, locale, 'short'), value: w.rate }))} />
        </Card>
      </FadeIn>

      <FadeIn index={4}>
        <SectionHeader title={t('attendance.history')} />
        <View style={{ gap: space.sm }}>
          {notable.map((r) => (
            <HistoryRow key={r.id} r={r} />
          ))}
        </View>
      </FadeIn>
    </Screen>
  );
}

function InfoCol({ label, value, icon }: { label: string; value: string; icon: 'log-in-outline' | 'log-out-outline' | 'pulse-outline' }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={18} color={c.textSecondary} />
      <Txt variant="caption" tone="secondary" align="center">
        {label}
      </Txt>
      <Txt variant="bodyStrong" align="center">
        {value}
      </Txt>
    </View>
  );
}

function Legend({ emoji, label }: { emoji: string; label: string }) {
  return (
    <Row gap={4}>
      <Txt style={{ fontSize: 11 }}>{emoji}</Txt>
      <Txt variant="caption" tone="secondary">
        {label}
      </Txt>
    </Row>
  );
}

function StatLine({ label, value, icon, color }: { label: string; value: number; icon: 'close-circle' | 'time' | 'document-text'; color: string }) {
  return (
    <Row gap={8}>
      <Icon name={icon} size={17} color={color} />
      <Txt variant="body" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="heading" color={color}>
        {value}
      </Txt>
    </Row>
  );
}

function DayDetail({ record }: { record: AttendanceRecord }) {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  return (
    <View style={{ marginTop: space.md, backgroundColor: c.backgroundAlt, borderRadius: radius.md, padding: space.md, gap: 4 }}>
      <Txt variant="bodyStrong">{formatDate(record.date, locale, 'weekday')}</Txt>
      <Pill label={t(ATTENDANCE_META[record.status].key)} tone={ATTENDANCE_META[record.status].tone} icon={ATTENDANCE_META[record.status].icon} />
      <Txt variant="caption" tone="secondary">
        {t('attendance.entry')} : {record.checkIn ?? '—'} · {t('attendance.exit')} : {record.checkOut ?? '—'}
      </Txt>
    </View>
  );
}

function HistoryRow({ r }: { r: AttendanceRecord }) {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const meta = ATTENDANCE_META[r.status];
  const [fg, bg] = toneColors(c, meta.tone);
  const needs = r.status === 'absent' && !r.justification;
  return (
    <Card onPress={needs ? () => router.push({ pathname: '/attendance/justify', params: { id: r.id } }) : undefined}>
      <Row>
        <IconBadge icon={meta.icon} color={fg} bg={bg} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{formatDate(r.date, locale, 'weekday')}</Txt>
          <Txt variant="caption" tone="secondary">
            {meta.emoji} {t(meta.key)}
            {r.minutesLate ? ` · ${t('attendance.minutesLate', { n: r.minutesLate })}` : ''}
          </Txt>
          {r.justification ? (
            <Pill label={r.justification.status === 'accepted' ? t('attendance.justified') : t('attendance.pendingReview')} tone={r.justification.status === 'accepted' ? 'success' : 'info'} icon="document-attach" small />
          ) : needs ? (
            <Pill label={t('attendance.pending')} tone="warning" icon="alert-circle" small />
          ) : null}
        </View>
        {needs ? <Icon name="chevron-forward" color={c.textTertiary} /> : null}
      </Row>
    </Card>
  );
}
