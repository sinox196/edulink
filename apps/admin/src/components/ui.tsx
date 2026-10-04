'use client';

import React, { useEffect } from 'react';
import { useCountUp } from './charts';

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="EduLink">
      <defs>
        <linearGradient id="lg-admin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#lg-admin)" />
      <path d="M12 15.5c4.2-1.6 8.2-1.4 12 1.2v17.6c-3.8-2.6-7.8-2.8-12-1.2V15.5z" fill="#fff" opacity=".95" />
      <path d="M36 15.5c-4.2-1.6-8.2-1.4-12 1.2v17.6c3.8-2.6 7.8-2.8 12-1.2V15.5z" fill="#fff" opacity=".7" />
      <circle cx="24" cy="12" r="3.2" fill="#fff" />
    </svg>
  );
}

export function Crest({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="École Internationale Horizon">
      <rect width="40" height="40" rx="12" fill="#1E3A7A" />
      <circle cx="20" cy="24" r="9" fill="#F59E0B" />
      <rect y="24" width="40" height="16" fill="#1E3A7A" />
      <path d="M7 27h26M10 31h20M14 35h12" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 9v4M11 13l2.5 2.5M29 13l-2.5 2.5" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="row wrap">{actions}</div> : null}
    </div>
  );
}

const TONES = {
  primary: ['var(--primary)', 'var(--primary-soft)'],
  success: ['var(--success-text)', 'var(--success-soft)'],
  warning: ['var(--warning-text)', 'var(--warning-soft)'],
  error: ['var(--error-text)', 'var(--error-soft)'],
  academic: ['var(--academic)', 'var(--academic-soft)'],
  event: ['var(--event)', 'var(--event-soft)'],
  secondary: ['var(--secondary)', 'var(--secondary-soft)'],
  neutral: ['var(--text-2)', 'var(--bg-alt)'],
} as const;
export type Tone = keyof typeof TONES;

export function Kpi({ label, value, suffix = '', icon, tone = 'primary', hint, decimals = 0 }: { label: string; value: number; suffix?: string; icon: string; tone?: Tone; hint?: React.ReactNode; decimals?: number }) {
  const v = useCountUp(decimals ? value * 10 : value);
  const [fg, bg] = TONES[tone];
  return (
    <div className="card kpi fade-in" aria-label={`${label}: ${value}${suffix}`}>
      <div className="row between">
        <div className="icon" style={{ color: fg, background: bg }} aria-hidden>
          {icon}
        </div>
        {hint}
      </div>
      <div className="value" style={{ color: fg }}>
        {decimals ? (v / 10).toFixed(decimals) : v.toLocaleString('fr-FR')}
        {suffix}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'academic'; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .replace(/^(M\.|Mme)\s+/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span className="avatar" style={{ background: color }} aria-hidden>
      {initials}
    </span>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />;
}

export function Overlay({ open, onClose, children, variant = 'drawer', label }: { open: boolean; onClose: () => void; children: React.ReactNode; variant?: 'drawer' | 'modal'; label: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`overlay ${variant === 'modal' ? 'center' : ''}`} onClick={onClose}>
      <div className={variant} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
