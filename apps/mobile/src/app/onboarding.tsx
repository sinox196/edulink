import React, { useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n, LANGUAGES } from '../i18n/I18nProvider';
import { space } from '../theme/tokens';
import { Illustration, Logo } from '../components/brand';
import { Txt } from '../components/Txt';
import { Button } from '../components/ui';
import { NATIVE_DRIVER } from '../components/animated';
import { CONTENT_MAX_WIDTH } from '../components/Screen';
import type { TranslationKey } from '../i18n/fr';

const SLIDES: { title: TranslationKey; body: TranslationKey; variant: 1 | 2 | 3 }[] = [
  { title: 'onboarding.1.title', body: 'onboarding.1.body', variant: 1 },
  { title: 'onboarding.2.title', body: 'onboarding.2.body', variant: 2 },
  { title: 'onboarding.3.title', body: 'onboarding.3.body', variant: 3 },
];

export default function Onboarding() {
  const { c } = useTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { setPrefs } = useStore();
  const [index, setIndex] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;

  const finish = () => {
    setPrefs({ onboardingDone: true });
    router.replace('/login');
  };

  const goTo = (i: number) => {
    Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: NATIVE_DRIVER }).start(() => {
      setIndex(i);
      Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: NATIVE_DRIVER }).start();
    });
  };

  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.xl }}>
      <View style={{ flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={32} />
          <Pressable onPress={finish} accessibilityRole="button" hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Txt variant="bodyStrong" tone="secondary">
              {t('common.skip')}
            </Txt>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: space.lg }} accessibilityRole="radiogroup">
          {LANGUAGES.map((l) => (
            <Pressable key={l.code} onPress={() => setPrefs({ locale: l.code })} accessibilityRole="radio" accessibilityState={{ checked: locale === l.code }} style={{ paddingHorizontal: 12, minHeight: 34, justifyContent: 'center', borderRadius: 17, backgroundColor: locale === l.code ? c.primarySoft : 'transparent', borderWidth: 1, borderColor: locale === l.code ? c.primary : c.border }}>
              <Txt variant="captionStrong" tone={locale === l.code ? 'primary' : 'secondary'}>
                {l.native}
              </Txt>
            </Pressable>
          ))}
        </View>

        <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
          <Illustration variant={slide.variant} size={280} />
          <Txt variant="display" align="center" style={{ marginTop: space.xxl }} accessibilityRole="header">
            {t(slide.title)}
          </Txt>
          <Txt variant="body" tone="secondary" align="center" style={{ marginTop: space.md, maxWidth: 340, fontSize: 16, lineHeight: 24 }}>
            {t(slide.body)}
          </Txt>
        </Animated.View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: space.xl }}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} accessibilityRole="button" accessibilityLabel={`${i + 1} / ${SLIDES.length}`} hitSlop={10}>
              <View style={{ width: i === index ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? c.primary : c.borderStrong }} />
            </Pressable>
          ))}
        </View>
        <Button label={last ? t('onboarding.cta') : t('common.next')} icon={last ? 'arrow-forward' : undefined} onPress={() => (last ? finish() : goTo(index + 1))} />
      </View>
    </View>
  );
}
