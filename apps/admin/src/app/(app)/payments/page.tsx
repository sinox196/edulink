'use client';

import { useMemo, useState } from 'react';
import { formatDate, formatMoney, getClass, getStudent, paymentStatus, type Payment } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Donut } from '@/components/charts';
import { Badge, Kpi, PageHead } from '@/components/ui';

const CAT: Record<Payment['category'], string> = { tuition: 'Scolarité', transport: 'Transport', canteen: 'Cantine', activities: 'Activités', books: 'Manuels', trips: 'Sorties' };

export default function Payments() {
  const { db, remindPayment, markPaid, notify } = useAdmin();
  const [status, setStatus] = useState<'open' | 'paid' | 'all'>('open');
  const s = useMemo(() => paymentStatus(db), [db]);
  const rows = db.payments.filter((p) => (status === 'all' ? true : status === 'paid' ? p.status === 'paid' : p.status !== 'paid')).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 60);
  const cur = db.school.currency;
  return (
    <>
      <PageHead title="Paiements & frais scolaires" subtitle="Module activable — intégration prestataire de paiement en ligne prévue" />
      <div className="grid kpis">
        <Kpi label={`Encaissé (${cur})`} value={s.collected} icon="💰" tone="success" />
        <Kpi label={`Restant dû (${cur})`} value={s.outstanding} icon="⏳" tone="warning" />
        <Kpi label="Paiements en retard" value={s.overdue} icon="⚠️" tone="error" />
        <Kpi label="Paiements à venir" value={s.pending} icon="📆" tone="primary" />
      </div>
      <div className="grid twothirds" style={{ marginTop: 16 }}>
        <section>
          <div className="row wrap" style={{ marginBottom: 12 }}>
            {(['open', 'paid', 'all'] as const).map((x) => (
              <button key={x} className={`chip ${status === x ? 'active' : ''}`} onClick={() => setStatus(x)} aria-pressed={status === x}>
                {x === 'open' ? 'À encaisser' : x === 'paid' ? 'Payés' : 'Tous'}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Libellé</th>
                  <th>Montant</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = getStudent(db, p.studentId)!;
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>
                          {st.lastName} {st.firstName}
                        </strong>
                        <div className="tiny muted">{getClass(db, st.classId)?.name}</div>
                      </td>
                      <td>
                        {p.label}
                        <div className="tiny muted">{CAT[p.category]}</div>
                      </td>
                      <td>
                        <strong>{formatMoney(p.amount, cur)}</strong>
                      </td>
                      <td>{formatDate(p.dueDate, 'fr', 'numeric')}</td>
                      <td>{p.status === 'paid' ? <Badge tone="success">✅ Payé</Badge> : p.status === 'overdue' ? <Badge tone="error">En retard</Badge> : <Badge tone="warning">À payer</Badge>}</td>
                      <td>
                        {p.status !== 'paid' ? (
                          <div className="row">
                            <button className="btn ghost sm" onClick={() => { remindPayment(p.id); notify(`Relance envoyée à la famille de ${st.firstName}.`); }}>
                              Relancer
                            </button>
                            <button className="btn secondary sm" onClick={() => { markPaid(p.id); notify('Paiement enregistré, reçu généré.'); }}>
                              Encaisser
                            </button>
                          </div>
                        ) : (
                          <span className="tiny muted">{p.receiptNumber}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card" style={{ alignSelf: 'start' }}>
          <h2>Répartition</h2>
          <Donut
            parts={[
              { label: 'Payés', value: s.paid, color: 'var(--success)' },
              { label: 'À payer', value: s.pending, color: 'var(--warning)' },
              { label: 'En retard', value: s.overdue, color: 'var(--error)' },
            ]}
            center={<strong>{s.paid + s.pending + s.overdue}</strong>}
          />
        </section>
      </div>
    </>
  );
}
