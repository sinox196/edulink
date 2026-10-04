import React, { useState } from 'react';
import { View } from 'react-native';
import { formatDate, subjectName, type ReportCard } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { useStudentData } from '../lib/hooks';
import { exportPdf, reportCardHtml } from '../services/pdf';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, Divider, Icon, IconBadge, Pill, Row, SectionHeader } from '../components/ui';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { FadeIn } from '../components/animated';

export default function ReportCards() {
  const { db, user, showToast } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const data = useStudentData();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (!data) return null;
  const cards = db.reportCards.filter((r) => r.studentId === data.student.id).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const download = async (rc: ReportCard) => {
    setBusy(rc.id);
    try {
      await exportPdf(reportCardHtml(db, rc, data.student), `Bulletin-${data.student.lastName}-${rc.period}.pdf`);
      showToast({ title: t('reportCards.title'), body: t('reportCards.pdfReady'), category: 'success' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title={t('reportCards.title')} subtitle={`${data.student.firstName} ${data.student.lastName}`}>
      {user?.role === 'parent' ? <ChildSwitcher /> : null}

      <SectionHeader title={t('reportCards.year', { year: db.school.academicYear })} />
      <Card tone="primary">
        <Row>
          <IconBadge icon="hourglass-outline" color={c.primary} bg={c.card} />
          <View style={{ flex: 1 }}>
            <Row gap={8}>
              <Txt variant="heading">{t('grades.term', { n: 1 })}</Txt>
              <Pill label={t('reportCards.inProgress')} tone="info" small />
            </Row>
            <Txt variant="caption" tone="secondary">
              {t('reportCards.provisional')} : {data.average?.average.toFixed(1)} / 20 · {t('reportCards.publishOn', { date: formatDate('2026-12-11', locale, 'dayMonth') })}
            </Txt>
          </View>
        </Row>
      </Card>

      <SectionHeader title={t('reportCards.year', { year: '2025-2026' })} />
      <View style={{ gap: space.md }}>
        {cards.map((rc, i) => {
          const expanded = open === rc.id;
          return (
            <FadeIn key={rc.id} index={i}>
              <Card onPress={() => setOpen(expanded ? null : rc.id)} accessibilityLabel={`${rc.period}, ${t('reportCards.average', { n: rc.average.toFixed(1) })}`}>
                <Row>
                  <IconBadge icon="ribbon" color={c.academic} bg={c.academicSoft} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="heading">{rc.period}</Txt>
                    <Txt variant="caption" tone="secondary">
                      {rc.classLabel} · {formatDate(rc.publishedAt, locale, 'dayMonth')}
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="title" tone="academic">
                      {rc.average.toFixed(1)}
                    </Txt>
                    <Txt variant="caption" tone="secondary">
                      / 20
                    </Txt>
                  </View>
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
                </Row>
                {expanded ? (
                  <View style={{ marginTop: space.lg, gap: space.md }}>
                    <Row gap={8} wrap>
                      <Pill label={`${t('grades.class')} : ${rc.classAverage.toFixed(1)}`} tone="neutral" small />
                      {rc.rank ? <Pill label={t('reportCards.rank', { rank: rc.rank, size: rc.classSize ?? 0 })} tone="info" small /> : null}
                      {rc.mention ? <Pill label={rc.mention} tone="success" icon="trophy" small /> : null}
                    </Row>
                    <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: c.border }}>
                      {rc.subjects.map((s, si) => (
                        <View key={s.subjectId}>
                          {si ? <Divider /> : null}
                          <Row style={{ padding: space.md, alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                              <Txt variant="captionStrong">{subjectName(s.subjectId, locale)}</Txt>
                              <Txt variant="caption" tone="secondary">
                                {s.appreciation}
                              </Txt>
                            </View>
                            <Txt variant="bodyStrong">{s.average.toFixed(1)}</Txt>
                          </Row>
                        </View>
                      ))}
                    </View>
                    <View style={{ gap: 4 }}>
                      <Txt variant="captionStrong" tone="secondary">
                        {t('reportCards.observation')}
                      </Txt>
                      <Txt variant="body">{rc.teacherObservation}</Txt>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Txt variant="captionStrong" tone="secondary">
                        {t('reportCards.principal')}
                      </Txt>
                      <Txt variant="body">{rc.principalComment}</Txt>
                    </View>
                    <Button label={t('reportCards.download')} icon="download-outline" variant="soft" loading={busy === rc.id} onPress={() => download(rc)} />
                  </View>
                ) : null}
              </Card>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}
