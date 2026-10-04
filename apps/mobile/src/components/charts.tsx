import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useAnimatedNumber } from './animated';
import { Txt } from './Txt';
import { Row } from './ui';

export interface Series {
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

/** Smooth multi-series line chart with an animated reveal. */
export function LineChart({ labels, series, min, max, height = 180, valueSuffix = '' }: { labels: string[]; series: Series[]; min: number; max: number; height?: number; valueSuffix?: string }) {
  const { c } = useTheme();
  const { isRTL } = useI18n();
  const [width, setWidth] = useState(0);
  const progress = useAnimatedNumber(1, 1100);
  const pad = { top: 16, bottom: 26, left: 30, right: 14 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = height - pad.top - pad.bottom;
  const n = labels.length;
  const xAt = (i: number) => {
    const x = n === 1 ? w / 2 : (i / (n - 1)) * w;
    return pad.left + (isRTL ? w - x : x);
  };
  const yAt = (v: number) => pad.top + h - ((v - min) / (max - min)) * h;
  const ticks = [min, (min + max) / 2, max];

  const pathFor = (values: number[]) => {
    const pts = values.map((v, i) => [xAt(i), yAt(min + (v - min) * progress)] as const);
    return pts.reduce((d, [x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    }, '');
  };

  const summary = series.map((s) => `${s.label}: ${s.values.map((v, i) => `${labels[i]} ${v}${valueSuffix}`).join(', ')}`).join('. ');

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={summary}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={series[0]?.color ?? c.primary} stopOpacity={0.22} />
              <Stop offset="1" stopColor={series[0]?.color ?? c.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {ticks.map((tk) => (
            <React.Fragment key={tk}>
              <Line x1={pad.left} x2={width - pad.right} y1={yAt(tk)} y2={yAt(tk)} stroke={c.border} strokeDasharray="4 6" />
              <SvgText x={isRTL ? width - 4 : 4} y={yAt(tk) + 4} fontSize={10} fill={c.textTertiary} textAnchor={isRTL ? 'end' : 'start'}>
                {Number.isInteger(tk) ? tk : tk.toFixed(1)}
              </SvgText>
            </React.Fragment>
          ))}
          {series[0] ? <Path d={`${pathFor(series[0].values)} L ${xAt(n - 1)} ${pad.top + h} L ${xAt(0)} ${pad.top + h} Z`} fill="url(#area)" /> : null}
          {series.map((s) => (
            <Path key={s.label} d={pathFor(s.values)} stroke={s.color} strokeWidth={s.dashed ? 2 : 3} strokeDasharray={s.dashed ? '5 5' : undefined} fill="none" strokeLinecap="round" />
          ))}
          {series.map((s) =>
            s.dashed
              ? null
              : s.values.map((v, i) => <Circle key={`${s.label}-${i}`} cx={xAt(i)} cy={yAt(min + (v - min) * progress)} r={4.5} fill={c.card} stroke={s.color} strokeWidth={2.5} />),
          )}
          {labels.map((l, i) => (
            <SvgText key={l + i} x={xAt(i)} y={height - 6} fontSize={11} fill={c.textSecondary} textAnchor="middle">
              {l}
            </SvgText>
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <Row gap={16} style={{ marginTop: 4 }} wrap>
        {series.map((s) => (
          <Row key={s.label} gap={6}>
            <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: s.color, opacity: s.dashed ? 0.7 : 1 }} />
            <Txt variant="caption" tone="secondary">
              {s.label}
            </Txt>
          </Row>
        ))}
      </Row>
    </View>
  );
}

/** Horizontal bars (student value) with a marker for the class average. */
export function BarList({ items, max = 20, marker }: { items: { label: string; value: number; compare?: number; color: string; bg: string }[]; max?: number; marker?: string }) {
  const { c } = useTheme();
  const progress = useAnimatedNumber(1, 1000, 150);
  return (
    <View style={{ gap: 14 }}>
      {items.map((it) => (
        <View key={it.label} accessible accessibilityLabel={`${it.label}: ${it.value} / ${max}${it.compare !== undefined ? `, ${marker} ${it.compare}` : ''}`}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Txt variant="captionStrong" style={{ flex: 1 }} numberOfLines={1}>
              {it.label}
            </Txt>
            <Txt variant="captionStrong" color={it.color}>
              {it.value.toFixed(1).replace('.0', '')}
            </Txt>
          </Row>
          <View style={{ height: 10, borderRadius: 6, backgroundColor: c.backgroundAlt }}>
            <View style={{ width: `${(it.value / max) * 100 * progress}%`, height: 10, borderRadius: 6, backgroundColor: it.color }} />
            {it.compare !== undefined ? (
              <View style={{ position: 'absolute', start: `${(it.compare / max) * 100}%`, top: -3, width: 3, height: 16, borderRadius: 2, backgroundColor: c.text, opacity: 0.55 }} />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Vertical columns, e.g. weekly attendance. */
export function Columns({ items, max = 100, height = 120, color }: { items: { label: string; value: number }[]; max?: number; height?: number; color?: string }) {
  const { c } = useTheme();
  const progress = useAnimatedNumber(1, 900, 100);
  return (
    <Row gap={8} style={{ alignItems: 'flex-end', height: height + 24 }}>
      {items.map((it, i) => (
        <View key={it.label + i} style={{ flex: 1, alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${it.label}: ${it.value}%`}>
          <View style={{ width: '70%', maxWidth: 26, height: Math.max(4, (it.value / max) * height * progress), borderRadius: 7, backgroundColor: it.value < 90 ? c.warning : color ?? c.success }} />
          <Txt variant="label" tone="tertiary" style={{ textTransform: 'none', letterSpacing: 0 }} numberOfLines={1}>
            {it.label}
          </Txt>
        </View>
      ))}
    </Row>
  );
}
