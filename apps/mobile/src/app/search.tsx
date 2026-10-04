import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { childrenOf, searchAll, SEARCH_GROUP_ORDER, studentForUser, type SearchGroup } from '@edulink/shared';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { radius, space } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Txt } from '../components/Txt';
import { Card, Chip, EmptyState, Icon, ListRow, Row, SectionHeader, type IconName } from '../components/ui';

const GROUP_ICON: Record<SearchGroup, IconName> = {
  pages: 'apps-outline',
  grades: 'stats-chart-outline',
  homework: 'create-outline',
  documents: 'document-text-outline',
  messages: 'chatbubbles-outline',
  events: 'calendar-outline',
  news: 'newspaper-outline',
  announcements: 'megaphone-outline',
};

const SUGGESTIONS = ['mathématiques', 'bulletin', 'transport', 'Sarah', 'sortie scolaire'];

export default function Search() {
  const { db, user, selectChild } = useStore();
  const { c } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const [q, setQ] = useState('');

  const kids = useMemo(() => (user?.role === 'parent' ? childrenOf(db, user.id) : user?.role === 'student' ? [studentForUser(db, user.id)!] : []), [db, user]);
  const results = useMemo(() => (user ? searchAll(db, user, kids.map((k) => k.id), q, locale) : []), [db, user, kids, q, locale]);
  const grouped = SEARCH_GROUP_ORDER.map((g) => ({ g, items: results.filter((r) => r.group === g) })).filter((x) => x.items.length);

  return (
    <Screen title={t('search.title')}>
      <Row style={{ backgroundColor: c.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.primary, paddingHorizontal: space.md, minHeight: 52 }}>
        <Icon name="search" size={20} color={c.primary} />
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder={t('search.placeholder')}
          placeholderTextColor={c.textTertiary}
          accessibilityLabel={t('search.title')}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 16, color: c.text, minHeight: 48, textAlign: isRTL ? 'right' : 'left', fontFamily: isRTL ? undefined : 'PlusJakartaSans_500Medium', outlineStyle: 'none' } as never}
        />
        {q ? <Icon name="close-circle" size={20} color={c.textTertiary} /> : null}
      </Row>

      {q.trim().length < 2 ? (
        <>
          <SectionHeader title={t('search.suggestions')} />
          <Row gap={8} wrap>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} icon="search" onPress={() => setQ(s)} />
            ))}
          </Row>
        </>
      ) : grouped.length ? (
        grouped.map(({ g, items }) => (
          <View key={g}>
            <SectionHeader title={`${t(`search.group.${g}`)} (${items.length})`} />
            <Card padded={false} style={{ paddingHorizontal: space.lg }}>
              {items.slice(0, 6).map((r) => (
                <ListRow
                  key={r.id}
                  icon={GROUP_ICON[g]}
                  title={r.title}
                  subtitle={r.subtitle || undefined}
                  onPress={() => {
                    if (r.link.startsWith('/child/')) {
                      selectChild(r.link.replace('/child/', ''));
                      router.push('/(tabs)');
                    } else router.push(r.link as never);
                  }}
                />
              ))}
            </Card>
          </View>
        ))
      ) : (
        <EmptyState icon="search-outline" title={t('search.noResult', { q })} />
      )}
    </Screen>
  );
}
