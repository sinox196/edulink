import React from 'react';
import { View } from 'react-native';
import { formatDate } from '@edulink/shared';
import { useCurrentStudent, useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { toneColors } from '../lib/meta';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, IconBadge, Pill, ProgressBar, Row } from '../components/ui';
import { FadeIn } from '../components/animated';

export default function Announcements() {
  const { db, user, acknowledgeAnnouncement } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const student = useCurrentStudent();
  if (!user) return null;
  const list = db.announcements
    .filter((a) => user.role === 'admin' || user.role === 'teacher' || a.scope === 'school' || (student && a.classIds.includes(student.classId)))
    .sort((a, b) => {
      const p = { critical: 0, important: 1, normal: 2 };
      return p[a.priority] - p[b.priority] || b.publishedAt.localeCompare(a.publishedAt);
    });

  return (
    <Screen title={t('announcements.title')}>
      <View style={{ gap: space.md }}>
        {list.map((a, i) => {
          const tone = a.priority === 'critical' ? 'error' : a.priority === 'important' ? 'warning' : 'info';
          const [fg, bg] = toneColors(c, tone);
          const acked = a.acknowledgedBy.includes(user.id);
          const rate = Math.round((a.acknowledgedBy.length / Math.max(1, a.recipientCount)) * 100);
          return (
            <FadeIn key={a.id} index={i}>
              <Card style={a.priority === 'critical' ? { borderColor: c.error, borderWidth: 1.5 } : undefined}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <IconBadge icon={a.priority === 'normal' ? 'megaphone-outline' : 'warning'} color={fg} bg={bg} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Row gap={6} wrap>
                      {a.priority !== 'normal' ? <Pill label={a.priority === 'critical' ? `⚠️ ${t('announcements.critical')}` : t('announcements.important')} tone={tone} small /> : null}
                      <Pill label={t(`announcements.cat.${a.category}`)} tone="neutral" small />
                    </Row>
                    <Txt variant="heading">{a.title}</Txt>
                    <Txt variant="body">{a.body}</Txt>
                    <Txt variant="caption" tone="tertiary">
                      {a.authorName} · {formatDate(a.publishedAt.slice(0, 10), locale, 'dayMonth')} {a.publishedAt.slice(11, 16)}
                    </Txt>
                    {a.requiresAck && user.role === 'parent' ? (
                      acked ? (
                        <Pill label={t('home.ackDone')} tone="success" icon="checkmark-circle" />
                      ) : (
                        <Button label={t('home.ackRequired')} icon="checkmark-done" onPress={() => acknowledgeAnnouncement(a.id)} style={{ backgroundColor: c.error, borderColor: c.error }} />
                      )
                    ) : null}
                    {a.requiresAck && user.role === 'admin' ? (
                      <View style={{ gap: 4 }}>
                        <ProgressBar value={rate / 100} />
                        <Txt variant="caption" tone="secondary">
                          {t('announcements.ackRate', { n: rate })}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                </Row>
              </Card>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}
