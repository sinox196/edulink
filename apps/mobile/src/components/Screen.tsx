import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { Txt } from './Txt';
import { IconButton } from './ui';
import { Skeleton } from './animated';

export const CONTENT_MAX_WIDTH = 620;
export const TAB_BAR_SPACE = 104;

interface ScreenProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  /** Pull-to-refresh: shows skeletons for a moment, as a real network refresh would. */
  refreshable?: boolean;
  inTabs?: boolean;
  header?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
}

export function Screen({ title, subtitle, back = true, right, children, scroll = true, refreshable, inTabs, header, contentStyle, footer }: ScreenProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const top = (
    <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.xl, paddingBottom: space.sm, backgroundColor: c.background }}>
      <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
        {back || right ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, marginBottom: title ? space.sm : 0 }}>
            {back ? <IconButton icon="arrow-back" label={t('common.back')} onPress={goBack} /> : <View />}
            <View style={{ flexDirection: 'row', gap: space.sm }}>{right}</View>
          </View>
        ) : null}
        {title ? (
          <Txt variant="title" accessibilityRole="header" style={{ fontSize: 26, lineHeight: 32 }}>
            {title}
          </Txt>
        ) : null}
        {subtitle ? (
          <Txt variant="body" tone="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  );

  const inner = (
    <View style={[{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.xl }, contentStyle]}>
      {refreshing ? <RefreshSkeleton /> : children}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header ?? (title || back || right ? top : <View style={{ height: insets.top }} />)}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: (inTabs ? TAB_BAR_SPACE : space.xxxl) + insets.bottom, paddingTop: space.sm }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshable ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} /> : undefined}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: insets.bottom + space.md, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border }}>
          <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

export function RefreshSkeleton() {
  return (
    <View style={{ gap: space.lg, paddingTop: space.md }}>
      <Skeleton height={120} radius={18} />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Skeleton height={90} radius={18} style={{ flex: 1 }} width={undefined} />
        <Skeleton height={90} radius={18} style={{ flex: 1 }} width={undefined} />
      </View>
      <Skeleton height={16} width="45%" />
      <Skeleton height={72} radius={18} />
      <Skeleton height={72} radius={18} />
    </View>
  );
}
