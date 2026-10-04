import React from 'react';
import type { NotificationCategory } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { NOTIFICATION_META } from '../../lib/meta';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Divider, SectionHeader, ToggleRow } from '../../components/ui';

const ORDER: NotificationCategory[] = ['urgent', 'attendance', 'grades', 'homework', 'events', 'messages', 'payments', 'transport'];

export default function NotificationSettings() {
  const { prefs, setPrefs } = useStore();
  const { t } = useI18n();
  return (
    <Screen title={t('notifications.settings')}>
      <Txt variant="body" tone="secondary" style={{ marginBottom: space.lg }}>
        {t('notifications.prefsIntro')}
      </Txt>
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        {ORDER.map((k, i) => (
          <React.Fragment key={k}>
            {i ? <Divider /> : null}
            <ToggleRow
              icon={NOTIFICATION_META[k].icon}
              label={`${NOTIFICATION_META[k].emoji} ${t(NOTIFICATION_META[k].key)}`}
              value={k === 'urgent' ? true : prefs.notifications[k]}
              disabled={k === 'urgent'}
              onChange={(v) => setPrefs({ notifications: { ...prefs.notifications, [k]: v } })}
            />
          </React.Fragment>
        ))}
      </Card>
      <SectionHeader title={t('digest.title')} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ToggleRow icon="moon-outline" label={t('notifications.digest')} value={prefs.dailyDigest} onChange={(v) => setPrefs({ dailyDigest: v })} />
        <Divider />
        <ToggleRow icon="calendar-number-outline" label={t('notifications.weekly')} value={prefs.weeklySummary} onChange={(v) => setPrefs({ weeklySummary: v })} />
      </Card>
    </Screen>
  );
}
