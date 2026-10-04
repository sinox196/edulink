import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { SubjectColor } from '@edulink/shared';
import { dark, light, SUBJECT_COLORS, type Palette, type TextScale } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeValue {
  c: Palette;
  isDark: boolean;
  textScale: TextScale;
  subject: (color: SubjectColor) => { bg: string; fg: string };
}

const ThemeContext = createContext<ThemeValue>({
  c: light,
  isDark: false,
  textScale: 1,
  subject: (color) => ({ bg: SUBJECT_COLORS[color].light[0], fg: SUBJECT_COLORS[color].light[1] }),
});

export function ThemeProvider({ mode, textScale, children }: { mode: ThemeMode; textScale: TextScale; children: React.ReactNode }) {
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo<ThemeValue>(() => {
    const key = isDark ? 'dark' : 'light';
    return {
      c: isDark ? dark : light,
      isDark,
      textScale,
      subject: (color) => {
        const [bg, fg] = SUBJECT_COLORS[color][key];
        return { bg, fg };
      },
    };
  }, [isDark, textScale]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
