import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View, type ViewStyle, type StyleProp } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Txt, type TxtProps } from './Txt';

export const NATIVE_DRIVER = Platform.OS !== 'web';

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => (reduceMotion = v)).catch(() => {});

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Animates a number from 0 (or its previous value) to `target` — cross-platform, JS driven. */
export function useAnimatedNumber(target: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(reduceMotion ? target : 0);
  const from = useRef(reduceMotion ? target : 0);
  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const startValue = from.current;
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const v = startValue + (target - startValue) * easeOutCubic(p);
        setValue(v);
        if (p < 1) raf = requestAnimationFrame(step);
        else from.current = target;
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
}

export function AnimatedNumber({ value, decimals = 0, suffix = '', prefix = '', delay = 0, ...txt }: { value: number; decimals?: number; suffix?: string; prefix?: string; delay?: number } & TxtProps) {
  const v = useAnimatedNumber(value, 900, delay);
  const shown = decimals ? v.toFixed(decimals) : String(Math.round(v));
  return (
    <Txt variant="number" accessibilityLabel={`${prefix}${decimals ? value.toFixed(decimals) : value}${suffix}`} {...txt}>
      {prefix}
      {shown}
      {suffix}
    </Txt>
  );
}

/** Animated progress ring. */
export function ProgressRing({ progress, size = 64, stroke = 7, color, track, children, delay = 0 }: { progress: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode; delay?: number }) {
  const { c } = useTheme();
  const p = useAnimatedNumber(Math.max(0, Math.min(1, progress)), 1100, delay);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? c.border} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color ?? c.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - p)} />
      </Svg>
      {children}
    </View>
  );
}

/** Fade + slight rise on mount, staggered by `index`. */
export function FadeIn({ children, index = 0, style, from = 14 }: { children: React.ReactNode; index?: number; style?: StyleProp<ViewStyle>; from?: number }) {
  const anim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(anim, { toValue: 1, duration: 420, delay: Math.min(index, 10) * 55, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }).start();
  }, [anim, index]);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Shimmering placeholder used while content loads. */
export function Skeleton({ width = '100%', height = 14, radius = 8, style }: { width?: ViewStyle['width']; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(anim, { toValue: 0.5, duration: 650, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width, height, borderRadius: radius, backgroundColor: c.skeleton, opacity: anim }, style]} />;
}

/** Subtle pulse for notification badges. */
export function Pulse({ children, active = true }: { children: React.ReactNode; active?: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.18, duration: 520, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(anim, { toValue: 1, duration: 520, useNativeDriver: NATIVE_DRIVER }),
        Animated.delay(1800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, active]);
  return <Animated.View style={{ transform: [{ scale: anim }] }}>{children}</Animated.View>;
}
