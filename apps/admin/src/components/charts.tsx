'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

/** Animated 0→1 progress for chart entrances (respects reduced motion via CSS-free check). */
function useProgress(duration = 900) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setP(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / duration);
      setP(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);
  return p;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export interface LineSeries {
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
  area?: boolean;
}

export function LineChart({ labels, series, min, max, height = 240, suffix = '' }: { labels: string[]; series: LineSeries[]; min: number; max: number; height?: number; suffix?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const p = useProgress();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, '');
  const pad = { t: 14, r: 12, b: 28, l: 38 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (labels.length < 2 ? w / 2 : (i / (labels.length - 1)) * w);
  const y = (v: number) => pad.t + h - ((v - min) / (max - min)) * h;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(min + (v - min) * p).toFixed(1)}`).join(' ');
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const every = Math.ceil(labels.length / 8);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <svg width={width} height={height} role="img" aria-label={series.map((s) => `${s.label}: ${s.values.at(-1)}${suffix}`).join(', ')} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${gid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="1" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="4 6" />
            <text x={pad.l - 8} y={y(t) + 4} fontSize="11" textAnchor="end" fill="var(--text-3)">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}
        {series.map((s, i) =>
          s.area ? <path key={`a${i}`} d={`${path(s.values)} L ${x(s.values.length - 1)} ${pad.t + h} L ${x(0)} ${pad.t + h} Z`} fill={`url(#${gid}-${i})`} /> : null,
        )}
        {series.map((s, i) => (
          <path key={i} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.dashed ? 2 : 2.6} strokeDasharray={s.dashed ? '6 6' : undefined} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {labels.map((l, i) =>
          i % every === 0 || (i === labels.length - 1 && i % every >= every / 2) ? (
            <text key={i} x={x(i)} y={height - 8} fontSize="11" textAnchor="middle" fill="var(--text-2)">
              {l}
            </text>
          ) : null,
        )}
        {labels.map((_, i) => (
          <rect key={`h${i}`} x={x(i) - w / labels.length / 2} y={pad.t} width={w / labels.length} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--border-strong)" />
            {series.map((s, i) => (
              <circle key={i} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill="var(--card)" stroke={s.color} strokeWidth={2.5} />
            ))}
          </g>
        ) : null}
      </svg>
      {hover !== null ? (
        <div className="card" style={{ position: 'absolute', top: 6, left: Math.min(Math.max(x(hover) - 80, 0), width - 170), padding: '8px 12px', pointerEvents: 'none', fontSize: 12, width: 160 }}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <div key={s.label} className="row between">
              <span style={{ color: s.color }}>● {s.label}</span>
              <strong>
                {s.values[hover]}
                {suffix}
              </strong>
            </div>
          ))}
        </div>
      ) : null}
      <div className="row wrap tiny muted" style={{ gap: 16, marginTop: 6 }}>
        {series.map((s) => (
          <span key={s.label} className="row" style={{ gap: 6 }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Bars({ items, max, color = 'var(--primary)', suffix = '', horizontal = true }: { items: { label: string; value: number; color?: string }[]; max?: number; color?: string; suffix?: string; horizontal?: boolean }) {
  const p = useProgress();
  const m = max ?? Math.max(...items.map((i) => i.value), 1);
  if (horizontal) {
    return (
      <div className="stack" style={{ gap: 10 }}>
        {items.map((it) => (
          <div key={it.label} aria-label={`${it.label}: ${it.value}${suffix}`}>
            <div className="row between tiny" style={{ marginBottom: 4 }}>
              <strong>{it.label}</strong>
              <span className="muted">
                {it.value}
                {suffix}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${(it.value / m) * 100 * p}%`, background: it.color ?? color }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="row" style={{ alignItems: 'flex-end', gap: 8, height: 190 }}>
      {items.map((it) => (
        <div key={it.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }} aria-label={`${it.label}: ${it.value}${suffix}`}>
          <span className="tiny muted">{it.value}</span>
          <div style={{ width: '70%', maxWidth: 34, height: Math.max(4, (it.value / m) * 140 * p), borderRadius: 8, background: it.color ?? color }} />
          <span className="tiny muted" style={{ whiteSpace: 'nowrap' }}>
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 170, center }: { parts: { label: string; value: number; color: string }[]; size?: number; center?: React.ReactNode }) {
  const p = useProgress();
  const total = parts.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="row wrap" style={{ gap: 20 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={parts.map((x) => `${x.label}: ${x.value}`).join(', ')}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-alt)" strokeWidth={18} />
          {parts.map((x) => {
            const len = (x.value / total) * circ * p;
            const el = <circle key={x.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={x.color} strokeWidth={18} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} />;
            acc += (x.value / total) * circ * p;
            return el;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{center}</div>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {parts.map((x) => (
          <div key={x.label} className="row" style={{ gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: x.color }} />
            <span>{x.label}</span>
            <strong style={{ marginInlineStart: 'auto', paddingInlineStart: 12 }}>{x.value.toLocaleString('fr-FR')}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function useCountUp(target: number, duration = 900) {
  const p = useProgress(duration);
  return Math.round(target * p);
}
