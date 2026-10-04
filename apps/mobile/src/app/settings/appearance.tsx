import React from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../../store/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { LANGUAGES, useI18n } from '../../i18n/I18nProvider';
import { radius, space, type TextScale } from '../../theme/tokens';
import type { ThemeMode } from '../../theme/ThemeProvider';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Card, Icon, Row, SectionHeader, Segmented, type IconName } from '../../components/ui';

export default function Appearance() {
  const { prefs, setPrefs } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const themes: { key: ThemeMode; icon: IconName }[] = [
    { key: 'system', icon: 'phone-portrait-outline' },
    { key: 'light', icon: 'sunny-outline' },
    { key: 'dark', icon: 'moon-outline' },
  ];
  return (
    <Screen title={t('profile.appearance')}>
      <SectionHeader title={t('profile.language')} style={{ marginTop: 0 }} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }} accessibilityLabel={t('profile.language')}>
        {LANGUAGES.map((l, i) => {
          const selected = prefs.locale === l.code;
          return (
            <Pressable key={l.code} onPress={() => setPrefs({ locale: l.code })} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, gap: space.md }}>
              <Txt style={{ fontSize: 22 }}>{l.code === 'fr' ? '🇫🇷' : l.code === 'ar' ? '🇹🇳' : '🇬🇧'}</Txt>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {l.native}
              </Txt>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? c.primary : c.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                {selected ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: c.primary }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
      <Txt variant="caption" tone="secondary" style={{ marginTop: space.sm }}>
        {t('settings.languageHint')}
      </Txt>

      <SectionHeader title={t('settings.theme')} />
      <Row gap={space.md}>
        {themes.map((th) => {
          const selected = prefs.themeMode === th.key;
          return (
            <Pressable key={th.key} onPress={() => setPrefs({ themeMode: th.key })} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={t(`settings.theme.${th.key}`)} style={{ flex: 1, borderRadius: radius.lg, borderWidth: 2, borderColor: selected ? c.primary : c.border, backgroundColor: c.card, padding: space.md, alignItems: 'center', gap: space.sm }}>
              <View style={{ width: '100%', height: 64, borderRadius: radius.sm, backgroundColor: th.key === 'dark' ? '#0B1220' : th.key === 'light' ? '#F6F8FC' : c.backgroundAlt, borderWidth: 1, borderColor: c.border, padding: 8, gap: 5 }}>
                <View style={{ height: 8, width: '70%', borderRadius: 4, backgroundColor: th.key === 'dark' ? '#5B8DEF' : '#2563EB' }} />
                <View style={{ height: 6, width: '90%', borderRadius: 3, backgroundColor: th.key === 'dark' ? '#22304A' : '#E6EAF2' }} />
                <View style={{ height: 6, width: '55%', borderRadius: 3, backgroundColor: th.key === 'dark' ? '#22304A' : '#E6EAF2' }} />
              </View>
              <Row gap={6}>
                <Icon name={th.icon} size={16} color={selected ? c.primary : c.textSecondary} />
                <Txt variant="captionStrong" tone={selected ? 'primary' : 'secondary'}>
                  {t(`settings.theme.${th.key}`)}
                </Txt>
              </Row>
            </Pressable>
          );
        })}
      </Row>

      <SectionHeader title={t('settings.textSize')} />
      <Segmented<string>
        value={String(prefs.textScale)}
        onChange={(v) => setPrefs({ textScale: Number(v) as TextScale })}
        options={[
          { value: '1', label: t('settings.textSize.normal') },
          { value: '1.15', label: t('settings.textSize.large') },
          { value: '1.3', label: t('settings.textSize.xlarge') },
        ]}
      />
      <Card style={{ marginTop: space.md }}>
        <Txt variant="body">✅ {t('settings.preview')}</Txt>
      </Card>
    </Screen>
  );
}
