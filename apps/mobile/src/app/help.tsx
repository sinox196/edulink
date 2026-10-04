import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Card, Divider, Icon, ListRow, SectionHeader } from '../components/ui';
import type { TranslationKey } from '../i18n/fr';

export default function Help() {
  const { db, user, startConversation } = useStore();
  const { c } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen title={t('help.title')}>
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        {[1, 2, 3, 4].map((i, idx) => {
          const expanded = open === i;
          return (
            <View key={i}>
              {idx ? <Divider /> : null}
              <Pressable onPress={() => setOpen(expanded ? null : i)} accessibilityRole="button" accessibilityState={{ expanded }} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: space.md }}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {t(`help.faq.${i}.q` as TranslationKey)}
                </Txt>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
              </Pressable>
              {expanded ? (
                <Txt variant="body" tone="secondary" style={{ paddingBottom: space.md }}>
                  {t(`help.faq.${i}.a` as TranslationKey)}
                </Txt>
              ) : null}
            </View>
          );
        })}
      </Card>
      <SectionHeader title={t('help.contactSchool')} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow icon="call-outline" title={t('help.call')} subtitle={db.school.phone} onPress={() => Linking.openURL(`tel:${db.school.phone.replace(/\s/g, '')}`)} />
        <ListRow icon="mail-outline" title={t('help.email')} subtitle={db.school.email} onPress={() => Linking.openURL(`mailto:${db.school.email}`)} />
        {user?.role === 'parent' ? (
          <ListRow
            icon="chatbubble-ellipses-outline"
            title={t('help.message')}
            subtitle={t('messages.cat.administration')}
            onPress={() => {
              const id = startConversation('u-staff-vs');
              router.push(`/chat/${id}`);
            }}
          />
        ) : null}
        <ListRow icon="location-outline" title={db.school.address} chevron={false} />
      </Card>
    </Screen>
  );
}
