import React, { createContext, useCallback, useContext, useMemo } from 'react';
import type { Locale } from '@edulink/shared';
import { ar } from './ar';
import { en } from './en';
import { fr, type Dictionary, type TranslationKey } from './fr';

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, ar };

export type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;

interface I18nValue {
  locale: Locale;
  isRTL: boolean;
  t: TFunction;
}

const I18nContext = createContext<I18nValue>({ locale: 'fr', isRTL: false, t: (k) => fr[k] });

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let out = template.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  // Plural markers: "devoir(s)", "nouveau(x)" → resolved from the `n` parameter.
  if (typeof params.n === 'number') out = out.replace(/\((s|x)\)/g, (_, m: string) => (Math.abs(params.n as number) > 1 ? m : ''));
  return out;
}

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = useCallback<TFunction>((key, params) => interpolate(DICTIONARIES[locale][key] ?? fr[key], params), [locale]);
  const value = useMemo(() => ({ locale, isRTL: locale === 'ar', t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

/** Standalone translator (for notifications generated outside React). */
export function translate(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  return interpolate(DICTIONARIES[locale][key] ?? fr[key], params);
}

export const LANGUAGES: { code: Locale; label: string; native: string }[] = [
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'ar', label: 'Arabe', native: 'العربية' },
  { code: 'en', label: 'Anglais', native: 'English' },
];
