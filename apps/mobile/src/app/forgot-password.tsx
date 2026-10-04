import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Button, Card, TextField } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { IconBadge } from '../components/ui';

export default function ForgotPassword() {
  const { t } = useI18n();
  const { c } = useTheme();
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Screen title={t('auth.forgot.title')}>
      <Txt variant="body" tone="secondary" style={{ marginBottom: space.xl }}>
        {t('auth.forgot.body')}
      </Txt>
      {sent ? (
        <Card tone="success" style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <IconBadge icon="mail-open" color={c.successText} bg={c.card} />
          <Txt variant="bodyStrong" style={{ flex: 1 }} accessibilityLiveRegion="polite">
            {t('auth.forgot.sent')}
          </Txt>
        </Card>
      ) : (
        <>
          <TextField label={`${t('auth.email')} / ${t('auth.phone')}`} icon="at" value={value} onChangeText={setValue} autoCapitalize="none" keyboardType="email-address" />
          <Button
            label={t('auth.forgot.submit')}
            style={{ marginTop: space.xl }}
            loading={loading}
            disabled={value.trim().length < 5}
            onPress={() => {
              setLoading(true);
              // Same response whether or not the account exists (no account enumeration).
              setTimeout(() => {
                setLoading(false);
                setSent(true);
              }, 700);
            }}
          />
        </>
      )}
    </Screen>
  );
}
