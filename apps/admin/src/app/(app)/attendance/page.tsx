'use client';

import { useMemo } from 'react';
import { absencesByClass, DEMO_TODAY, formatDate, getClass, getStudent, schoolKpis } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Bars } from '@/components/charts';
import { Badge, Kpi, PageHead } from '@/components/ui';

const REASONS: Record<string, string> = { illness: 'Maladie', medical: 'Rendez-vous médical', family: 'Raison familiale', transport: 'Transport', other: 'Autre' };

export default function Attendance() {
  const { db, reviewJustification, notify } = useAdmin();
  const k = useMemo(() => schoolKpis(db), [db]);
  const byClass = useMemo(() => absencesByClass(db).sort((a, b) => b.absences - a.absences).slice(0, 12), [db]);
  const justifs = db.attendance.filter((a) => a.justification).sort((a, b) => (b.justification!.submittedAt).localeCompare(a.justification!.submittedAt));
  const todayAbsent = db.attendance.filter((a) => a.date === DEMO_TODAY && ['absent', 'unexcused', 'excused', 'late'].includes(a.status)).slice(0, 30);

  return (
    <>
      <PageHead title="Présence" subtitle={`Pointages QR / RFID / appel enseignant — ${formatDate(DEMO_TODAY, 'fr', 'long')}`} />
      <div className="grid kpis">
        <Kpi label="Taux de présence" value={k.attendanceRate} suffix="%" icon="✅" tone="success" />
        <Kpi label="Absences" value={k.absencesToday} icon="❌" tone="error" />
        <Kpi label="Retards" value={k.lateToday} icon="⏰" tone="warning" />
        <Kpi label="Justificatifs à valider" value={justifs.filter((j) => j.justification!.status === 'pending').length} icon="🩺" tone="primary" />
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Justificatifs envoyés par les familles</h2>
          <p className="sub">Validation par la vie scolaire — la famille est notifiée automatiquement</p>
          <div className="stack">
            {justifs.map((a) => {
              const s = getStudent(db, a.studentId)!;
              const j = a.justification!;
              return (
                <div key={a.id} className="card" style={{ padding: 14 }}>
                  <div className="row between wrap">
                    <strong>
                      {s.firstName} {s.lastName} · {getClass(db, s.classId)?.name}
                    </strong>
                    <Badge tone={j.status === 'accepted' ? 'success' : j.status === 'rejected' ? 'error' : 'warning'}>{j.status === 'accepted' ? 'Accepté' : j.status === 'rejected' ? 'Refusé' : 'À valider'}</Badge>
                  </div>
                  <div className="tiny muted">
                    Absence du {formatDate(a.date, 'fr', 'dayMonth')} · {REASONS[j.reason]} {j.attachmentName ? `· 📎 ${j.attachmentName}` : ''}
                  </div>
                  {j.message ? <p style={{ margin: '6px 0' }}>« {j.message} »</p> : null}
                  {j.status === 'pending' ? (
                    <div className="row">
                      <button className="btn sm" onClick={() => { reviewJustification(a.id, true); notify(`Justificatif de ${s.firstName} accepté.`); }}>
                        Accepter
                      </button>
                      <button className="btn secondary sm" onClick={() => { reviewJustification(a.id, false); notify(`Justificatif de ${s.firstName} refusé.`); }}>
                        Refuser
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
        <section className="card">
          <h2>Absences par classe</h2>
          <p className="sub">Aujourd&apos;hui</p>
          <Bars items={byClass.map((c) => ({ label: c.name, value: c.absences }))} color="var(--error)" />
        </section>
      </div>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>Absences et retards du jour</h2>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Classe</th>
                <th>Statut</th>
                <th>Pointage</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {todayAbsent.map((a) => {
                const s = getStudent(db, a.studentId)!;
                return (
                  <tr key={a.id}>
                    <td>
                      <strong>
                        {s.lastName} {s.firstName}
                      </strong>
                    </td>
                    <td>{getClass(db, s.classId)?.name}</td>
                    <td>{a.status === 'late' ? <Badge tone="warning">⏰ Retard {a.minutesLate} min</Badge> : a.status === 'excused' ? <Badge tone="info">🔵 Absence justifiée</Badge> : <Badge tone="error">🔴 Absent</Badge>}</td>
                    <td>{a.checkIn ?? '—'}</td>
                    <td className="muted">{a.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
