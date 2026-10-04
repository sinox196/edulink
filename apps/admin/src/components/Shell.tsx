'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { formatDate, DEMO_TODAY, schoolKpis } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Avatar, Crest, Logo } from './ui';

const NAV: { section: string; items: { href: string; label: string; icon: string; count?: (k: ReturnType<typeof schoolKpis>) => number | undefined }[] }[] = [
  { section: 'Pilotage', items: [{ href: '/dashboard', label: 'Tableau de bord', icon: '📊' }, { href: '/analytics', label: 'Analytics', icon: '📈' }] },
  {
    section: 'Communauté',
    items: [
      { href: '/students', label: 'Élèves', icon: '🎒' },
      { href: '/parents', label: 'Parents', icon: '👪' },
      { href: '/teachers', label: 'Enseignants', icon: '🧑‍🏫' },
      { href: '/classes', label: 'Classes', icon: '🏫' },
    ],
  },
  {
    section: 'Vie scolaire',
    items: [
      { href: '/attendance', label: 'Présence', icon: '✅', count: (k) => k.absencesToday },
      { href: '/announcements', label: 'Annonces & alertes', icon: '📣' },
      { href: '/events', label: 'Événements', icon: '📅', count: (k) => k.upcomingEvents },
      { href: '/notifications', label: 'Notifications push', icon: '🔔' },
    ],
  },
  {
    section: 'Services',
    items: [
      { href: '/payments', label: 'Paiements', icon: '💳', count: (k) => k.paymentsPending },
      { href: '/transport', label: 'Transport', icon: '🚌' },
    ],
  },
  { section: 'Établissement', items: [{ href: '/settings', label: 'Paramètres', icon: '⚙️' }, { href: '/audit', label: "Journal d'audit", icon: '🛡️' }] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, ready, db, logout, toast } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const k = schoolKpis(db);

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!ready || !user) {
    return (
      <div className="content">
        <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  return (
    <div className="shell">
      <a href="#main" className="sr-only">
        Aller au contenu
      </a>
      <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigation principale">
        <div className="brand">
          <Logo /> EduLink <span className="badge info" style={{ marginInlineStart: 'auto' }}>Admin</span>
        </div>
        <div className="school">
          <Crest />
          <div>
            <strong>{db.school.name}</strong>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>Année {db.school.academicYear}</div>
          </div>
        </div>
        {NAV.map((g) => (
          <div key={g.section}>
            <div className="section">{g.section}</div>
            {g.items.map((it) => {
              const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
              const count = it.count?.(k);
              return (
                <Link key={it.href} href={it.href} className={`nav-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
                  <span aria-hidden>{it.icon}</span>
                  {it.label}
                  {count ? <span className="count">{count}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="main">
        <header className="topbar">
          <button className="btn secondary sm menu-btn" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            ☰
          </button>
          <form
            className="search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q');
              router.push(`/students?q=${encodeURIComponent(String(q ?? ''))}`);
            }}
          >
            <span aria-hidden>🔎</span>
            <input name="q" placeholder="Rechercher un élève, un matricule…" aria-label="Rechercher un élève" />
          </form>
          <span className="muted tiny hide-sm" style={{ marginInlineStart: 'auto' }}>
            {formatDate(DEMO_TODAY, 'fr', 'long')}
          </span>
          <select className="select hide-sm" style={{ width: 'auto' }} value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)} aria-label="Thème">
            <option value="system">Système</option>
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
          <div className="row">
            <Avatar name={`${user.firstName} ${user.lastName}`} color={user.avatarColor} />
            <div className="tiny hide-sm" style={{ lineHeight: 1.2 }}>
              <strong>
                {user.title} {user.lastName}
              </strong>
              <div className="muted">Directrice</div>
            </div>
          </div>
          <button
            className="btn ghost sm"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          >
            Déconnexion
          </button>
        </header>
        <main id="main" className="content">
          {children}
        </main>
      </div>
      {toast ? (
        <div className="toast" role="status">
          ✅ {toast}
        </div>
      ) : null}
    </div>
  );
}
