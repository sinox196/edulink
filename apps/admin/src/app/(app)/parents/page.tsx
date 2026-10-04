'use client';

import { useMemo, useState } from 'react';
import { formatStamp, getClass, normalize } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Avatar, Badge, Kpi, PageHead } from '@/components/ui';

export default function Parents() {
  const { db, notify } = useAdmin();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'pending'>('all');
  const [page, setPage] = useState(0);
  const parents = useMemo(() => db.users.filter((u) => u.role === 'parent'), [db]);
  const rows = parents.filter((p) => (status === 'all' || (status === 'active') === p.activated) && (!q || normalize(`${p.firstName} ${p.lastName} ${p.email}`).includes(normalize(q))));
  const active = parents.filter((p) => p.activated).length;
  const shown = rows.slice(page * 25, page * 25 + 25);

  return (
    <>
      <PageHead title="Parents & responsables" subtitle="Comptes familles et activation de l'application" actions={<button className="btn secondary" onClick={() => notify(`${parents.length - active} invitations renvoyées par e-mail et SMS.`)}>📨 Relancer les non-activés</button>} />
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <Kpi label="Comptes parents" value={parents.length} icon="👪" />
        <Kpi label="Application activée" value={active} icon="📲" tone="success" />
        <Kpi label="Taux d'adoption" value={Math.round((active / parents.length) * 100)} suffix="%" icon="📈" tone="secondary" />
      </div>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <input className="input" style={{ maxWidth: 340 }} placeholder="Rechercher un parent…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Rechercher un parent" />
        {(['all', 'active', 'pending'] as const).map((s) => (
          <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(0); }} aria-pressed={status === s}>
            {s === 'all' ? 'Tous' : s === 'active' ? 'Activés' : 'En attente'}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Parent</th>
              <th>Contact</th>
              <th>Enfant(s)</th>
              <th>Dernière activité</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const kids = db.studentParents.filter((l) => l.parentId === p.id).map((l) => db.students.find((s) => s.id === l.studentId)!);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="row">
                      <Avatar name={`${p.firstName} ${p.lastName}`} color={p.avatarColor} />
                      <strong>
                        {p.title} {p.firstName} {p.lastName}
                      </strong>
                    </div>
                  </td>
                  <td className="tiny muted">
                    {p.email}
                    <br />
                    {p.phone}
                  </td>
                  <td>{kids.map((k) => `${k.firstName} (${getClass(db, k.classId)?.name})`).join(', ')}</td>
                  <td className="muted">{p.lastActiveAt && p.activated ? formatStamp(p.lastActiveAt, 'fr') : '—'}</td>
                  <td>{p.activated ? <Badge tone="success">Activé</Badge> : <Badge tone="warning">En attente</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pager">
          <span>{rows.length.toLocaleString('fr-FR')} comptes</span>
          <div className="row">
            <button className="btn secondary sm" disabled={!page} onClick={() => setPage(page - 1)}>
              ←
            </button>
            <button className="btn secondary sm" disabled={(page + 1) * 25 >= rows.length} onClick={() => setPage(page + 1)}>
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
