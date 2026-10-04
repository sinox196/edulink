import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import type { TranslationKey } from '../i18n/fr';
import { Txt } from './Txt';
import { Icon, type IconName } from './ui';
import { NATIVE_DRIVER } from './animated';
import { CONTENT_MAX_WIDTH } from './Screen';

type TabKey = 'index' | 'school' | 'calendar' | 'messages' | 'profile';

/** Role-aware labels and icons for the 5 primary destinations. */
export function useTabConfig(): Record<TabKey, { label: TranslationKey; icon: IconName; activeIcon: IconName }> {
  const { user } = useStore();
  const role = user?.role ?? 'parent';
  return {
    index: { label: 'tab.home', icon: 'home-outline', activeIcon: 'home' },
    school:
      role === 'teacher'
        ? { label: 'tab.classes', icon: 'people-outline', activeIcon: 'people' }
        : role === 'admin'
          ? { label: 'tab.establishment', icon: 'business-outline', activeIcon: 'business' }
          : { label: 'tab.school', icon: 'library-outline', activeIcon: 'library' },
    calendar: { label: 'tab.calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
    messages: role === 'student' ? { label: 'tab.news', icon: 'newspaper-outline', activeIcon: 'newspaper' } : { label: 'tab.messages', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
    profile: { label: 'tab.profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
  };
}

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { db, user } = useStore();
  const config = useTabConfig();
  const unread = user ? db.messages.filter((m) => m.senderId !== user.id && !m.readAt && db.conversations.some((cv) => cv.id === m.conversationId && cv.participantIds.includes(user.id))).length : 0;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: Math.max(insets.bottom, 12), alignItems: 'center' }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          backgroundColor: c.tabBar,
          borderRadius: 26,
          padding: 6,
          borderWidth: 1,
          borderColor: c.border,
          shadowColor: c.shadow,
          shadowOpacity: c.mode === 'dark' ? 0.4 : 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}
      >
        {state.routes.map((route, index) => {
          const key = route.name as TabKey;
          const cfg = config[key];
          if (!cfg) return null;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={t(cfg.label)}
              icon={focused ? cfg.activeIcon : cfg.icon}
              badge={key === 'messages' && user?.role !== 'student' ? unread : 0}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({ focused, label, icon, badge, onPress }: { focused: boolean; label: string; icon: IconName; badge: number; onPress: () => void }) {
  const { c } = useTheme();
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: focused ? 1 : 0, useNativeDriver: NATIVE_DRIVER, bounciness: 10, speed: 16 }).start();
  }, [focused, anim]);
  const color = focused ? c.primary : c.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ position: 'absolute', top: 2, bottom: 2, left: 2, right: 2, borderRadius: radius.lg, backgroundColor: c.primarySoft, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }} />
      <Animated.View style={{ transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
        <Icon name={icon} size={22} color={color} />
        {badge ? (
          <View style={{ position: 'absolute', top: -5, end: -10, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card }}>
            <Txt variant="label" color="#FFFFFF" style={{ fontSize: 10, lineHeight: 12 }} align="center">
              {badge}
            </Txt>
          </View>
        ) : null}
      </Animated.View>
      <Txt variant="label" color={color} style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11, marginTop: 3 }} numberOfLines={1} align="center">
        {label}
      </Txt>
    </Pressable>
  );
}
