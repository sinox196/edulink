'use client';

import { useState } from 'react';
import { getClass, normalize, subjectName } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Avatar, Badge, PageHead, Switch } from '@/components/ui';

export default function Teachers() {
  const { db, setTeacherMessages, notify } = useAdmin();
  const [q, setQ] = useState('');
  const rows = db.teachers.filter((t) => !q || normalize(`${t.firstName} ${t.lastName} ${subjectName(t.subjectIds[0], 'fr')}`).includes(normalize(q)));
  return (
    <>
      <PageHead title="Enseignants" subtitle={`${db.teachers.length} enseignants · accès limité à leurs classes`} />
      <input className="input" style={{ maxWidth: 340, marginBottom: 12 }} placeholder="Nom ou matière…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un enseignant" />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Enseignant</th>
              <th>Matière</th>
              <th>Classes autorisées</th>
              <th>Messages des parents</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const u = db.users.find((x) => x.id === t.userId);
              return (
                <tr key={t.id}>
                  <td>
                    <div className="row">
                      <Avatar name={`${t.firstName} ${t.lastName}`} color={u?.avatarColor ?? '#2563EB'} />
                      <div>
                        <strong>
                          {t.title} {t.firstName} {t.lastName}
                        </strong>
                        <div className="tiny muted">{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone="academic">{subjectName(t.subjectIds[0], 'fr')}</Badge>
                  </td>
                  <td className="tiny">{t.classIds.map((c) => getClass(db, c)?.name).join(' · ')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={t.acceptsMessages}
                      label={`Messages des parents pour ${t.lastName}`}
                      onChange={(v) => {
                        setTeacherMessages(t.id, v);
                        notify(`Messagerie ${v ? 'activée' : 'désactivée'} pour ${t.title} ${t.lastName}.`);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
