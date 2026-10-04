import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore, type Toast } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { NOTIFICATION_META, toneColors } from '../lib/meta';
import { Txt } from './Txt';
import { Icon, IconBadge, type IconName } from './ui';
import { NATIVE_DRIVER } from './animated';
import { LogoMark } from './brand';

/** In-app rendering of push notifications. Urgent alerts stand out visually. */
export function ToastHost() {
  const { toasts } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', gap: 8, paddingHorizontal: space.md, zIndex: 1000 }}>
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </View>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const { c } = useTheme();
  const { dismissToast } = useStore();
  const anim = useRef(new Animated.Value(0)).current;
  const urgent = toast.category === 'urgent';

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(`${toast.title}. ${toast.body}`);
    Animated.spring(anim, { toValue: 1, useNativeDriver: NATIVE_DRIVER, bounciness: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: NATIVE_DRIVER }).start(() => dismissToast(toast.id));
    }, urgent ? 7000 : 4800);
    return () => clearTimeout(timer);
  }, [anim, toast, dismissToast, urgent]);

  let icon: IconName = 'checkmark-circle';
  let fg = c.successText;
  let bg = c.successSoft;
  if (toast.category in NOTIFICATION_META) {
    const meta = NOTIFICATION_META[toast.category as keyof typeof NOTIFICATION_META];
    icon = meta.icon;
    [fg, bg] = toneColors(c, meta.tone);
  } else if (toast.category === 'info') {
    icon = 'information-circle';
    fg = c.primary;
    bg = c.primarySoft;
  }

  return (
    <Animated.View style={{ width: '100%', maxWidth: 520, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }] }}>
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={`${toast.title}. ${toast.body}`}
        onPress={() => {
          dismissToast(toast.id);
          if (toast.link) router.push(toast.link as never);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          padding: space.md,
          borderRadius: radius.lg,
          backgroundColor: urgent ? c.error : c.cardElevated,
          borderWidth: 1,
          borderColor: urgent ? c.error : c.border,
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        {urgent ? <IconBadge icon="warning" color="#FFFFFF" bg="rgba(255,255,255,0.2)" size={40} /> : toast.category === 'success' ? <IconBadge icon={icon} color={fg} bg={bg} size={40} /> : (
          <View>
            <LogoMark size={40} />
            <View style={{ position: 'absolute', bottom: -4, end: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.cardElevated }}>
              <Icon name={icon} size={12} color={fg} />
            </View>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Txt variant="captionStrong" color={urgent ? '#FFFFFF' : c.textSecondary}>
            {toast.title}
          </Txt>
          <Txt variant="bodyStrong" color={urgent ? '#FFFFFF' : c.text} numberOfLines={3}>
            {toast.body}
          </Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}
