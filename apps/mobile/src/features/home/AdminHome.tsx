import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { absencesByClass, schoolKpis } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { useInitialLoad } from '../../lib/hooks';
import { RefreshSkeleton, Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, IconBadge, ListRow, ProgressBar, Row, SectionHeader, type IconName } from '../../components/ui';
import { AnimatedNumber, FadeIn, ProgressRing } from '../../components/animated';
import { BarList } from '../../components/charts';
import { HomeHeader } from './widgets';

export function AdminHome() {
  const { db, user } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const loading = useInitialLoad();
  const k = useMemo(() => schoolKpis(db), [db]);
  const worst = useMemo(() => absencesByClass(db).sort((a, b) => b.absences - a.absences).slice(0, 5), [db]);
  const critical = db.announcements.filter((a) => a.requiresAck);
  if (!user) return null;

  const tiles: { label: string; value: number; icon: IconName; color: string; bg: string; suffix?: string }[] = [
    { label: t('admin.students'), value: k.students, icon: 'people', color: c.primary, bg: c.primarySoft },
    { label: t('admin.teachers'), value: k.teachers, icon: 'school', color: c.academic, bg: c.academicSoft },
    { label: t('admin.classes'), value: k.classes, icon: 'grid', color: c.secondary, bg: c.secondarySoft },
    { label: t('admin.absencesToday'), value: k.absencesToday, icon: 'close-circle', color: c.errorText, bg: c.errorSoft },
    { label: t('admin.lateToday'), value: k.lateToday, icon: 'time', color: c.warningText, bg: c.warningSoft },
    { label: t('admin.paymentsPending'), value: k.paymentsPending, icon: 'card', color: c.textSecondary, bg: c.backgroundAlt },
    { label: t('admin.upcomingEvents'), value: k.upcomingEvents, icon: 'calendar', color: c.event, bg: c.eventSoft },
  ];

  return (
    <Screen back={false} inTabs refreshable>
      <FadeIn>
        <HomeHeader />
        <Txt variant="display" style={{ marginTop: space.xl }} accessibilityRole="header">
          {t('admin.hello', { name: `${user.title} ${user.lastName}` })}
        </Txt>
        <Txt variant="body" tone="secondary">
          {db.school.name}
        </Txt>
      </FadeIn>
      {loading ? (
        <RefreshSkeleton />
      ) : (
        <>
          <FadeIn index={1} style={{ marginTop: space.lg }}>
            <Card tone="success">
              <Row>
                <ProgressRing progress={k.attendanceRate / 100} size={72} stroke={8} color={c.success}>
                  <Txt variant="heading" tone="success">
                    {k.attendanceRate}%
                  </Txt>
                </ProgressRing>
                <View style={{ flex: 1 }}>
                  <Txt variant="heading">{t('admin.attendanceToday')}</Txt>
                  <Txt variant="caption" tone="secondary">
                    {k.absencesToday} {t('attendance.stats.absences').toLowerCase()} · {k.lateToday} {t('attendance.stats.late').toLowerCase()}
                  </Txt>
                </View>
              </Row>
            </Card>
          </FadeIn>

          <FadeIn index={2} style={{ marginTop: space.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              {tiles.map((tile, i) => (
                <Card key={tile.label} style={{ flexBasis: '47%', flexGrow: 1, padding: space.md, gap: space.sm }} accessibilityLabel={`${tile.label}: ${tile.value}`}>
                  <IconBadge icon={tile.icon} color={tile.color} bg={tile.bg} size={34} />
                  <AnimatedNumber value={tile.value} color={tile.color} delay={i * 60} />
                  <Txt variant="caption" tone="secondary">
                    {tile.label}
                  </Txt>
                </Card>
              ))}
            </View>
          </FadeIn>

          <FadeIn index={3}>
            <SectionHeader title={t('admin.emergency')} />
            <Card tone="error" style={{ gap: space.md }}>
              <Txt variant="body">{t('admin.emergencyIntro')}</Txt>
              <Button label={t('admin.emergency')} icon="warning" onPress={() => router.push('/admin/emergency')} style={{ backgroundColor: c.error, borderColor: c.error }} />
            </Card>
          </FadeIn>

          <FadeIn index={4}>
            <SectionHeader title={t('admin.ackTracking')} />
            <Card style={{ gap: space.lg }}>
              {critical.map((a) => {
                const rate = Math.round((a.acknowledgedBy.length / Math.max(1, a.recipientCount)) * 100);
                return (
                  <View key={a.id} style={{ gap: 6 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                        {a.title}
                      </Txt>
                      <Txt variant="bodyStrong" tone="primary">
                        {rate}%
                      </Txt>
                    </Row>
                    <ProgressBar value={rate / 100} />
                    <Txt variant="caption" tone="secondary">
                      {t('announcements.ackRate', { n: rate })} ({a.acknowledgedBy.length} / {a.recipientCount})
                    </Txt>
                  </View>
                );
              })}
            </Card>
          </FadeIn>

          <FadeIn index={5}>
            <SectionHeader title={t('admin.absencesToday')} />
            <Card>
              <BarList max={Math.max(...worst.map((w) => w.absences), 1) + 2} items={worst.map((w) => ({ label: w.name, value: w.absences, color: c.error, bg: c.errorSoft }))} />
            </Card>
          </FadeIn>

          <FadeIn index={6}>
            <SectionHeader title={t('teacher.quickActions')} />
            <Card padded={false} style={{ paddingHorizontal: space.lg }}>
              <ListRow icon="qr-code-outline" title={t('admin.checkin')} subtitle={t('checkin.intro')} onPress={() => router.push('/admin/checkin')} />
              <ListRow icon="megaphone-outline" iconColor={c.event} iconBg={c.eventSoft} title={t('teacher.createAnnouncement')} onPress={() => router.push('/teacher/announcement')} />
              <ListRow icon="desktop-outline" iconColor={c.academic} iconBg={c.academicSoft} title={t('admin.webDashboard')} subtitle={t('admin.webDashboardHint')} />
            </Card>
          </FadeIn>
        </>
      )}
    </Screen>
  );
}
