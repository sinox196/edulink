import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Txt } from './Txt';

/** EduLink mark: two interlocking links forming an open book — school ↔ family. */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="EduLink">
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2563EB" />
          <Stop offset="1" stopColor="#14B8A6" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="48" height="48" rx="14" fill="url(#lg)" />
      <Path d="M12 15.5c4.2-1.6 8.2-1.4 12 1.2v17.6c-3.8-2.6-7.8-2.8-12-1.2V15.5z" fill="#FFFFFF" opacity={0.95} />
      <Path d="M36 15.5c-4.2-1.6-8.2-1.4-12 1.2v17.6c3.8-2.6 7.8-2.8 12-1.2V15.5z" fill="#FFFFFF" opacity={0.7} />
      <Circle cx="24" cy="12" r="3.2" fill="#FFFFFF" />
    </Svg>
  );
}

export function Logo({ size = 36, light }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      <Txt variant="title" color={light ? '#FFFFFF' : undefined} style={{ fontSize: size * 0.62, lineHeight: size * 0.8 }}>
        EduLink
      </Txt>
    </View>
  );
}

/** École Internationale Horizon crest: sunrise over the horizon. */
export function SchoolCrest({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="École Internationale Horizon">
      <Rect x="0" y="0" width="40" height="40" rx="12" fill="#0F2A5F" />
      <Circle cx="20" cy="24" r="9" fill="#F59E0B" />
      <Rect x="0" y="24" width="40" height="16" fill="#0F2A5F" />
      <Path d="M7 27h26M10 31h20M14 35h12" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M20 9v4M11 13l2.5 2.5M29 13l-2.5 2.5" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Soft educational illustration used on onboarding (no cartoon style). */
export function Illustration({ variant, size = 260 }: { variant: 1 | 2 | 3; size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s * 0.82} viewBox="0 0 260 214">
      <Defs>
        <LinearGradient id={`ill${variant}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={variant === 2 ? '#7C3AED' : '#2563EB'} stopOpacity={0.16} />
          <Stop offset="1" stopColor="#14B8A6" stopOpacity={0.16} />
        </LinearGradient>
      </Defs>
      <Circle cx="130" cy="107" r="100" fill={`url(#ill${variant})`} />
      {variant === 1 ? (
        <>
          <Rect x="70" y="40" width="120" height="140" rx="20" fill="#FFFFFF" stroke="#E6EAF2" strokeWidth="2" />
          <Rect x="88" y="62" width="84" height="12" rx="6" fill="#EAF1FE" />
          <Circle cx="98" cy="100" r="11" fill="#22C55E" />
          <Path d="M93 100l4 4 7-8" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="116" y="94" width="56" height="12" rx="6" fill="#E9F9EF" />
          <Circle cx="98" cy="132" r="11" fill="#F59E0B" />
          <Path d="M98 126v6l4 3" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Rect x="116" y="126" width="44" height="12" rx="6" fill="#FEF5E6" />
          <Rect x="150" y="150" width="62" height="40" rx="14" fill="#2563EB" />
          <Path d="M164 170h34" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : variant === 2 ? (
        <>
          <Rect x="56" y="52" width="148" height="112" rx="20" fill="#FFFFFF" stroke="#E6EAF2" strokeWidth="2" />
          <Path d="M76 140 L104 118 L128 128 L156 96 L184 84" stroke="#7C3AED" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="184" cy="84" r="7" fill="#7C3AED" />
          <Path d="M76 148 L104 136 L128 140 L156 124 L184 120" stroke="#14B8A6" strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round" />
          <Rect x="40" y="150" width="70" height="44" rx="14" fill="#7C3AED" />
          <Path d="M54 172h20M54 180h34" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <Circle cx="96" cy="164" r="6" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <Rect x="58" y="44" width="100" height="70" rx="18" fill="#2563EB" />
          <Path d="M76 70h60M76 86h40" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
          <Rect x="102" y="104" width="100" height="70" rx="18" fill="#FFFFFF" stroke="#E6EAF2" strokeWidth="2" />
          <Path d="M120 130h62M120 146h44" stroke="#14B8A6" strokeWidth="5" strokeLinecap="round" />
          <Circle cx="196" cy="56" r="20" fill="#F97316" />
          <Path d="M188 56h16M196 48v16" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
