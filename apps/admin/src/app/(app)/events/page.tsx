'use client';

import { DEMO_TODAY, formatDate } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Badge, Field, PageHead } from '@/components/ui';

export default function Events() {
  const { db, createEvent, notify } = useAdmin();
  const events = [...db.events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHead title="Événements" subtitle="Calendrier de l'établissement, participations et autorisations" />
      <div className="grid twothirds">
        <section className="stack">
          {events.map((e) => {
            const parts = db.eventParticipants.filter((p) => p.eventId === e.id);
            const past = e.date < DEMO_TODAY;
            return (
              <article key={e.id} className="card row" style={{ opacity: past ? 0.6 : 1, alignItems: 'flex-start' }}>
                <div style={{ width: 64, textAlign: 'center', borderRadius: 14, background: 'var(--event-soft)', color: 'var(--event)', padding: '8px 0', flexShrink: 0 }}>
                  <div className="tiny" style={{ fontWeight: 800, textTransform: 'uppercase' }}>
                    {formatDate(e.date, 'fr', 'short').split(' ')[1]}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{Number(e.date.slice(8))}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="row wrap">
                    <h2 style={{ margin: 0 }}>
                      {e.emoji} {e.title}
                    </h2>
                    {e.requiresAuthorization ? <Badge tone="warning">Autorisation requise</Badge> : null}
                    {past ? <Badge>Passé</Badge> : null}
                  </div>
                  <div className="tiny muted">
                    {formatDate(e.date, 'fr', 'long')} {e.time ? `· ${e.time}${e.endTime ? `–${e.endTime}` : ''}` : ''} · 📍 {e.location} · {e.classIds.length ? e.classIds.map((c) => db.classes.find((x) => x.id === c)?.name).join(', ') : "Toute l'école"}
                  </div>
                  <p style={{ margin: '6px 0' }}>{e.description}</p>
                  <div className="row wrap tiny">
                    <Badge tone="success">✓ {parts.filter((p) => p.response === 'yes').length} participations confirmées</Badge>
                    {e.requiresAuthorization ? <Badge tone="info">✍️ {parts.filter((p) => p.authorizationSignedAt).length} autorisations signées</Badge> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
        <section className="card" style={{ alignSelf: 'start', position: 'sticky', top: 90 }}>
          <h2>Créer un événement</h2>
          <form
            className="stack"
            style={{ marginTop: 12 }}
            onSubmit={(ev) => {
              ev.preventDefault();
              const f = new FormData(ev.currentTarget);
              const cls = String(f.get('classId'));
              createEvent({ title: String(f.get('title')), emoji: String(f.get('emoji')), date: String(f.get('date')), time: String(f.get('time')), location: String(f.get('location')), description: String(f.get('description')), classIds: cls === 'all' ? [] : [cls], requiresAuthorization: f.get('auth') === 'on' });
              notify('Événement publié — les familles concernées sont notifiées.');
              ev.currentTarget.reset();
            }}
          >
            <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
              <Field label="Icône">
                <select className="select" name="emoji">
                  {['🎭', '🏃', '🔬', '🏛️', '🎨', '🎵', '🎓', '❄️'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Titre">
                <input className="input" name="title" required />
              </Field>
            </div>
            <div className="grid two">
              <Field label="Date">
                <input className="input" type="date" name="date" defaultValue="2026-12-04" min={DEMO_TODAY} required />
              </Field>
              <Field label="Heure">
                <input className="input" type="time" name="time" defaultValue="14:00" required />
              </Field>
            </div>
            <Field label="Lieu">
              <input className="input" name="location" required />
            </Field>
            <Field label="Public">
              <select className="select" name="classId">
                <option value="all">Toute l&apos;école</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea className="textarea" name="description" />
            </Field>
            <label className="row" style={{ fontWeight: 600 }}>
              <input type="checkbox" name="auth" /> Autorisation parentale requise
            </label>
            <button className="btn" type="submit">
              Publier
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
