import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useStore } from '../store/AppStore';
import { useI18n } from '../i18n/I18nProvider';
import { LogoMark } from '../components/brand';
import { Txt } from '../components/Txt';
import { NATIVE_DRIVER } from '../components/animated';

/** Animated splash screen, then routes to onboarding / login / app. */
export default function Splash() {
  const { ready, prefs, session } = useStore();
  const { t } = useI18n();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE_DRIVER, bounciness: 10, speed: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }, [scale, opacity]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      if (!prefs.onboardingDone) router.replace('/onboarding');
      else if (!session) router.replace('/login');
      else router.replace('/(tabs)');
    }, 1300);
    return () => clearTimeout(timer);
  }, [ready, prefs.onboardingDone, session]);

  return (
    <LinearGradient colors={['#1D4ED8', '#2563EB', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <View style={{ padding: 10, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.16)' }}>
          <LogoMark size={88} />
        </View>
        <Txt variant="display" color="#FFFFFF" align="center" style={{ marginTop: 22, fontSize: 38, lineHeight: 44 }}>
          EduLink
        </Txt>
        <Txt variant="body" color="rgba(255,255,255,0.85)" align="center" style={{ marginTop: 6 }}>
          {t('splash.tagline')}
        </Txt>
      </Animated.View>
    </LinearGradient>
  );
}
