import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDate, type NewsCategory } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Txt } from '../components/Txt';
import { Card, Chip, Icon, Row, type IconName } from '../components/ui';
import { FadeIn } from '../components/animated';

const CATS: ('all' | NewsCategory)[] = ['all', 'school', 'class', 'activities', 'sport', 'culture', 'administrative'];

export function NewsFeed() {
  const { db } = useStore();
  const { t, locale } = useI18n();
  const [cat, setCat] = useState<'all' | NewsCategory>('all');
  const items = db.news.filter((n) => cat === 'all' || n.category === cat);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: space.lg }}>
        {CATS.map((k) => (
          <Chip key={k} label={t(`news.cat.${k}`)} selected={cat === k} onPress={() => setCat(k)} />
        ))}
      </ScrollView>
      <View style={{ gap: space.lg }}>
        {items.map((n, i) => (
          <FadeIn key={n.id} index={i}>
            <Card padded={false} onPress={() => router.push(`/news/${n.id}`)} style={{ overflow: 'hidden' }} accessibilityLabel={`${n.title}. ${n.excerpt}`}>
              <LinearGradient colors={[n.cover.from, n.cover.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: i === 0 ? 150 : 110, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, justifyContent: 'space-between' }}>
                <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Txt variant="label" color="#FFFFFF">
                    {t(`news.cat.${n.category}`)}
                  </Txt>
                </View>
                <Icon name={n.cover.icon as IconName} size={i === 0 ? 56 : 40} color="rgba(255,255,255,0.9)" style={{ alignSelf: 'flex-end' }} />
              </LinearGradient>
              <View style={{ padding: space.lg, gap: 4 }}>
                <Txt variant="heading">{n.title}</Txt>
                <Txt variant="body" tone="secondary" numberOfLines={2}>
                  {n.excerpt}
                </Txt>
                <Row gap={6} style={{ marginTop: 4 }}>
                  <Txt variant="caption" tone="tertiary">
                    {formatDate(n.publishedAt, locale, 'dayMonth')} · {t('news.read', { n: n.readMinutes })}
                  </Txt>
                </Row>
              </View>
            </Card>
          </FadeIn>
        ))}
      </View>
    </View>
  );
}
