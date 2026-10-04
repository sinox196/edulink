import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { Txt } from './Txt';
import { IconButton } from './ui';
import { NATIVE_DRIVER } from './animated';
import { CONTENT_MAX_WIDTH } from './Screen';

/** Bottom sheet modal with backdrop. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const { c } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) Animated.spring(anim, { toValue: 1, useNativeDriver: NATIVE_DRIVER, bounciness: 4, speed: 14 }).start();
    else anim.setValue(0);
  }, [visible, anim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: isRTL ? 'rtl' : 'ltr' }}>
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel={t('common.close')} accessibilityRole="button" />
        <Animated.View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.background,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            maxHeight: '90%',
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH + 40,
            alignSelf: 'center',
            paddingBottom: insets.bottom + space.lg,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: c.borderStrong }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.sm }}>
            <Txt variant="title" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </Txt>
            <IconButton icon="close" label={t('common.close')} onPress={onClose} size={40} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.md, gap: space.lg }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

