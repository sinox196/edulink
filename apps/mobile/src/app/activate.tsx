import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { validateActivation } from '../services/auth';
import { useStore } from '../store/AppStore';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, ProgressBar, TextField } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s / 4;
}

export default function Activate() {
  const { t } = useI18n();
  const { c } = useTheme();
  const { showToast } = useStore();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const s = strength(password);

  return (
    <Screen title={t('auth.activate.title')}>
      <Txt variant="body" tone="secondary" style={{ marginBottom: space.xl }}>
        {t('auth.activate.body')}
      </Txt>
      <View style={{ gap: space.lg }}>
      <TextField label={t('auth.activate.code')} icon="keypad-outline" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="000000" maxLength={6} textContentType="oneTimeCode" />
      <TextField label={t('auth.activate.newPassword')} icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" error={error} />
      </View>
      <View style={{ height: space.md }} />
      <ProgressBar value={s} color={s < 0.5 ? c.error : s < 1 ? c.warning : c.success} />
      <Txt variant="caption" tone="secondary" style={{ marginTop: space.xs }}>
        {t('auth.activate.rules')}
      </Txt>
      <Button
        label={t('auth.activate.submit')}
        style={{ marginTop: space.xl }}
        onPress={() => {
          if (!validateActivation(code, password)) {
            setError(t('auth.activate.invalid'));
            return;
          }
          showToast({ title: t('auth.activate.title'), body: t('auth.activate.done'), category: 'success' });
          router.replace('/login');
        }}
      />
    </Screen>
  );
}
