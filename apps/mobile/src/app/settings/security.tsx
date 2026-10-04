import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Button, Card, Chip, Divider, IconBadge, ListRow, Pill, Row, SectionHeader, ToggleRow } from '../../components/ui';

export default function Security() {
  const { prefs, setPrefs, session, showToast } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const [available, setAvailable] = useState(false);
  const [devices, setDevices] = useState([
    { id: 'this', name: Platform.OS === 'ios' ? 'iPhone 15' : Platform.OS === 'android' ? 'Samsung Galaxy S24' : 'Navigateur web', place: 'Tunis', current: true },
    { id: 'ipad', name: 'iPad — Safari', place: 'La Marsa · il y a 2 jours', current: false },
  ]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]).then(([h, e]) => setAvailable(h && e));
  }, []);

  return (
    <Screen title={t('profile.security')}>
      <Card tone="primary">
        <Row style={{ alignItems: 'flex-start' }}>
          <IconBadge icon="key" color={c.primary} bg={c.card} />
          <Txt variant="body" style={{ flex: 1 }}>
            {t('settings.security.encrypted')}
          </Txt>
        </Row>
      </Card>
      <SectionHeader title={t('profile.security')} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ToggleRow
          icon="finger-print"
          label={t('settings.security.biometric')}
          description={available ? 'Face ID / Touch ID / empreinte' : t('settings.security.biometricUnavailable')}
          value={prefs.biometricEnabled}
          disabled={!available}
          onChange={async (v) => {
            if (v) {
              const res = await LocalAuthentication.authenticateAsync({ promptMessage: t('settings.security.biometric') });
              setPrefs({ biometricEnabled: res.success });
            } else setPrefs({ biometricEnabled: false });
          }}
        />
        <Divider />
        <ToggleRow icon="chatbox-ellipses-outline" label={t('settings.security.twoFactor')} value onChange={() => {}} disabled />
        <Divider />
        <ListRow icon="lock-closed-outline" title={t('settings.security.password')} onPress={() => showToast({ title: t('settings.security.password'), body: t('auth.forgot.sent'), category: 'success' })} />
      </Card>

      <SectionHeader title={t('settings.security.autoLock')} />
      <Row gap={8} wrap>
        {[1, 5, 15, 30].map((n) => (
          <Chip key={n} label={`${n} min`} selected={prefs.autoLockMinutes === n} onPress={() => setPrefs({ autoLockMinutes: n })} />
        ))}
      </Row>
      <Txt variant="caption" tone="secondary" style={{ marginTop: space.sm }}>
        {t('settings.security.autoLock.value', { n: prefs.autoLockMinutes })}
      </Txt>

      <SectionHeader title={t('settings.security.sessions')} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        {devices.map((d, i) => (
          <React.Fragment key={d.id}>
            {i ? <Divider /> : null}
            <ListRow
              icon={d.name.includes('iPad') ? 'tablet-portrait-outline' : 'phone-portrait-outline'}
              title={d.name}
              subtitle={d.current ? `${d.place} · ${session ? new Date(session.issuedAt).toLocaleTimeString().slice(0, 5) : ''}` : d.place}
              chevron={false}
              right={d.current ? <Pill label={t('settings.security.thisDevice')} tone="success" small /> : <Button label={t('settings.security.revoke')} variant="danger" size="sm" full={false} onPress={() => setDevices((prev) => prev.filter((x) => x.id !== d.id))} />}
            />
          </React.Fragment>
        ))}
      </Card>
    </Screen>
  );
}
