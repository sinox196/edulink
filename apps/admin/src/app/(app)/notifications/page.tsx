'use client';

import { useState } from 'react';
import { notificationEngagement, type NotificationCategory } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Bars } from '@/components/charts';
import { Field, PageHead } from '@/components/ui';

const CATS: [NotificationCategory, string][] = [
  ['events', '📅 Événements'],
  ['urgent', '🔴 Urgent'],
  ['homework', '📝 Devoirs'],
  ['payments', '💳 Paiements'],
  ['transport', '🚌 Transport'],
  ['attendance', '✅ Présence'],
];

export default function Notifications() {
  const { db, sendPush, notify } = useAdmin();
  const [audience, setAudience] = useState<'all' | 'class'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const eng = notificationEngagement();
  return (
    <>
      <PageHead title="Notifications push" subtitle="Firebase Cloud Messaging / Apple Push Notifications — messages courts et actionnables" />
      <div className="grid two">
        <section className="card">
          <h2>Composer</h2>
          <form
            className="stack"
            style={{ marginTop: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const n = sendPush({ audience, classId: String(f.get('classId')), category: f.get('category') as NotificationCategory, title, body });
              notify(`Notification envoyée à ${n.toLocaleString('fr-FR')} familles.`);
              setTitle('');
              setBody('');
            }}
          >
            <Field label="Destinataires">
              <select className="select" value={audience} onChange={(e) => setAudience(e.target.value as 'all' | 'class')}>
                <option value="all">Toutes les familles</option>
                <option value="class">Une classe</option>
              </select>
            </Field>
            {audience === 'class' ? (
              <Field label="Classe">
                <select className="select" name="classId">
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Catégorie">
              <select className="select" name="category">
                {CATS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Titre (${title.length}/40)`}>
              <input className="input" maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label={`Message (${body.length}/140)`}>
              <textarea className="textarea" maxLength={140} value={body} onChange={(e) => setBody(e.target.value)} required />
            </Field>
            <button className="btn" type="submit">
              Envoyer
            </button>
          </form>
        </section>
        <section className="stack">
          <div className="card">
            <h2>Aperçu</h2>
            <div style={{ marginTop: 12, background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 24, padding: 18 }}>
              <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 12, color: '#172033' }}>
                <div className="row tiny" style={{ color: '#667085' }}>
                  <strong style={{ color: '#2563EB' }}>EduLink</strong> · maintenant
                </div>
                <strong>{title || 'Titre de la notification'}</strong>
                <div>{body || 'Votre message apparaîtra ainsi sur le téléphone des parents.'}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <h2>Taux d&apos;ouverture par catégorie</h2>
            <Bars items={eng.map((e) => ({ label: e.category, value: Math.round((e.opened / e.sent) * 100) }))} max={100} suffix="%" />
          </div>
        </section>
      </div>
    </>
  );
}
