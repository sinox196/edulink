'use client';

import { formatDate } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Badge, PageHead } from '@/components/ui';

export default function Audit() {
  const { db } = useAdmin();
  return (
    <>
      <PageHead title="Journal d'audit" subtitle="Traçabilité des accès et des modifications (ajout seul — non modifiable)" />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Acteur</th>
              <th>Action</th>
              <th>Cible</th>
            </tr>
          </thead>
          <tbody>
            {db.auditLogs.map((l) => (
              <tr key={l.id}>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {formatDate(l.at.slice(0, 10), 'fr', 'numeric')} {l.at.slice(11, 16)}
                </td>
                <td>
                  <strong>{l.actorName}</strong>
                </td>
                <td>{/échec|verrouillé/i.test(l.action) ? <Badge tone="error">{l.action}</Badge> : l.action}</td>
                <td className="muted">{l.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
