'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { absencesByClass, attendanceTrend, averagesByLevel, DEMO_TODAY, engagementSeries, formatDate, formatStamp, paymentStatus, schoolKpis } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Bars, Donut, LineChart } from '@/components/charts';
import { Badge, Kpi, PageHead, Progress } from '@/components/ui';

export default function Dashboard() {
  const { db, user } = useAdmin();
  const k = useMemo(() => schoolKpis(db), [db]);
  const trend = useMemo(() => attendanceTrend(db).slice(-20), [db]);
  const byClass = useMemo(() => absencesByClass(db).sort((a, b) => b.absences - a.absences).slice(0, 8), [db]);
  const levels = useMemo(() => averagesByLevel(db), [db]);
  const pay = useMemo(() => paymentStatus(db), [db]);
  const engagement = engagementSeries();
  const critical = db.announcements.filter((a) => a.requiresAck);
  const pending = db.attendance.filter((a) => a.justification?.status === 'pending');

  return (
    <>
      <PageHead
        title={`Bonjour ${user?.title ?? ''} ${user?.lastName ?? ''}`}
        subtitle={`Vue d'ensemble de ${db.school.name} — ${formatDate(DEMO_TODAY, 'fr', 'long')}`}
        actions={
          <>
            <Link className="btn danger" href="/announcements?emergency=1">
              ⚠️ Alerte d&apos;urgence
            </Link>
            <Link className="btn secondary" href="/announcements">
              📣 Nouvelle annonce
            </Link>
          </>
        }
      />

      <div className="grid kpis">
        <Kpi label="Élèves" value={k.students} icon="🎒" tone="primary" />
        <Kpi label="Enseignants" value={k.teachers} icon="🧑‍🏫" tone="academic" />
        <Kpi label="Classes" value={k.classes} icon="🏫" tone="secondary" />
        <Kpi label="Présence aujourd'hui" value={k.attendanceRate} suffix="%" icon="✅" tone="success" hint={<Badge tone="success">↗ +0.4 pt</Badge>} />
        <Kpi label="Absences aujourd'hui" value={k.absencesToday} icon="❌" tone="error" />
        <Kpi label="Retards" value={k.lateToday} icon="⏰" tone="warning" />
        <Kpi label="Paiements en attente" value={k.paymentsPending} icon="💳" tone="neutral" />
        <Kpi label="Événements à venir" value={k.upcomingEvents} icon="📅" tone="event" />
      </div>

      <div className="grid twothirds" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Évolution de la présence</h2>
          <p className="sub">Taux de présence quotidien sur les 4 dernières semaines</p>
          <LineChart labels={trend.map((d) => formatDate(d.date, 'fr', 'short'))} min={90} max={100} suffix="%" series={[{ label: 'Présence', color: 'var(--success)', values: trend.map((d) => d.rate), area: true }]} />
        </section>
        <section className="card">
          <h2>Absences par classe</h2>
          <p className="sub">Aujourd&apos;hui — classes les plus concernées</p>
          <Bars items={byClass.map((c) => ({ label: c.name, value: c.absences }))} color="var(--error)" />
        </section>
      </div>

      <div className="grid three" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Moyennes par niveau</h2>
          <p className="sub">Trimestre 1 (provisoire)</p>
          <Bars horizontal={false} max={20} items={levels.map((l) => ({ label: l.grade.replace('Terminale', 'Tle'), value: l.average, color: l.level === 'primaire' ? 'var(--secondary)' : l.level === 'college' ? 'var(--primary)' : 'var(--academic)' }))} />
        </section>
        <section className="card">
          <h2>Paiements — T1</h2>
          <p className="sub">Frais de scolarité et services</p>
          <Donut
            parts={[
              { label: 'Payés', value: pay.paid, color: 'var(--success)' },
              { label: 'En attente', value: pay.pending, color: 'var(--warning)' },
              { label: 'En retard', value: pay.overdue, color: 'var(--error)' },
            ]}
            center={
              <div>
                <strong style={{ fontSize: 20 }}>{Math.round((pay.paid / (pay.paid + pay.pending + pay.overdue)) * 100)}%</strong>
                <div className="tiny muted">encaissés</div>
              </div>
            }
          />
        </section>
        <section className="card">
          <h2>Adoption de l&apos;application</h2>
          <p className="sub">Familles ayant activé leur compte · taux d&apos;ouverture des notifications</p>
          <LineChart
            height={200}
            labels={engagement.map((e) => formatDate(e.week, 'fr', 'short'))}
            min={40}
            max={100}
            suffix="%"
            series={[
              { label: 'Adoption parents', color: 'var(--primary)', values: engagement.map((e) => e.adoption) },
              { label: 'Ouverture notifications', color: 'var(--secondary)', values: engagement.map((e) => e.openRate), dashed: true },
            ]}
          />
        </section>
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="row between">
            <h2>Accusés de lecture — alertes critiques</h2>
            <Link className="btn ghost sm" href="/announcements">
              Gérer
            </Link>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            {critical.map((a) => {
              const rate = Math.round((a.acknowledgedBy.length / Math.max(1, a.recipientCount)) * 100);
              return (
                <div key={a.id}>
                  <div className="row between">
                    <strong>{a.title}</strong>
                    <strong style={{ color: 'var(--primary)' }}>{rate}%</strong>
                  </div>
                  <Progress value={rate / 100} />
                  <div className="tiny muted" style={{ marginTop: 4 }}>
                    {a.acknowledgedBy.length.toLocaleString('fr-FR')} familles sur {a.recipientCount.toLocaleString('fr-FR')} ont confirmé « J&apos;ai lu l&apos;information »
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card">
          <div className="row between">
            <h2>À traiter</h2>
            <Badge tone="warning">{pending.length + k.paymentsPending} éléments</Badge>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            <Link href="/attendance" className="row between">
              <span>🩺 Justificatifs d&apos;absence à valider</span>
              <Badge tone={pending.length ? 'warning' : 'success'}>{pending.length}</Badge>
            </Link>
            <Link href="/payments" className="row between">
              <span>💳 Paiements en retard à relancer</span>
              <Badge tone="error">{k.paymentsPending}</Badge>
            </Link>
            <Link href="/parents" className="row between">
              <span>📲 Familles n&apos;ayant pas activé l&apos;application</span>
              <Badge tone="neutral">{100 - k.parentAdoption}%</Badge>
            </Link>
            <Link href="/transport" className="row between">
              <span>🚌 Bus en retard</span>
              <Badge tone="warning">{db.transportLive.filter((t) => t.state === 'delayed').length}</Badge>
            </Link>
          </div>
          <h2 style={{ marginTop: 20 }}>Activité récente</h2>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {db.auditLogs.slice(0, 5).map((l) => (
              <div key={l.id} className="row tiny">
                <span className="muted" style={{ width: 52 }}>
                  {formatStamp(l.at, 'fr')}
                </span>
                <span>
                  <strong>{l.actorName}</strong> — {l.action}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
