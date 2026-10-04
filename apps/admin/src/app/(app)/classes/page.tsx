'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { absencesByClass, getTeacher, teacherDisplayName } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Badge, PageHead, Progress } from '@/components/ui';

export default function Classes() {
  const { db } = useAdmin();
  const [level, setLevel] = useState<'all' | 'primaire' | 'college' | 'lycee'>('all');
  const abs = useMemo(() => new Map(absencesByClass(db).map((a) => [a.classId, a])), [db]);
  const classes = db.classes.filter((c) => level === 'all' || c.level === level);
  return (
    <>
      <PageHead title="Classes" subtitle={`${db.classes.length} classes · primaire, collège et lycée`} />
      <div className="row wrap" style={{ marginBottom: 16 }}>
        {(['all', 'primaire', 'college', 'lycee'] as const).map((l) => (
          <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)} aria-pressed={level === l}>
            {l === 'all' ? 'Toutes' : l === 'primaire' ? 'Primaire' : l === 'college' ? 'Collège' : 'Lycée'}
          </button>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {classes.map((c, i) => {
          const a = abs.get(c.id);
          const rate = a ? Math.round((1 - a.absences / a.size) * 100) : 100;
          return (
            <Link key={c.id} href={`/students?q=${encodeURIComponent(c.name)}`} className="card fade-in" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
              <div className="row between">
                <h2 style={{ margin: 0 }}>{c.name}</h2>
                <Badge tone={c.level === 'primaire' ? 'info' : c.level === 'college' ? 'academic' : 'neutral'}>{c.level === 'primaire' ? 'Primaire' : c.level === 'college' ? 'Collège' : 'Lycée'}</Badge>
              </div>
              <p className="sub" style={{ margin: '6px 0 12px' }}>
                Prof. principal : {teacherDisplayName(getTeacher(db, c.homeroomTeacherId))} · Salle {c.room}
              </p>
              <div className="row between tiny">
                <span>👥 {c.studentCount} élèves</span>
                <span>📊 Moyenne {c.average.toFixed(1)}</span>
              </div>
              <div className="row between tiny" style={{ marginTop: 10 }}>
                <span>Présence aujourd&apos;hui</span>
                <strong>{rate}%</strong>
              </div>
              <Progress value={rate / 100} color={rate < 92 ? 'var(--warning)' : 'var(--success)'} />
              {a && (a.absences || a.late) ? (
                <div className="row tiny" style={{ marginTop: 8 }}>
                  {a.absences ? <Badge tone="error">{a.absences} absent(s)</Badge> : null}
                  {a.late ? <Badge tone="warning">{a.late} retard(s)</Badge> : null}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </>
  );
}
