import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { DEMO_TODAY, monthMatrix, monthName, weekdayName, type ISODate } from '@edulink/shared';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { Txt } from './Txt';
import { IconButton } from './ui';
import { NATIVE_DRIVER } from './animated';

export interface DayDecoration {
  /** Small coloured dots (the meaning is always also given in the accessibility label & legend). */
  dots?: string[];
  /** Emoji status indicator (attendance). */
  emoji?: string;
  bg?: string;
  muted?: boolean;
  a11y?: string;
}

export function MonthCalendar({ year, month, onChangeMonth, selected, onSelect, decorate }: { year: number; month: number; onChangeMonth: (y: number, m: number) => void; selected?: ISODate; onSelect?: (d: ISODate) => void; decorate: (d: ISODate) => DayDecoration }) {
  const { c } = useTheme();
  const { locale, t } = useI18n();
  const rows = monthMatrix(year, month);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0.3);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: NATIVE_DRIVER }).start();
  }, [year, month, fade]);

  const shift = (delta: number) => {
    const m = month + delta;
    onChangeMonth(year + Math.floor(m / 12), ((m % 12) + 12) % 12);
  };
  const title = `${monthName(month, locale)} ${year}`;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
        <IconButton icon="chevron-back" label={t('common.back')} onPress={() => shift(-1)} size={40} />
        <Txt variant="heading" accessibilityRole="header" style={{ textTransform: 'capitalize' }}>
          {title}
        </Txt>
        <IconButton icon="chevron-forward" label={t('common.next')} onPress={() => shift(1)} size={40} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <Txt key={d} variant="label" tone="tertiary" align="center" style={{ flex: 1, textTransform: 'none' }}>
            {weekdayName(d, locale, true)}
          </Txt>
        ))}
      </View>
      <Animated.View style={{ opacity: fade, gap: 4 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 4 }}>
            {row.map((d, ci) => {
              if (!d) return <View key={ci} style={{ flex: 1, aspectRatio: 1 }} />;
              const deco = decorate(d);
              const isSel = d === selected;
              const isToday = d === DEMO_TODAY;
              return (
                <Pressable
                  key={d}
                  onPress={() => onSelect?.(d)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                  accessibilityLabel={`${Number(d.slice(8))} ${monthName(month, locale)}${deco.a11y ? `, ${deco.a11y}` : ''}`}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    maxHeight: 64,
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSel ? c.primary : deco.bg ?? 'transparent',
                    borderWidth: isToday && !isSel ? 1.5 : 0,
                    borderColor: c.primary,
                  }}
                >
                  <Txt variant="captionStrong" align="center" color={isSel ? (c.mode === 'dark' ? '#0B1220' : '#FFFFFF') : deco.muted ? c.textTertiary : c.text} style={{ fontSize: 13 }}>
                    {Number(d.slice(8))}
                  </Txt>
                  {deco.emoji ? (
                    <Txt style={{ fontSize: 10, lineHeight: 12 }} align="center">
                      {deco.emoji}
                    </Txt>
                  ) : deco.dots?.length ? (
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                      {deco.dots.slice(0, 3).map((col, i) => (
                        <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isSel ? '#FFFFFF' : col }} />
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
