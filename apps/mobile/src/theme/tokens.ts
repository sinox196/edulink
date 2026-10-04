import type { SubjectColor } from '@edulink/shared';

/**
 * EduLink design tokens.
 * Primary "Deep Education Blue", teal secondary, and a small set of semantic accents:
 * purple = academic performance, orange = events, green = attendance, blue = communication.
 */
export interface Palette {
  mode: 'light' | 'dark';
  background: string;
  backgroundAlt: string;
  card: string;
  cardElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  secondary: string;
  secondarySoft: string;
  success: string;
  successText: string;
  successSoft: string;
  warning: string;
  warningText: string;
  warningSoft: string;
  error: string;
  errorText: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
  academic: string;
  academicSoft: string;
  event: string;
  eventSoft: string;
  overlay: string;
  shadow: string;
  skeleton: string;
  tabBar: string;
}

export const light: Palette = {
  mode: 'light',
  background: '#F6F8FC',
  backgroundAlt: '#EEF2F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  border: '#E6EAF2',
  borderStrong: '#D3DAE6',
  text: '#172033',
  textSecondary: '#667085',
  textTertiary: '#98A2B3',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySoft: '#EAF1FE',
  onPrimary: '#FFFFFF',
  secondary: '#14B8A6',
  secondarySoft: '#E6F8F6',
  success: '#22C55E',
  successText: '#15803D',
  successSoft: '#E9F9EF',
  warning: '#F59E0B',
  warningText: '#B45309',
  warningSoft: '#FEF5E6',
  error: '#EF4444',
  errorText: '#DC2626',
  errorSoft: '#FDECEC',
  info: '#2563EB',
  infoSoft: '#EAF1FE',
  academic: '#7C3AED',
  academicSoft: '#F2ECFE',
  event: '#F97316',
  eventSoft: '#FEF1E8',
  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: '#1E2A4A',
  skeleton: '#E9EDF5',
  tabBar: '#FFFFFF',
};

export const dark: Palette = {
  mode: 'dark',
  background: '#0B1220',
  backgroundAlt: '#0F1729',
  card: '#131C2E',
  cardElevated: '#1A2539',
  border: '#22304A',
  borderStrong: '#2E3D5C',
  text: '#E8EDF6',
  textSecondary: '#A3AEC2',
  textTertiary: '#6F7C95',
  primary: '#5B8DEF',
  primaryPressed: '#4A7BE0',
  primarySoft: '#1A2B4D',
  onPrimary: '#0B1220',
  secondary: '#2DD4BF',
  secondarySoft: '#123735',
  success: '#4ADE80',
  successText: '#6EE7A0',
  successSoft: '#123222',
  warning: '#FBBF24',
  warningText: '#FCD34D',
  warningSoft: '#3A2D10',
  error: '#F87171',
  errorText: '#FCA5A5',
  errorSoft: '#3B1818',
  info: '#5B8DEF',
  infoSoft: '#1A2B4D',
  academic: '#A78BFA',
  academicSoft: '#2A2148',
  event: '#FB923C',
  eventSoft: '#3A2414',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  skeleton: '#1C2740',
  tabBar: '#131C2E',
};

/** Pastel subject colours: soft background + readable foreground in each mode. */
export const SUBJECT_COLORS: Record<SubjectColor, { light: [string, string]; dark: [string, string] }> = {
  blue: { light: ['#EAF1FE', '#1D4ED8'], dark: ['#1A2B4D', '#93B4F5'] },
  violet: { light: ['#F2ECFE', '#6D28D9'], dark: ['#2A2148', '#C4B5FD'] },
  teal: { light: ['#E6F8F6', '#0F766E'], dark: ['#123735', '#5EEAD4'] },
  green: { light: ['#E9F9EF', '#15803D'], dark: ['#123222', '#86EFAC'] },
  amber: { light: ['#FEF5E6', '#B45309'], dark: ['#3A2D10', '#FCD34D'] },
  rose: { light: ['#FDEEF3', '#BE185D'], dark: ['#3B1626', '#F9A8D4'] },
  orange: { light: ['#FEF1E8', '#C2410C'], dark: ['#3A2414', '#FDBA74'] },
  sky: { light: ['#E7F6FD', '#0369A1'], dark: ['#10314A', '#7DD3FC'] },
  slate: { light: ['#F1F4F9', '#475467'], dark: ['#1C2740', '#CBD5E1'] },
};

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 18, xl: 20, pill: 999 } as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'captionStrong' | 'label' | 'number';

export const typography: Record<TextVariant, { size: number; line: number; weight: keyof typeof fonts; tracking?: number }> = {
  display: { size: 30, line: 36, weight: 'extrabold', tracking: -0.6 },
  title: { size: 22, line: 28, weight: 'bold', tracking: -0.3 },
  heading: { size: 17, line: 23, weight: 'bold', tracking: -0.1 },
  subheading: { size: 15, line: 21, weight: 'semibold' },
  body: { size: 15, line: 22, weight: 'medium' },
  bodyStrong: { size: 15, line: 22, weight: 'semibold' },
  caption: { size: 13, line: 18, weight: 'medium' },
  captionStrong: { size: 13, line: 18, weight: 'semibold' },
  label: { size: 11.5, line: 15, weight: 'bold', tracking: 0.6 },
  number: { size: 26, line: 30, weight: 'extrabold', tracking: -0.5 },
};

export type TextScale = 1 | 1.15 | 1.3;
