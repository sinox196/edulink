import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, typography, type TextVariant } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';

export type TextTone = 'default' | 'secondary' | 'tertiary' | 'primary' | 'success' | 'warning' | 'error' | 'academic' | 'event' | 'inverse' | 'onPrimary';

export interface TxtProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: keyof typeof fonts;
}

/** Brand typography (Plus Jakarta Sans), scaled by the user's text-size preference. */
export function Txt({ variant = 'body', tone = 'default', color, align, weight, style, children, ...rest }: TxtProps) {
  const { c, textScale } = useTheme();
  const { isRTL } = useI18n();
  const t = typography[variant];
  const toneColor: Record<TextTone, string> = {
    default: c.text,
    secondary: c.textSecondary,
    tertiary: c.textTertiary,
    primary: c.primary,
    success: c.successText,
    warning: c.warningText,
    error: c.errorText,
    academic: c.academic,
    event: c.event,
    inverse: c.card,
    onPrimary: '#FFFFFF',
  };
  const w = weight ?? t.weight;
  // Plus Jakarta Sans has no Arabic glyphs: Arabic uses the platform font with an equivalent weight.
  const fontStyle: TextStyle = isRTL
    ? { fontWeight: ({ regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' } as const)[w] }
    : { fontFamily: fonts[w] };
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontSize: t.size * textScale,
          lineHeight: t.line * textScale * (isRTL ? 1.12 : 1),
          letterSpacing: isRTL ? 0 : t.tracking,
          color: color ?? toneColor[tone],
          textAlign: align ?? (isRTL ? 'right' : 'left'),
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        fontStyle,
        variant === 'label' && !isRTL ? { textTransform: 'uppercase' } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
