import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type LoginMethod } from '../services/auth';
import { Screen } from '../components/Screen';
import { Logo, SchoolCrest } from '../components/brand';
import { Txt } from '../components/Txt';
import { Button, Card, Icon, Row, Segmented, TextField } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { FadeIn } from '../components/animated';

export default function Login() {
  const { c } = useTheme();
  const { t } = useI18n();
  const { login, db, prefs, setPrefs } = useStore();
  const [method, setMethod] = useState<LoginMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [biometricSheet, setBiometricSheet] = useState(false);

  const submit = async () => {
    setError(undefined);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450)); // network round-trip
    const res = login(method, identifier, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error === 'required' ? t('auth.error.required') : res.error === 'locked' ? t('auth.error.locked') : t('auth.error.invalid', { left: res.attemptsLeft ?? 0 }));
      return;
    }
    if (Platform.OS !== 'web' && !prefs.biometricPrompted) {
      const [hasHardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
      if (hasHardware && enrolled) {
        setBiometricSheet(true);
        return;
      }
    }
    router.replace('/(tabs)');
  };

  const fillDemo = (email: string) => {
    setMethod('email');
    setIdentifier(email);
    setPassword(DEMO_PASSWORD);
    setError(undefined);
  };

  const placeholder = method === 'email' ? 'nom@exemple.tn' : method === 'phone' ? '+216 98 123 456' : 'HZ-P-2041';

  return (
    <Screen back={false} contentStyle={{ paddingTop: space.lg }}>
      <FadeIn>
        <Row style={{ justifyContent: 'space-between' }}>
          <Logo size={36} />
          <SchoolCrest size={36} />
        </Row>
        <Txt variant="display" style={{ marginTop: space.xxxl }} accessibilityRole="header">
          {t('auth.welcome')}
        </Txt>
        <Txt variant="body" tone="secondary" style={{ marginTop: space.xs }}>
          {t('auth.subtitle')}
        </Txt>
        <Row gap={8} style={{ marginTop: space.md }}>
          <Icon name="school" size={16} color={c.primary} />
          <Txt variant="captionStrong" tone="primary">
            {db.school.name}
          </Txt>
        </Row>
      </FadeIn>

      <FadeIn index={1} style={{ marginTop: space.xxl, gap: space.lg }}>
        <Segmented<LoginMethod>
          value={method}
          onChange={(m) => {
            setMethod(m);
            setIdentifier('');
            setError(undefined);
          }}
          options={[
            { value: 'email', label: t('auth.method.email') },
            { value: 'phone', label: t('auth.method.phone') },
            { value: 'schoolId', label: t('auth.method.schoolId') },
          ]}
        />
        <TextField
          label={method === 'email' ? t('auth.email') : method === 'phone' ? t('auth.phone') : t('auth.schoolId')}
          icon={method === 'email' ? 'mail-outline' : method === 'phone' ? 'call-outline' : 'id-card-outline'}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={placeholder}
          autoCapitalize={method === 'schoolId' ? 'characters' : 'none'}
          keyboardType={method === 'email' ? 'email-address' : method === 'phone' ? 'phone-pad' : 'default'}
          autoComplete={method === 'email' ? 'email' : method === 'phone' ? 'tel' : 'username'}
          textContentType={method === 'email' ? 'emailAddress' : method === 'phone' ? 'telephoneNumber' : 'username'}
          returnKeyType="next"
        />
        <TextField
          label={t('auth.password')}
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
          returnKeyType="go"
          error={error}
          right={
            <Pressable onPress={() => setShowPassword((v) => !v)} accessibilityRole="button" accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')} hitSlop={10} style={{ padding: 6 }}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textSecondary} />
            </Pressable>
          }
        />
        <Pressable onPress={() => router.push('/forgot-password')} accessibilityRole="link" style={{ alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' }}>
          <Txt variant="captionStrong" tone="primary">
            {t('auth.forgot')}
          </Txt>
        </Pressable>
        <Button label={t('auth.login')} onPress={submit} loading={loading} icon="log-in-outline" />
        <Button label={t('auth.activate')} variant="secondary" onPress={() => router.push('/activate')} icon="key-outline" />
      </FadeIn>

      <FadeIn index={2} style={{ marginTop: space.xxl }}>
        <Card style={{ gap: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="subheading">{t('auth.demoAccounts')}</Txt>
            <Txt variant="caption" tone="secondary">
              {t('auth.demoHint')}
            </Txt>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {DEMO_ACCOUNTS.map((a) => (
              <Pressable
                key={a.email}
                onPress={() => fillDemo(a.email)}
                accessibilityRole="button"
                accessibilityLabel={`${t(`auth.role.${a.role}`)} — ${a.label}`}
                style={{ flexGrow: 1, flexBasis: '45%', padding: space.md, borderRadius: radius.md, backgroundColor: identifier === a.email ? c.primarySoft : c.backgroundAlt, borderWidth: 1, borderColor: identifier === a.email ? c.primary : 'transparent' }}
              >
                <Txt variant="label" tone="primary">
                  {t(`auth.role.${a.role}`)}
                </Txt>
                <Txt variant="captionStrong" numberOfLines={1}>
                  {a.label}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Card>
        <Row gap={8} style={{ justifyContent: 'center', marginTop: space.lg }}>
          <Icon name="shield-checkmark" size={16} color={c.successText} />
          <Txt variant="caption" tone="secondary">
            {t('auth.secure')}
          </Txt>
        </Row>
      </FadeIn>

      <Sheet visible={biometricSheet} onClose={() => { setPrefs({ biometricPrompted: true }); setBiometricSheet(false); router.replace('/(tabs)'); }} title={t('auth.biometric.title')}>
        <Txt variant="body" tone="secondary">
          {t('auth.biometric.body')}
        </Txt>
        <Button
          label={t('auth.biometric.enable')}
          icon="finger-print"
          onPress={async () => {
            const res = await LocalAuthentication.authenticateAsync({ promptMessage: t('auth.biometric.title') });
            setPrefs({ biometricPrompted: true, biometricEnabled: res.success });
            setBiometricSheet(false);
            router.replace('/(tabs)');
          }}
        />
        <Button label={t('auth.biometric.later')} variant="ghost" onPress={() => { setPrefs({ biometricPrompted: true }); setBiometricSheet(false); router.replace('/(tabs)'); }} />
      </Sheet>
    </Screen>
  );
}
