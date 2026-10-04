'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_ADMIN_EMAIL, DEMO_PASSWORD, useAdmin } from '@/lib/store';
import { Crest, Field, Logo } from '@/components/ui';

export default function Login() {
  const { login, db } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="login">
      <section className="hero">
        <div className="row" style={{ gap: 12, fontWeight: 800, fontSize: 22 }}>
          <Logo size={42} /> EduLink
        </div>
        <div>
          <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>Pilotez votre établissement en temps réel.</h1>
          <p style={{ opacity: 0.9, fontSize: 17, maxWidth: 520 }}>Présence, résultats, communication avec les familles, paiements et transport — réunis dans un tableau de bord unique et sécurisé.</p>
          <div className="row wrap" style={{ gap: 10, marginTop: 24 }}>
            {['🔒 Accès par rôles', '🛡️ Journal d’audit', '📣 Alertes d’urgence', '📈 Analytics'].map((t) => (
              <span key={t} className="badge" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', padding: '6px 12px' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 10, opacity: 0.9 }}>
          <Crest /> {db.school.name}
        </div>
      </section>
      <section className="panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => {
              const res = login(email, password);
              setLoading(false);
              if (res === 'ok') router.replace('/dashboard');
              else setError(res === 'forbidden' ? "Ce compte n'a pas accès à l'administration." : 'Identifiants incorrects.');
            }, 400);
          }}
        >
          <h2 style={{ margin: 0, fontSize: 26 }}>Connexion administration</h2>
          <p className="muted" style={{ margin: 0 }}>
            Espace réservé à la direction et au personnel administratif.
          </p>
          <Field label="Adresse e-mail">
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Mot de passe">
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error ? (
            <div className="badge error" role="alert" style={{ padding: '8px 12px', borderRadius: 10 }}>
              {error}
            </div>
          ) : null}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <button
            type="button"
            className="btn soft"
            onClick={() => {
              setEmail(DEMO_ADMIN_EMAIL);
              setPassword(DEMO_PASSWORD);
            }}
          >
            Utiliser le compte de démonstration
          </button>
          <p className="tiny muted" style={{ margin: 0 }}>
            Démo : {DEMO_ADMIN_EMAIL} · {DEMO_PASSWORD}
          </p>
        </form>
      </section>
    </div>
  );
}
