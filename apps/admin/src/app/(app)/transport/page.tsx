'use client';

import { useAdmin } from '@/lib/store';
import { Badge, PageHead } from '@/components/ui';

const STATE: Record<string, ['success' | 'warning' | 'info' | 'neutral', string]> = {
  en_route: ['success', '🟢 En route'],
  delayed: ['warning', '🟠 Retardé'],
  at_school: ['info', "🏫 À l'école"],
  parked: ['neutral', 'Au dépôt'],
};

export default function Transport() {
  const { db, notify } = useAdmin();
  return (
    <>
      <PageHead title="Transport scolaire" subtitle={`${db.buses.length} bus · suivi en temps réel (GPS) · parents notifiés à l'approche`} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {db.buses.map((b) => {
          const live = db.transportLive.find((l) => l.busId === b.id);
          const st = STATE[live?.state ?? 'parked'];
          const riders = db.busAssignments.filter((a) => a.busId === b.id).length;
          return (
            <article key={b.id} className="card fade-in">
              <div className="row between">
                <h2 style={{ margin: 0 }}>🚌 Bus N°{b.number}</h2>
                <Badge tone={st[0]}>{st[1]}</Badge>
              </div>
              <p className="sub" style={{ margin: '6px 0' }}>
                Chauffeur : {b.driverFirstName} · {b.plate} · {b.capacity} places
              </p>
              {live?.delayMinutes ? <Badge tone="warning">+{live.delayMinutes} min</Badge> : null}
              <div className="tiny muted" style={{ marginTop: 8 }}>
                {riders ? `${riders} élèves suivis dans l'app (démo)` : 'Circuit standard'}
              </div>
              <button className="btn soft sm" style={{ marginTop: 12 }} onClick={() => notify(`Message envoyé aux familles du bus N°${b.number}.`)}>
                Prévenir les familles
              </button>
            </article>
          );
        })}
      </div>
      <p className="tiny muted" style={{ marginTop: 16 }}>
        🔒 Confidentialité : chaque famille ne voit que son propre arrêt ; les positions des autres élèves ne sont jamais exposées.
      </p>
    </>
  );
}
