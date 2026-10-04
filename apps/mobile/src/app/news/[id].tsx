import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDate } from '@edulink/shared';
import { useStore } from '../../store/AppStore';
import { useI18n } from '../../i18n/I18nProvider';
import { radius, space } from '../../theme/tokens';
import { Screen } from '../../components/Screen';
import { Txt } from '../../components/Txt';
import { Icon, Pill, type IconName } from '../../components/ui';

export default function NewsArticle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useStore();
  const { t, locale } = useI18n();
  const n = db.news.find((x) => x.id === id);
  if (!n) return <Screen title={t('news.title')}>{null}</Screen>;
  return (
    <Screen>
      <LinearGradient colors={[n.cover.from, n.cover.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 200, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={n.cover.icon as IconName} size={72} color="rgba(255,255,255,0.92)" />
      </LinearGradient>
      <View style={{ marginTop: space.xl, gap: space.md }}>
        <Pill label={t(`news.cat.${n.category}`)} tone="info" />
        <Txt variant="display" accessibilityRole="header">
          {n.title}
        </Txt>
        <Txt variant="caption" tone="secondary">
          {formatDate(n.publishedAt, locale, 'long')} · {t('news.read', { n: n.readMinutes })}
        </Txt>
        {n.body.split('\n\n').map((p, i) => (
          <Txt key={i} variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
            {p}
          </Txt>
        ))}
      </View>
    </Screen>
  );
}
