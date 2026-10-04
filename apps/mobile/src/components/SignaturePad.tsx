import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import { useI18n } from '../i18n/I18nProvider';
import { Txt } from './Txt';
import { Button } from './ui';

/** Finger / mouse signature capture. The SVG path is what would be stored server-side. */
export function SignaturePad({ onChange }: { onChange: (svgPath: string | null) => void }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef('');
  const [, force] = useState(0);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          current.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          force((n) => n + 1);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          current.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          force((n) => n + 1);
        },
        onPanResponderRelease: () => {
          const done = current.current;
          current.current = '';
          setPaths((prev) => {
            const next = [...prev, done];
            onChange(next.join(' '));
            return next;
          });
        },
      }),
    [onChange],
  );

  return (
    <View style={{ gap: 8 }}>
      <Txt variant="captionStrong" tone="secondary">
        {t('signature.hint')}
      </Txt>
      <View
        {...responder.panHandlers}
        accessible
        accessibilityLabel={t('signature.hint')}
        style={{ height: 170, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.borderStrong, backgroundColor: c.card, overflow: 'hidden' }}
      >
        <Svg width="100%" height="100%" pointerEvents="none">
          {[...paths, current.current].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke={c.text} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        <View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, bottom: 34, height: 1, backgroundColor: c.border }} />
      </View>
      <Button
        label={t('signature.clear')}
        variant="ghost"
        icon="refresh"
        size="sm"
        full={false}
        onPress={() => {
          setPaths([]);
          onChange(null);
        }}
      />
    </View>
  );
}
