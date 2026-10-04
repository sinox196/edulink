import React from 'react';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Divider, IconBadge, ListRow, Row, SectionHeader, ToggleRow } from '../../components/ui';

export default function Privacy() {
  const { prefs, setPrefs, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const set = (k: keyof typeof prefs.privacy) => (v: boolean) => setPrefs({ privacy: { ...prefs.privacy, [k]: v } });
  const request = () => showToast({ title: t('profile.privacy'), body: t('settings.privacy.requested'), category: 'success' });
  return (
    <Screen title={t('profile.privacy')}>
      <Card tone="success">
        <Row style={{ alignItems: 'flex-start' }}>
          <IconBadge icon="shield-checkmark" color={c.successText} bg={c.card} />
          <Txt variant="body" style={{ flex: 1 }}>
            {t('settings.privacy.intro')}
          </Txt>
        </Row>
      </Card>
      <SectionHeader title={t('profile.settings')} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ToggleRow label={t('settings.privacy.photo')} value={prefs.privacy.photo} onChange={set('photo')} />
        <Divider />
        <ToggleRow label={t('settings.privacy.contact')} value={prefs.privacy.contact} onChange={set('contact')} />
        <Divider />
        <ToggleRow label={t('settings.privacy.analytics')} value={prefs.privacy.analytics} onChange={set('analytics')} />
      </Card>
      <SectionHeader title="RGPD / INPDP" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow icon="download-outline" title={t('settings.privacy.export')} onPress={request} />
        <ListRow icon="trash-outline" iconColor={c.errorText} iconBg={c.errorSoft} title={t('settings.privacy.delete')} danger onPress={request} />
      </Card>
    </Screen>
  );
}
