import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { minutesToTime, timeToMinutes } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Card, EmptyState, Icon, IconBadge, Pill, Row, SectionHeader } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { Pulse } from '../components/animated';

/**
 * Live bus tracking (simulated: one demo minute every 3 seconds).
 * Privacy: only the family's own stop is named; other stops are anonymised.
 */
export default function Transport() {
  const { db, user, simulateTransport } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const student = useCurrentStudent();
  const assignment = student ? db.busAssignments.find((a) => a.studentId === student.id) : undefined;
  const bus = assignment ? db.buses.find((b) => b.id === assignment.busId) : undefined;
  const route = assignment ? db.routes.find((r) => r.id === assignment.eveningRouteId) : undefined;
  const morning = assignment ? db.routes.find((r) => r.id === assignment.morningRouteId) : undefined;
  const [clock, setClock] = useState(timeToMinutes('16:45'));
  const notified = useRef<{ soon?: boolean; arrived?: boolean }>({});

  useEffect(() => {
    const id = setInterval(() => setClock((m) => (m < timeToMinutes('17:20') ? m + 1 : m)), 3000);
    return () => clearInterval(id);
  }, []);

  const stopIdx = route ? route.stops.findIndex((s) => s.name === assignment?.stopName) : -1;
  const eta = route && stopIdx >= 0 ? timeToMinutes(route.stops[stopIdx].time) : 0;
  const minutesLeft = eta - clock;

  useEffect(() => {
    if (!student || user?.role !== 'parent') return;
    if (minutesLeft <= 5 && minutesLeft > 0 && !notified.current.soon) {
      notified.current.soon = true;
      simulateTransport(student.id, 'arriving', minutesLeft);
    }
    if (minutesLeft <= 0 && !notified.current.arrived) {
      notified.current.arrived = true;
      simulateTransport(student.id, 'arrivedSchool');
    }
  }, [minutesLeft, student, simulateTransport, user]);

  if (!db.school.modules.transport) return <Screen title={t('transport.title')}><EmptyState title={t('payments.disabled')} /></Screen>;
  if (!student || !bus || !route || !assignment) return <Screen title={t('transport.title')}><EmptyState icon="bus-outline" title={t('common.empty')} /></Screen>;

  const progressIdx = route.stops.filter((s) => timeToMinutes(s.time) <= clock).length - 1;
  const arrived = minutesLeft <= 0;

  return (
    <Screen title={t('transport.title')} subtitle={student.firstName}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}
      <Card style={{ marginTop: space.lg, backgroundColor: '#0F2A5F', borderColor: '#0F2A5F' }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Txt variant="caption" color="rgba(255,255,255,0.75)">
              {route.name}
            </Txt>
            <Txt variant="display" color="#FFFFFF">
              🚌 {t('transport.bus', { n: bus.number })}
            </Txt>
            <Txt variant="captionStrong" color="rgba(255,255,255,0.85)">
              {t('transport.driver')} : {bus.driverFirstName} · {bus.plate}
            </Txt>
          </View>
          <Pulse>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: arrived ? '#14B8A6' : '#22C55E', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
              <Txt variant="captionStrong" color="#06260F">
                {arrived ? t('transport.arrived').split('.')[0] : `🟢 ${t('transport.state.en_route')}`}
              </Txt>
            </View>
          </Pulse>
        </Row>
        <Row style={{ marginTop: space.lg, gap: space.md }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, padding: space.md }}>
            <Txt variant="caption" color="rgba(255,255,255,0.75)">
              {t('transport.eta')}
            </Txt>
            <Txt variant="title" color="#FFFFFF">
              {minutesToTime(eta)}
            </Txt>
            <Txt variant="captionStrong" color="#5EEAD4">
              {arrived ? '✓' : t('transport.minutes', { n: minutesLeft })}
            </Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, padding: space.md }}>
            <Txt variant="caption" color="rgba(255,255,255,0.75)">
              {t('transport.yourStop')}
            </Txt>
            <Txt variant="bodyStrong" color="#FFFFFF">
              {assignment.stopName}
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.75)">
              {t('common.liveDemo')} · {minutesToTime(clock)}
            </Txt>
          </View>
        </Row>
      </Card>

      <SectionHeader title={t('transport.route')} />
      <Card>
        {route.stops.map((s, i) => {
          const passed = i <= progressIdx;
          const mine = s.name === assignment.stopName;
          const school = s.name.startsWith('École');
          const label = mine || school ? s.name : `${t('transport.otherStop')} ${i}`;
          const isBusHere = i === progressIdx && !arrived;
          return (
            <Row key={s.id} style={{ alignItems: 'stretch', minHeight: 54 }}>
              <View style={{ width: 28, alignItems: 'center' }}>
                <View style={{ width: 3, flex: 1, backgroundColor: i === 0 ? 'transparent' : passed ? c.success : c.border }} />
                <View style={{ width: mine ? 22 : 14, height: mine ? 22 : 14, borderRadius: 11, backgroundColor: passed ? c.success : c.card, borderWidth: 3, borderColor: mine ? c.primary : passed ? c.success : c.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                  {isBusHere ? <Txt style={{ fontSize: 10 }}>🚌</Txt> : null}
                </View>
                <View style={{ width: 3, flex: 1, backgroundColor: i === route.stops.length - 1 ? 'transparent' : i < progressIdx ? c.success : c.border }} />
              </View>
              <Row style={{ flex: 1, justifyContent: 'space-between', paddingStart: space.sm }}>
                <Txt variant={mine || school ? 'bodyStrong' : 'body'} tone={mine ? 'primary' : passed ? 'default' : 'secondary'}>
                  {mine ? '🏠 ' : school ? '🏫 ' : ''}
                  {label}
                </Txt>
                <Txt variant="captionStrong" tone={passed ? 'success' : 'secondary'}>
                  {s.time}
                </Txt>
              </Row>
            </Row>
          );
        })}
      </Card>
      <Row gap={8} style={{ marginTop: space.md }}>
        <Icon name="shield-checkmark" size={16} color={c.successText} />
        <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
          {t('transport.privacy')}
        </Txt>
      </Row>

      <SectionHeader title={t('transport.timeline')} />
      <Card style={{ gap: space.md }}>
        {[
          { time: '07:31', text: t('push.boarded', { name: student.firstName }), icon: 'enter-outline' as const },
          { time: morning?.stops[morning.stops.length - 1].time ?? '07:58', text: t('push.busArrivedSchool'), icon: 'school-outline' as const },
          { time: '16:36', text: t('push.boarded', { name: student.firstName }), icon: 'enter-outline' as const },
          ...(arrived ? [{ time: minutesToTime(eta), text: t('transport.arrived'), icon: 'home-outline' as const }] : []),
        ].map((e, i) => (
          <Row key={i}>
            <IconBadge icon={e.icon} color={c.warningText} bg={c.warningSoft} size={36} />
            <Txt variant="body" style={{ flex: 1 }}>
              {e.text}
            </Txt>
            <Pill label={e.time} tone="neutral" small />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
