import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { formatStamp, getStudent, type NotificationCategory } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { NOTIFICATION_META, toneColors } from '../lib/meta';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, Chip, EmptyState, IconBadge, IconButton, PressableScale, Row } from '../components/ui';
import { FadeIn } from '../components/animated';

const CATS: ('all' | NotificationCategory)[] = ['all', 'urgent', 'grades', 'attendance', 'events', 'homework', 'messages', 'payments', 'transport'];

export default function Notifications() {
  const { db, user, markNotificationRead, markAllNotificationsRead } = useStore();
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const [cat, setCat] = useState<'all' | NotificationCategory>('all');
  if (!user) return null;
  const mine = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = mine.filter((n) => cat === 'all' || n.category === cat);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <Screen title={t('notifications.title')} right={<IconButton icon="options-outline" label={t('notifications.settings')} onPress={() => router.push('/settings/notifications')} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: space.md }}>
        {CATS.map((k) => (
          <Chip key={k} label={k === 'all' ? t('common.all') : `${NOTIFICATION_META[k].emoji} ${t(NOTIFICATION_META[k].key)}`} selected={cat === k} onPress={() => setCat(k)} count={k === 'all' ? unread || undefined : mine.filter((n) => n.category === k && !n.read).length || undefined} />
        ))}
      </ScrollView>
      {unread ? <Button label={t('notifications.markAll')} variant="ghost" icon="checkmark-done" size="sm" full={false} onPress={markAllNotificationsRead} /> : null}
      {!list.length ? (
        <EmptyState icon="notifications-off-outline" title={t('notifications.empty')} />
      ) : (
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {list.map((n, i) => {
            const meta = NOTIFICATION_META[n.category];
            const [fg, bg] = toneColors(c, meta.tone);
            const urgent = n.category === 'urgent';
            const child = n.studentId ? getStudent(db, n.studentId) : undefined;
            return (
              <FadeIn key={n.id} index={i}>
                <PressableScale
                  onPress={() => {
                    markNotificationRead(n.id);
                    if (n.link) router.push(n.link as never);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.read ? '' : 'Non lu. '}${t(meta.key)}. ${n.title}. ${n.body}`}
                  scale={0.99}
                >
                  <Card style={[{ paddingVertical: space.md }, urgent && !n.read ? { borderColor: c.error, borderWidth: 1.5, backgroundColor: c.errorSoft } : !n.read ? { borderColor: c.primary } : null]}>
                    <Row style={{ alignItems: 'flex-start' }}>
                      <IconBadge icon={meta.icon} color={fg} bg={bg} size={40} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Row style={{ justifyContent: 'space-between' }}>
                          <Txt variant="captionStrong" color={fg}>
                            {meta.emoji} {t(meta.key)}
                            {child ? ` · ${child.firstName}` : ''}
                          </Txt>
                          <Txt variant="caption" tone="tertiary">
                            {formatStamp(n.createdAt, locale)}
                          </Txt>
                        </Row>
                        <Txt variant="bodyStrong" weight={n.read ? 'semibold' : 'bold'}>
                          {n.body}
                        </Txt>
                      </View>
                      {!n.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: urgent ? c.error : c.primary, marginTop: 6 }} accessibilityElementsHidden /> : null}
                    </Row>
                  </Card>
                </PressableScale>
              </FadeIn>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
