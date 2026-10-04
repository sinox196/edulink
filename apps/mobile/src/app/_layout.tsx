import React, { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppStoreProvider, useStore } from '../store/AppStore';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { I18nProvider, useI18n } from '../i18n/I18nProvider';
import { ToastHost } from '../components/ToastHost';
import { UnlockOverlay } from '../components/UnlockOverlay';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <Providers />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

function Providers() {
  const { prefs } = useStore();
  return (
    <ThemeProvider mode={prefs.themeMode} textScale={prefs.textScale}>
      <I18nProvider locale={prefs.locale}>
        <Shell />
      </I18nProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const { c, isDark } = useTheme();
  const { isRTL } = useI18n();
  const { session, prefs, locked, setLocked } = useStore();
  const backgroundAt = useRef<number | null>(null);

  /* Auto-lock: after N minutes in background, biometric unlock is required. */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') backgroundAt.current = Date.now();
      if (state === 'active' && backgroundAt.current) {
        const away = Date.now() - backgroundAt.current;
        backgroundAt.current = null;
        if (session && prefs.biometricEnabled && away > prefs.autoLockMinutes * 60_000) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [session, prefs.biometricEnabled, prefs.autoLockMinutes, setLocked]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background, direction: isRTL ? 'rtl' : 'ltr' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="attendance/justify" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <ToastHost />
      {session && locked ? <UnlockOverlay /> : null}
    </View>
  );
}
