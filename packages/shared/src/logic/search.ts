import type { EduLinkDatabase, Locale, User } from '../types';
import { formatDate } from '../dates';
import { canViewStudent } from './permissions';
import { formatScore, getStudent, normalize, subjectName } from './lookup';

export type SearchGroup = 'grades' | 'documents' | 'messages' | 'events' | 'news' | 'homework' | 'announcements' | 'pages';

export interface SearchResult {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  link: string;
}

/** Shortcuts so that "transport", "bulletin", "cantine"… lead straight to the module. */
const PAGES: { keywords: string[]; title: string; link: string }[] = [
  { keywords: ['transport', 'bus', 'chauffeur'], title: 'Transport scolaire', link: '/transport' },
  { keywords: ['bulletin', 'trimestre', 'report'], title: 'Bulletins scolaires', link: '/report-cards' },
  { keywords: ['cantine', 'menu', 'repas', 'allergie'], title: 'Cantine', link: '/canteen' },
  { keywords: ['presence', 'absence', 'retard', 'justifier'], title: 'Présence', link: '/attendance' },
  { keywords: ['paiement', 'facture', 'frais'], title: 'Paiements & frais scolaires', link: '/payments' },
  { keywords: ['emploi du temps', 'horaire', 'cours'], title: 'Emploi du temps', link: '/timetable' },
  { keywords: ['club', 'activite', 'robotique', 'football', 'theatre'], title: 'Clubs & activités', link: '/clubs' },
  { keywords: ['rendez-vous', 'rdv', 'reunion'], title: 'Rendez-vous enseignants', link: '/appointments' },
  { keywords: ['controle', 'examen', 'evaluation'], title: 'Contrôles & examens', link: '/exams' },
  { keywords: ['observation', 'comportement', 'suivi'], title: 'Suivi & observations', link: '/behavior' },
];

/**
 * Universal search, scoped to what the user may see (parents: their children only).
 */
export function searchAll(db: EduLinkDatabase, user: Pick<User, 'id' | 'role'>, studentIds: string[], query: string, locale: Locale): SearchResult[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const has = (...fields: (string | undefined)[]) => fields.some((f) => f && normalize(f).includes(q));
  const results: SearchResult[] = [];
  const allowed = studentIds.filter((id) => canViewStudent(db, user, id));
  const students = allowed.map((id) => getStudent(db, id)!).filter(Boolean);
  const classIds = students.map((s) => s.classId);

  for (const p of PAGES) {
    if (p.keywords.some((k) => normalize(k).includes(q) || q.includes(normalize(k))) || has(p.title)) {
      results.push({ id: `page-${p.link}`, group: 'pages', title: p.title, subtitle: '', link: p.link });
    }
  }

  for (const s of students) {
    if (has(s.firstName, s.lastName)) {
      results.push({ id: `student-${s.id}`, group: 'pages', title: `${s.firstName} ${s.lastName}`, subtitle: 'Profil élève', link: `/child/${s.id}` });
    }
  }

  for (const g of db.grades.filter((x) => allowed.includes(x.studentId))) {
    const subj = subjectName(g.subjectId, locale);
    const owner = students.find((s) => s.id === g.studentId);
    if (has(subj, g.examName, g.comment, owner?.firstName)) {
      results.push({ id: g.id, group: 'grades', title: `${subj} — ${formatScore(g.score)}/${g.outOf}`, subtitle: `${owner?.firstName} · ${g.examName}`, link: `/grades/${g.subjectId}` });
    }
  }

  for (const h of db.homework.filter((x) => classIds.includes(x.classId))) {
    const subj = subjectName(h.subjectId, locale);
    if (has(subj, h.title, h.description)) {
      results.push({ id: h.id, group: 'homework', title: `${subj} — ${h.title}`, subtitle: formatDate(h.dueDate, locale, 'weekday'), link: `/homework/${h.id}` });
    }
  }

  for (const d of db.documents.filter((x) => (x.studentId ? allowed.includes(x.studentId) : !x.classIds || x.classIds.some((c) => classIds.includes(c))))) {
    if (has(d.title, d.sharedBy)) {
      results.push({ id: d.id, group: 'documents', title: d.title, subtitle: formatDate(d.date, locale, 'short'), link: '/documents' });
    }
  }

  const myConversations = db.conversations.filter((c) => c.participantIds.includes(user.id));
  for (const c of myConversations) {
    const msgs = db.messages.filter((m) => m.conversationId === c.id);
    const hit = msgs.find((m) => has(m.body));
    if (has(c.title, c.subtitle) || hit) {
      results.push({ id: c.id, group: 'messages', title: c.title, subtitle: hit ? hit.body : c.subtitle, link: `/chat/${c.id}` });
    }
  }

  for (const e of db.events.filter((x) => x.classIds.length === 0 || x.classIds.some((c) => classIds.includes(c)))) {
    if (has(e.title, e.description, e.location, e.category === 'trip' ? 'sortie scolaire' : '')) {
      results.push({ id: e.id, group: 'events', title: `${e.emoji} ${e.title}`, subtitle: formatDate(e.date, locale, 'weekday'), link: `/events/${e.id}` });
    }
  }

  for (const n of db.news) {
    if (has(n.title, n.excerpt)) {
      results.push({ id: n.id, group: 'news', title: n.title, subtitle: n.excerpt, link: `/news/${n.id}` });
    }
  }

  for (const a of db.announcements.filter((x) => x.scope === 'school' || x.classIds.some((c) => classIds.includes(c)))) {
    if (has(a.title, a.body)) {
      results.push({ id: a.id, group: 'announcements', title: a.title, subtitle: a.authorName, link: '/announcements' });
    }
  }

  return results;
}

export const SEARCH_GROUP_ORDER: SearchGroup[] = ['pages', 'grades', 'homework', 'documents', 'messages', 'events', 'news', 'announcements'];
