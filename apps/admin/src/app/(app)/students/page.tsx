'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { attendanceOn, formatDate, getClass, normalize, parentsOf, type Student } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Avatar, Badge, Field, Overlay, PageHead } from '@/components/ui';

const PAGE = 25;
const STATUS: Record<string, [string, 'success' | 'warning' | 'error' | 'info' | 'neutral']> = {
  present: ['✅ Présent', 'success'],
  late: ['⏰ Retard', 'warning'],
  absent: ['🔴 Absent', 'error'],
  excused: ['🔵 Justifiée', 'info'],
  unexcused: ['🔴 Non justifiée', 'error'],
  early_leave: ['🟣 Sortie anticipée', 'neutral'],
};

function StudentsInner() {
  const { db, addStudent, notify } = useAdmin();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [level, setLevel] = useState('all');
  const [classId, setClassId] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Student | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => setQ(params.get('q') ?? ''), [params]);
  useEffect(() => setPage(0), [q, level, classId]);

  const rows = useMemo(() => {
    const nq = normalize(q.trim());
    return db.students
      .filter((s) => {
        const cls = getClass(db, s.classId);
        if (level !== 'all' && cls?.level !== level) return false;
        if (classId !== 'all' && s.classId !== classId) return false;
        return !nq || normalize(`${s.firstName} ${s.lastName} ${s.studentNumber} ${cls?.name}`).includes(nq);
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
  }, [db, q, level, classId]);
  const pageRows = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <PageHead title="Élèves" subtitle={`${db.students.length.toLocaleString('fr-FR')} élèves inscrits · ${db.school.academicYear}`} actions={<button className="btn" onClick={() => setAdding(true)}>＋ Inscrire un élève</button>} />
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid three">
          <Field label="Recherche">
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, prénom, matricule, classe…" />
          </Field>
          <Field label="Cycle">
            <select className="select" value={level} onChange={(e) => { setLevel(e.target.value); setClassId('all'); }}>
              <option value="all">Tous les cycles</option>
              <option value="primaire">Primaire</option>
              <option value="college">Collège</option>
              <option value="lycee">Lycée</option>
            </select>
          </Field>
          <Field label="Classe">
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="all">Toutes les classes</option>
              {db.classes.filter((c) => level === 'all' || c.level === level).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Matricule</th>
              <th>Classe</th>
              <th>Présence aujourd&apos;hui</th>
              <th>Responsable</th>
              <th>Application</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => {
              const rec = attendanceOn(db, s.id);
              const parent = parentsOf(db, s.id)[0];
              const st = rec ? STATUS[rec.status] : undefined;
              return (
                <tr key={s.id} onClick={() => setSelected(s)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(s)}>
                  <td>
                    <div className="row">
                      <Avatar name={`${s.firstName} ${s.lastName}`} color={s.avatarColor} />
                      <strong>
                        {s.lastName} {s.firstName}
                      </strong>
                    </div>
                  </td>
                  <td className="muted">{s.studentNumber}</td>
                  <td>{getClass(db, s.classId)?.name}</td>
                  <td>{st ? <Badge tone={st[1]}>{st[0]}</Badge> : <span className="muted">—</span>}</td>
                  <td className="muted">{parent ? `${parent.title ?? ''} ${parent.firstName} ${parent.lastName}` : '—'}</td>
                  <td>{parent?.activated ? <Badge tone="success">Activée</Badge> : <Badge tone="neutral">Invitation envoyée</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pager">
          <span>
            {rows.length ? page * PAGE + 1 : 0}–{Math.min(rows.length, (page + 1) * PAGE)} sur {rows.length.toLocaleString('fr-FR')}
          </span>
          <div className="row">
            <button className="btn secondary sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← Précédent
            </button>
            <button className="btn secondary sm" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage((p) => p + 1)}>
              Suivant →
            </button>
          </div>
        </div>
      </div>

      <Overlay open={!!selected} onClose={() => setSelected(null)} label="Fiche élève">
        {selected ? <StudentDetail s={selected} onClose={() => setSelected(null)} /> : null}
      </Overlay>

      <Overlay open={adding} onClose={() => setAdding(false)} variant="modal" label="Inscrire un élève">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const s = addStudent({ firstName: String(f.get('firstName')), lastName: String(f.get('lastName')), gender: f.get('gender') === 'M' ? 'M' : 'F', classId: String(f.get('classId')), parentEmail: String(f.get('parentEmail')) });
            setAdding(false);
            notify(`${s.firstName} ${s.lastName} inscrit(e) — invitation envoyée au responsable.`);
          }}
        >
          <h2 style={{ margin: 0 }}>Inscrire un élève</h2>
          <div className="grid two">
            <Field label="Prénom">
              <input className="input" name="firstName" required />
            </Field>
            <Field label="Nom">
              <input className="input" name="lastName" required />
            </Field>
          </div>
          <div className="grid two">
            <Field label="Genre">
              <select className="select" name="gender">
                <option value="F">Fille</option>
                <option value="M">Garçon</option>
              </select>
            </Field>
            <Field label="Classe">
              <select className="select" name="classId" defaultValue="cls-6-b">
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="E-mail du responsable légal">
            <input className="input" name="parentEmail" type="email" required />
          </Field>
          <p className="tiny muted" style={{ margin: 0 }}>
            Le responsable recevra un code d&apos;activation par e-mail et SMS. Il n&apos;aura accès qu&apos;aux informations de cet élève.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn secondary" onClick={() => setAdding(false)}>
              Annuler
            </button>
            <button className="btn" type="submit">
              Inscrire
            </button>
          </div>
        </form>
      </Overlay>
    </>
  );
}

function StudentDetail({ s, onClose }: { s: Student; onClose: () => void }) {
  const { db, logAccess } = useAdmin();
  useEffect(() => {
    logAccess(`${s.firstName} ${s.lastName} (${s.studentNumber})`);
  }, [s.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const cls = getClass(db, s.classId);
  const parents = parentsOf(db, s.id);
  const rec = attendanceOn(db, s.id);
  const payments = db.payments.filter((p) => p.studentId === s.id);
  return (
    <div className="stack">
      <div className="row between">
        <div className="row">
          <Avatar name={`${s.firstName} ${s.lastName}`} color={s.avatarColor} />
          <div>
            <h2 style={{ margin: 0 }}>
              {s.firstName} {s.lastName}
            </h2>
            <span className="muted tiny">
              {s.studentNumber} · {cls?.name} · né(e) le {formatDate(s.birthDate, 'fr', 'numeric')}
            </span>
          </div>
        </div>
        <button className="btn secondary sm" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>
      <div className="card">
        <h2>Aujourd&apos;hui</h2>
        {rec ? (
          <div className="row wrap">
            <Badge tone={STATUS[rec.status][1]}>{STATUS[rec.status][0]}</Badge>
            <span className="muted tiny">
              Entrée {rec.checkIn ?? '—'} · Sortie {rec.checkOut ?? '—'} · source : {rec.source}
            </span>
          </div>
        ) : (
          <span className="muted">Aucun pointage</span>
        )}
      </div>
      <div className="card">
        <h2>Responsables légaux</h2>
        <div className="stack" style={{ marginTop: 8 }}>
          {parents.map((p) => (
            <div key={p.id} className="row between">
              <span>
                <strong>
                  {p.title} {p.firstName} {p.lastName}
                </strong>
                <div className="tiny muted">
                  {p.email} · {p.phone ?? '—'}
                </div>
              </span>
              {p.activated ? <Badge tone="success">App activée</Badge> : <Badge tone="neutral">Non activée</Badge>}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Paiements</h2>
        <div className="stack" style={{ marginTop: 8, gap: 8 }}>
          {payments.map((p) => (
            <div key={p.id} className="row between tiny">
              <span>{p.label}</span>
              <Badge tone={p.status === 'paid' ? 'success' : p.status === 'overdue' ? 'error' : 'warning'}>{p.status === 'paid' ? 'Payé' : p.status === 'overdue' ? 'En retard' : 'À payer'}</Badge>
            </div>
          ))}
        </div>
      </div>
      <p className="tiny muted">🔒 Accès journalisé — consultation enregistrée dans le journal d&apos;audit.</p>
    </div>
  );
}

export default function Students() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 400 }} />}>
      <StudentsInner />
    </Suspense>
  );
}
