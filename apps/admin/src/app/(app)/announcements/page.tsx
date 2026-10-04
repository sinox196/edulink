'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatStamp, type AnnouncementCategory, type Priority } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Badge, Field, PageHead, Progress, Switch } from '@/components/ui';

const CATEGORIES: [AnnouncementCategory, string][] = [
  ['general', 'Général'],
  ['closure', 'Fermeture'],
  ['timetable', 'Emploi du temps'],
  ['teacher_absence', 'Absence enseignant'],
  ['transport', 'Transport'],
  ['administrative', 'Administratif'],
  ['security', 'Sécurité'],
];

function AnnouncementsInner() {
  const { db, publishAnnouncement, notify } = useAdmin();
  const params = useSearchParams();
  const [priority, setPriority] = useState<Priority>('normal');
  const [ack, setAck] = useState(false);
  const [scope, setScope] = useState<'school' | 'class'>('school');
  const [classIds, setClassIds] = useState<string[]>([]);

  useEffect(() => {
    if (params.get('emergency')) {
      setPriority('critical');
      setAck(true);
    }
  }, [params]);

  return (
    <>
      <PageHead title="Annonces & alertes" subtitle="Communication école → familles, avec suivi des accusés de lecture" />
      <div className="grid twothirds">
        <section className="stack">
          {db.announcements.map((a) => {
            const rate = Math.round((a.acknowledgedBy.length / Math.max(1, a.recipientCount)) * 100);
            return (
              <article key={a.id} className="card fade-in" style={a.priority === 'critical' ? { borderColor: 'var(--error)', borderWidth: 2 } : undefined}>
                <div className="row wrap">
                  {a.priority === 'critical' ? <Badge tone="error">⚠️ Urgent</Badge> : a.priority === 'important' ? <Badge tone="warning">Important</Badge> : null}
                  <Badge>{CATEGORIES.find((c) => c[0] === a.category)?.[1]}</Badge>
                  <Badge tone="info">{a.scope === 'school' ? "Toute l'école" : a.classIds.map((c) => db.classes.find((x) => x.id === c)?.name).join(', ')}</Badge>
                  <span className="tiny muted" style={{ marginInlineStart: 'auto' }}>
                    {a.authorName} · {formatStamp(a.publishedAt, 'fr')}
                  </span>
                </div>
                <h2 style={{ marginTop: 10 }}>{a.title}</h2>
                <p style={{ margin: '4px 0 0' }}>{a.body}</p>
                {a.requiresAck ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="row between tiny">
                      <span>Accusés de lecture</span>
                      <strong>
                        {rate}% · {a.acknowledgedBy.length.toLocaleString('fr-FR')} / {a.recipientCount.toLocaleString('fr-FR')}
                      </strong>
                    </div>
                    <Progress value={rate / 100} color={rate > 70 ? 'var(--success)' : 'var(--warning)'} />
                    {rate < 100 ? (
                      <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => notify(`Rappel envoyé aux ${(a.recipientCount - a.acknowledgedBy.length).toLocaleString('fr-FR')} familles n'ayant pas confirmé.`)}>
                        🔁 Relancer les familles
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="tiny muted" style={{ marginTop: 8 }}>
                    {a.recipientCount.toLocaleString('fr-FR')} destinataires
                  </div>
                )}
              </article>
            );
          })}
        </section>
        <section className="card" style={{ alignSelf: 'start', position: 'sticky', top: 90 }}>
          <h2>{priority === 'critical' ? '⚠️ Nouvelle alerte d’urgence' : 'Nouvelle annonce'}</h2>
          <form
            className="stack"
            style={{ marginTop: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              publishAnnouncement({ title: String(f.get('title')), body: String(f.get('body')), category: f.get('category') as AnnouncementCategory, priority, requiresAck: ack, scope, classIds: scope === 'school' ? [] : classIds });
              notify(priority === 'critical' ? 'Alerte envoyée en notification push prioritaire à toutes les familles.' : 'Annonce publiée.');
              e.currentTarget.reset();
            }}
          >
            <div className="field">
              <span id="prio-label" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
                Priorité
              </span>
              <div className="row wrap" role="radiogroup" aria-labelledby="prio-label" style={{ marginTop: 6 }}>
                {(['normal', 'important', 'critical'] as Priority[]).map((p) => (
                  <button type="button" role="radio" aria-checked={priority === p} key={p} className={`chip ${priority === p ? 'active' : ''}`} onClick={() => { setPriority(p); if (p === 'critical') setAck(true); }}>
                    {p === 'normal' ? 'Normale' : p === 'important' ? 'Importante' : '⚠️ Urgente'}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Catégorie">
              <select className="select" name="category" defaultValue={priority === 'critical' ? 'closure' : 'general'}>
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destinataires">
              <select className="select" value={scope} onChange={(e) => setScope(e.target.value as 'school' | 'class')}>
                <option value="school">Toute l&apos;école</option>
                <option value="class">Classes sélectionnées</option>
              </select>
            </Field>
            {scope === 'class' ? (
              <select className="select" multiple size={6} value={classIds} onChange={(e) => setClassIds([...e.target.selectedOptions].map((o) => o.value))} aria-label="Classes">
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Field label="Titre">
              <input className="input" name="title" required />
            </Field>
            <Field label="Message">
              <textarea className="textarea" name="body" required />
            </Field>
            <div className="row between">
              <span style={{ fontWeight: 600 }}>Exiger « J&apos;ai lu l&apos;information »</span>
              <Switch checked={ack} onChange={setAck} label="Exiger un accusé de lecture" />
            </div>
            <button className={`btn ${priority === 'critical' ? 'danger' : ''}`} type="submit">
              {priority === 'critical' ? "Envoyer l'alerte" : 'Publier'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

export default function Announcements() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 400 }} />}>
      <AnnouncementsInner />
    </Suspense>
  );
}
