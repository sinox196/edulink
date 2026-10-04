'use client';

import { useMemo } from 'react';
import { absencesByClass, attendanceTrend, averagesByLevel, engagementSeries, formatDate, notificationEngagement, paymentStatus, schoolKpis, formatMoney } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Bars, LineChart } from '@/components/charts';
import { Kpi, PageHead } from '@/components/ui';

export default function Analytics() {
  const { db } = useAdmin();
  const k = useMemo(() => schoolKpis(db), [db]);
  const trend = useMemo(() => attendanceTrend(db), [db]);
  const abs = useMemo(() => absencesByClass(db), [db]);
  const levels = useMemo(() => averagesByLevel(db), [db]);
  const pay = useMemo(() => paymentStatus(db), [db]);
  const eng = engagementSeries();
  const notif = notificationEngagement();
  const byLevel = (['primaire', 'college', 'lycee'] as const).map((l) => {
    const cls = abs.filter((a) => db.classes.find((c) => c.id === a.classId)?.level === l);
    const size = cls.reduce((s, c) => s + c.size, 0);
    return { label: l === 'primaire' ? 'Primaire' : l === 'college' ? 'Collège' : 'Lycée', value: Math.round((1 - cls.reduce((s, c) => s + c.absences, 0) / size) * 1000) / 10 };
  });

  return (
    <>
      <PageHead title="Analytics" subtitle="Indicateurs clés de l'établissement — données anonymisées et agrégées" />
      <div className="grid kpis">
        <Kpi label="Adoption parents" value={k.parentAdoption} suffix="%" icon="📲" tone="primary" />
        <Kpi label="Accusés de lecture (alerte)" value={k.ackRate} suffix="%" icon="✅" tone="success" />
        <Kpi label="Encaissé (DT)" value={pay.collected} icon="💰" tone="secondary" />
        <Kpi label="Restant dû (DT)" value={pay.outstanding} icon="⏳" tone="warning" />
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Présence depuis la rentrée</h2>
          <p className="sub">Taux quotidien — toute l&apos;école</p>
          <LineChart labels={trend.map((d) => formatDate(d.date, 'fr', 'short'))} min={90} max={100} suffix="%" series={[{ label: 'Présence', color: 'var(--success)', values: trend.map((d) => d.rate), area: true }]} />
        </section>
        <section className="card">
          <h2>Présence par cycle (aujourd&apos;hui)</h2>
          <p className="sub">Primaire, collège, lycée</p>
          <Bars items={byLevel} max={100} suffix="%" color="var(--success)" />
          <h2 style={{ marginTop: 20 }}>Moyennes par niveau</h2>
          <Bars items={levels.map((l) => ({ label: l.grade, value: l.average }))} max={20} color="var(--academic)" />
        </section>
        <section className="card">
          <h2>Engagement des notifications</h2>
          <p className="sub">Taux d&apos;ouverture par catégorie (30 derniers jours)</p>
          <Bars items={notif.map((n) => ({ label: `${n.category} · ${n.sent.toLocaleString('fr-FR')} envoyées`, value: Math.round((n.opened / n.sent) * 100) }))} max={100} suffix="%" color="var(--primary)" />
        </section>
        <section className="card">
          <h2>Adoption & réactivité</h2>
          <p className="sub">Délai médian d&apos;accusé de lecture des alertes (minutes)</p>
          <LineChart
            labels={eng.map((e) => formatDate(e.week, 'fr', 'short'))}
            min={0}
            max={100}
            series={[
              { label: 'Adoption (%)', color: 'var(--primary)', values: eng.map((e) => e.adoption) },
              { label: 'Délai médian (min)', color: 'var(--event)', values: eng.map((e) => e.ackMedianMinutes), dashed: true },
            ]}
          />
          <p className="tiny muted">Montant moyen par paiement encaissé : {formatMoney(Math.round(pay.collected / Math.max(1, pay.paid)))}</p>
        </section>
      </div>
    </>
  );
}
