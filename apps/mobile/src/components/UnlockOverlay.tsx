import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { Txt } from './Txt';
import { Button, IconBadge } from './ui';
import { LogoMark } from './brand';

/** Shown over the app when the session is locked (Face ID / fingerprint required). */
export function UnlockOverlay() {
  const { c } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { setLocked, logout } = useStore();
  const [busy, setBusy] = useState(false);

  const unlock = useCallback(async () => {
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        // No biometric API on web: the demo unlocks directly.
        setLocked(false);
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: t('auth.unlock.title'), cancelLabel: t('common.cancel') });
      if (res.success) setLocked(false);
    } finally {
      setBusy(false);
    }
  }, [setLocked, t]);

  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', padding: space.xxl, paddingTop: insets.top, zIndex: 2000 }}>
      <LogoMark size={64} />
      <View style={{ height: space.xxl }} />
      <IconBadge icon="finger-print" color={c.primary} bg={c.primarySoft} size={72} />
      <Txt variant="title" align="center" style={{ marginTop: space.xl }}>
        {t('auth.unlock.title')}
      </Txt>
      <Txt variant="body" tone="secondary" align="center" style={{ marginTop: space.sm, maxWidth: 320 }}>
        {t('auth.unlock.body')}
      </Txt>
      <View style={{ width: '100%', maxWidth: 360, gap: space.md, marginTop: space.xxxl }}>
        <Button label={t('auth.unlock.cta')} icon="lock-open" onPress={unlock} loading={busy} />
        <Button
          label={t('auth.unlock.password')}
          variant="ghost"
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        />
      </View>
    </View>
  );
}
