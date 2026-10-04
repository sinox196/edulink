'use client';

import type { Locale, SchoolModules } from '@edulink/shared';
import { useAdmin } from '@/lib/store';
import { Field, PageHead, Switch } from '@/components/ui';

const MODULES: [keyof SchoolModules, string, string][] = [
  ['payments', 'Paiements', 'Frais de scolarité, cantine, sorties — reçus et relances'],
  ['transport', 'Transport scolaire', 'Suivi des bus et notifications aux familles'],
  ['canteen', 'Cantine', 'Menus, allergies et préférences alimentaires'],
  ['clubs', 'Clubs & activités', 'Inscriptions et listes d’attente'],
  ['appointments', 'Rendez-vous enseignants', 'Créneaux réservables par les parents'],
  ['qrCheckIn', 'Pointage QR / RFID / NFC', 'Entrées et sorties horodatées automatiquement'],
  ['voiceMessages', 'Messages vocaux', 'Autoriser les messages audio dans la messagerie'],
];

export default function Settings() {
  const { db, setModule, setMessaging, setPrimaryLanguage, notify } = useAdmin();
  const m = db.school.messaging;
  return (
    <>
      <PageHead title="Paramètres de l'établissement" subtitle="Modules, messagerie, langue — chaque modification est journalisée" />
      <div className="grid two">
        <section className="card">
          <h2>Modules</h2>
          <p className="sub">Activez uniquement les services proposés par votre école</p>
          <div className="stack">
            {MODULES.map(([k, label, desc]) => (
              <div key={k} className="row between">
                <div>
                  <strong>{label}</strong>
                  <div className="tiny muted">{desc}</div>
                </div>
                <Switch checked={db.school.modules[k]} label={label} onChange={(v) => { setModule(k, v); notify(`${label} ${v ? 'activé' : 'désactivé'}.`); }} />
              </div>
            ))}
          </div>
        </section>
        <section className="stack">
          <div className="card">
            <h2>Messagerie</h2>
            <p className="sub">Contrôle des permissions de communication</p>
            <div className="stack">
              {(
                [
                  ['parentToTeacher', 'Parents → enseignants'],
                  ['parentToStaff', 'Parents → administration, transport, comptabilité'],
                  ['studentMessaging', 'Messagerie élèves ↔ enseignants'],
                  ['attachments', 'Pièces jointes (images, documents)'],
                ] as const
              ).map(([k, label]) => (
                <div key={k} className="row between">
                  <strong>{label}</strong>
                  <Switch checked={m[k]} label={label} onChange={(v) => { setMessaging({ [k]: v }); notify('Permissions de messagerie mises à jour.'); }} />
                </div>
              ))}
              <div className="grid two">
                <Field label="Heures calmes — début">
                  <input className="input" type="time" value={m.quietHours.start} onChange={(e) => setMessaging({ quietHours: { ...m.quietHours, start: e.target.value } })} />
                </Field>
                <Field label="Heures calmes — fin">
                  <input className="input" type="time" value={m.quietHours.end} onChange={(e) => setMessaging({ quietHours: { ...m.quietHours, end: e.target.value } })} />
                </Field>
              </div>
            </div>
          </div>
          <div className="card">
            <h2>Langue principale</h2>
            <p className="sub">Les familles peuvent choisir leur langue (français, arabe avec RTL, anglais)</p>
            <select className="select" value={db.school.primaryLanguage} onChange={(e) => { setPrimaryLanguage(e.target.value as Locale); notify('Langue principale mise à jour.'); }} aria-label="Langue principale">
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="card">
            <h2>Sécurité</h2>
            <ul className="tiny" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.8 }}>
              <li>Contrôle d’accès par rôle appliqué dans PostgreSQL (Row Level Security)</li>
              <li>Sessions JWT courtes + refresh tokens à rotation, verrouillage après 5 échecs</li>
              <li>Documents stockés chiffrés, liens signés à durée limitée</li>
              <li>Journal d’audit en ajout seul sur les données sensibles</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
