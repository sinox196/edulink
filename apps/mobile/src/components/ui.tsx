import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Switch,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { Txt } from './Txt';
import { NATIVE_DRIVER } from './animated';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

const DIRECTIONAL: Partial<Record<IconName, IconName>> = {
  'chevron-forward': 'chevron-back',
  'chevron-back': 'chevron-forward',
  'arrow-forward': 'arrow-back',
  'arrow-back': 'arrow-forward',
};

/** Icon that mirrors directional glyphs in RTL. */
export function Icon({ name, size = 20, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const { isRTL } = useI18n();
  const n = isRTL && DIRECTIONAL[name] ? DIRECTIONAL[name]! : name;
  return <Ionicons name={n} size={size} color={color ?? c.text} style={style as never} />;
}

/* --------------------------------------------------------------- Pressables */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable with a subtle spring scale — the base of every tappable surface. */
export function PressableScale({ children, style, onPress, disabled, scale = 0.97, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; scale?: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(anim, { toValue: v, useNativeDriver: NATIVE_DRIVER, speed: 40, bounciness: 6 }).start();
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => to(scale)}
      onPressOut={() => to(1)}
      style={[style, { transform: [{ scale: anim }] }, disabled ? { opacity: 0.5 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* --------------------------------------------------------------------- Card */

export function Card({ children, style, onPress, padded = true, accessibilityLabel, tone }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean; accessibilityLabel?: string; tone?: 'default' | 'primary' | 'warning' | 'error' | 'success' | 'academic' | 'event' }) {
  const { c, isDark } = useTheme();
  const tones = {
    default: { bg: c.card, border: c.border },
    primary: { bg: c.primarySoft, border: c.primarySoft },
    warning: { bg: c.warningSoft, border: c.warningSoft },
    error: { bg: c.errorSoft, border: c.errorSoft },
    success: { bg: c.successSoft, border: c.successSoft },
    academic: { bg: c.academicSoft, border: c.academicSoft },
    event: { bg: c.eventSoft, border: c.eventSoft },
  }[tone ?? 'default'];
  const base: ViewStyle = {
    backgroundColor: tones.bg,
    borderRadius: radius.lg,
    padding: padded ? space.lg : 0,
    borderWidth: 1,
    borderColor: tones.border,
    shadowColor: c.shadow,
    shadowOpacity: isDark || tone ? 0 : 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: isDark || tone ? 0 : 2,
  };
  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[base, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </PressableScale>
    );
  }
  return <View style={[base, style]} accessibilityLabel={accessibilityLabel}>{children}</View>;
}

/* ------------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'success';

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, full = true, size = 'md', style, accessibilityHint }: { label: string; onPress?: () => void; variant?: ButtonVariant; icon?: IconName; loading?: boolean; disabled?: boolean; full?: boolean; size?: 'sm' | 'md'; style?: StyleProp<ViewStyle>; accessibilityHint?: string }) {
  const { c } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.primary, fg: c.mode === 'dark' ? '#0B1220' : '#FFFFFF', border: c.primary },
    secondary: { bg: c.card, fg: c.text, border: c.borderStrong },
    soft: { bg: c.primarySoft, fg: c.primary, border: c.primarySoft },
    ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
    danger: { bg: c.errorSoft, fg: c.errorText, border: c.errorSoft },
    success: { bg: c.success, fg: '#06260F', border: c.success },
  };
  const p = palette[variant];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[
        {
          minHeight: size === 'sm' ? 40 : 52,
          paddingHorizontal: size === 'sm' ? space.md : space.xl,
          borderRadius: radius.md,
          backgroundColor: p.bg,
          borderWidth: 1,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={p.fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 19} color={p.fg} /> : null}
      <Txt variant={size === 'sm' ? 'captionStrong' : 'bodyStrong'} color={p.fg} align="center">
        {label}
      </Txt>
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, label, badge, tone = 'default', size = 44 }: { icon: IconName; onPress?: () => void; label: string; badge?: number; tone?: 'default' | 'onPrimary' | 'soft'; size?: number }) {
  const { c } = useTheme();
  const bg = tone === 'onPrimary' ? 'rgba(255,255,255,0.16)' : tone === 'soft' ? c.primarySoft : c.card;
  const fg = tone === 'onPrimary' ? '#FFFFFF' : tone === 'soft' ? c.primary : c.text;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={badge ? `${label} (${badge})` : label} style={{ width: size, height: size, borderRadius: size / 2.6, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: tone === 'default' ? 1 : 0, borderColor: c.border }}>
      <Icon name={icon} size={21} color={fg} />
      {badge ? (
        <View style={{ position: 'absolute', top: 6, end: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: tone === 'onPrimary' ? c.primary : c.card }}>
          <Txt variant="label" color="#FFFFFF" style={{ fontSize: 10, lineHeight: 12 }} align="center">
            {badge > 9 ? '9+' : badge}
          </Txt>
        </View>
      ) : null}
    </PressableScale>
  );
}

/* --------------------------------------------------------------- Chips etc. */

export function Chip({ label, selected, onPress, icon, count, color }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; count?: number; color?: string }) {
  const { c } = useTheme();
  const fg = selected ? (c.mode === 'dark' ? '#0B1220' : '#FFFFFF') : c.text;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 38, borderRadius: radius.pill, backgroundColor: selected ? color ?? c.primary : c.card, borderWidth: 1, borderColor: selected ? color ?? c.primary : c.border }}
    >
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Txt variant="captionStrong" color={fg}>
        {label}
      </Txt>
      {count !== undefined ? (
        <View style={{ backgroundColor: selected ? 'rgba(255,255,255,0.25)' : c.backgroundAlt, borderRadius: 10, paddingHorizontal: 6, minWidth: 20, alignItems: 'center' }}>
          <Txt variant="label" color={fg} style={{ fontSize: 11 }}>
            {count}
          </Txt>
        </View>
      ) : null}
    </PressableScale>
  );
}

export type PillTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'academic' | 'event';

/** Status always pairs an icon with a text label — never colour alone. */
export function Pill({ label, tone = 'neutral', icon, emoji, small }: { label: string; tone?: PillTone; icon?: IconName; emoji?: string; small?: boolean }) {
  const { c } = useTheme();
  const map: Record<PillTone, [string, string]> = {
    success: [c.successSoft, c.successText],
    warning: [c.warningSoft, c.warningText],
    error: [c.errorSoft, c.errorText],
    info: [c.primarySoft, c.primary],
    neutral: [c.backgroundAlt, c.textSecondary],
    academic: [c.academicSoft, c.academic],
    event: [c.eventSoft, c.event],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: small ? 8 : 10, paddingVertical: small ? 3 : 5, borderRadius: radius.pill }}>
      {emoji ? <Txt variant="caption">{emoji}</Txt> : icon ? <Icon name={icon} size={small ? 12 : 14} color={fg} /> : null}
      <Txt variant={small ? 'label' : 'captionStrong'} color={fg} style={small ? { textTransform: 'none', letterSpacing: 0.2, fontSize: 11.5 } : undefined}>
        {label}
      </Txt>
    </View>
  );
}

export function Avatar({ name, color, size = 44, emoji }: { name: string; color: string; size?: number; emoji?: string }) {
  const initials = name
    .replace(/^(M\.|Mme)\s+/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: size, height: size, borderRadius: size / 2.4, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Txt variant={size > 50 ? 'title' : 'bodyStrong'} color="#FFFFFF" align="center" style={{ fontSize: size * 0.38, lineHeight: size * 0.46 }}>
        {emoji ?? initials}
      </Txt>
    </View>
  );
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxl, marginBottom: space.md }, style]}>
      <Txt variant="heading" accessibilityRole="header" style={{ flexShrink: 1 }}>
        {title}
      </Txt>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 }}>
          <Txt variant="captionStrong" tone="primary">
            {action}
          </Txt>
          <Icon name="chevron-forward" size={15} color={c.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function IconBadge({ icon, color, bg, size = 42, emoji }: { icon?: IconName; color: string; bg: string; size?: number; emoji?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2.8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {emoji ? <Txt style={{ fontSize: size * 0.48, lineHeight: size * 0.62 }} align="center">{emoji}</Txt> : icon ? <Icon name={icon} size={size * 0.5} color={color} /> : null}
    </View>
  );
}

export function ListRow({ icon, iconColor, iconBg, title, subtitle, right, onPress, chevron = true, accessibilityLabel, emoji, danger }: { icon?: IconName; iconColor?: string; iconBg?: string; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; chevron?: boolean; accessibilityLabel?: string; emoji?: string; danger?: boolean }) {
  const { c } = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: space.sm }}>
      {icon || emoji ? <IconBadge icon={icon} emoji={emoji} color={iconColor ?? c.primary} bg={iconBg ?? c.primarySoft} size={40} /> : null}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" tone={danger ? 'error' : 'default'} numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
      {onPress && chevron ? <Icon name="chevron-forward" size={18} color={c.textTertiary} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginStart: inset }} />;
}

export function EmptyState({ icon = 'sparkles-outline', title, body }: { icon?: IconName; title: string; body?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxxl, gap: space.sm }}>
      <IconBadge icon={icon} color={c.primary} bg={c.primarySoft} size={56} />
      <Txt variant="bodyStrong" align="center">
        {title}
      </Txt>
      {body ? (
        <Txt variant="caption" tone="secondary" align="center">
          {body}
        </Txt>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c.backgroundAlt, borderRadius: radius.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{ flex: 1, minHeight: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.card : 'transparent', flexDirection: 'row', gap: 6, shadowColor: c.shadow, shadowOpacity: selected ? 0.08 : 0, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: selected ? 1 : 0 }}
          >
            <Txt variant="captionStrong" tone={selected ? 'default' : 'secondary'} align="center">
              {o.label}
            </Txt>
            {o.count !== undefined ? (
              <View style={{ backgroundColor: selected ? c.primarySoft : c.card, borderRadius: 8, paddingHorizontal: 6 }}>
                <Txt variant="label" tone={selected ? 'primary' : 'secondary'} style={{ fontSize: 11 }}>
                  {o.count}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({ label, description, value, onChange, disabled, icon }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; icon?: IconName }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: space.sm }}>
      {icon ? <IconBadge icon={icon} color={c.primary} bg={c.primarySoft} size={38} /> : null}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{label}</Txt>
        {description ? (
          <Txt variant="caption" tone="secondary">
            {description}
          </Txt>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: c.primary, false: c.borderStrong }}
        thumbColor="#FFFFFF"
        {...({ activeThumbColor: '#FFFFFF' } as object)}
      />
    </View>
  );
}

export function TextField({ label, error, icon, right, style, ...props }: TextInputProps & { label: string; error?: string; icon?: IconName; right?: React.ReactNode }) {
  const { c, textScale } = useTheme();
  const { isRTL } = useI18n();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="captionStrong" tone="secondary">
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: props.multiline ? 'flex-start' : 'center', gap: space.sm, minHeight: props.multiline ? 104 : 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: error ? c.error : focused ? c.primary : c.border, backgroundColor: c.card, paddingHorizontal: space.md, paddingVertical: props.multiline ? space.md : 0 }}>
        {icon ? <Icon name={icon} size={19} color={focused ? c.primary : c.textTertiary} /> : null}
        <TextInput
          {...props}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={c.textTertiary}
          style={[{ flex: 1, color: c.text, fontSize: 15 * textScale, fontFamily: isRTL ? undefined : 'PlusJakartaSans_500Medium', textAlign: isRTL ? 'right' : 'left', minHeight: props.multiline ? 80 : 48, textAlignVertical: props.multiline ? 'top' : 'center', outlineStyle: 'none' } as never, style]}
        />
        {right}
      </View>
      {error ? (
        <Txt variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

export function Row({ children, gap = space.md, style, wrap, ...rest }: Omit<ViewProps, 'style'> & { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return (
    <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>
      {children}
    </View>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={{ height, borderRadius: height, backgroundColor: c.backgroundAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, borderRadius: height, backgroundColor: color ?? c.primary }} />
    </View>
  );
}
