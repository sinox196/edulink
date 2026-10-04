import type {
  Announcement,
  AppNotification,
  Appointment,
  AppointmentSlot,
  AuditLog,
  Bus,
  BusAssignment,
  CanteenMenu,
  Club,
  ClubRegistration,
  Conversation,
  DietaryProfile,
  EventParticipation,
  Message,
  NewsArticle,
  Payment,
  SchoolDocument,
  SchoolEvent,
  Student,
  TransportLiveStatus,
  TransportRoute,
} from '../types';
import { createRng } from '../rng';
import {
  ADAM_ID,
  ADMIN_ID,
  PARENT_ID,
  SARAH_ID,
  SARAH_USER_ID,
  STAFF_ACCOUNTING,
  STAFF_TRANSPORT,
  STAFF_VIE_SCOLAIRE,
  teacherUserId,
} from './directory';

/* ------------------------------------------------------------------------------ */
/* Announcements                                                                   */

export function buildAnnouncements(): Announcement[] {
  return [
    {
      id: 'ann-elections',
      title: 'Fermeture exceptionnelle de l\'établissement',
      body: "L'école sera exceptionnellement fermée vendredi 27 novembre en raison des élections. Les cours reprendront normalement le lundi 30 novembre. Le service de transport et la cantine ne fonctionneront pas ce jour-là.",
      publishedAt: '2026-11-16T09:00:00',
      authorId: ADMIN_ID,
      authorName: 'Mme Nadia Chaabane — Direction',
      scope: 'school',
      classIds: [],
      category: 'closure',
      priority: 'critical',
      requiresAck: true,
      acknowledgedBy: Array.from({ length: 784 }, (_, i) => `u-par-${String(i + 1).padStart(4, '0')}`),
      recipientCount: 1032,
    },
    {
      id: 'ann-fire-drill',
      title: 'Exercice de sécurité incendie',
      body: 'Un exercice d\'évacuation aura lieu jeudi 19 novembre à 10:30. Il s\'agit d\'un exercice prévu : aucune inquiétude à avoir si vos enfants vous en parlent.',
      publishedAt: '2026-11-13T11:00:00',
      authorId: ADMIN_ID,
      authorName: 'Direction',
      scope: 'school',
      classIds: [],
      category: 'security',
      priority: 'important',
      requiresAck: false,
      acknowledgedBy: [],
      recipientCount: 1032,
    },
    {
      id: 'ann-teacher-absence',
      title: 'Absence de M. Gharbi mardi 17 novembre',
      body: 'Le cours de sciences de 14:30 sera remplacé par une étude surveillée en salle A04. Les élèves peuvent avancer la fiche sur les mélanges.',
      publishedAt: '2026-11-16T12:10:00',
      authorId: STAFF_VIE_SCOLAIRE,
      authorName: 'Vie scolaire',
      scope: 'class',
      classIds: ['cls-6-b'],
      category: 'teacher_absence',
      priority: 'normal',
      requiresAck: false,
      acknowledgedBy: [],
      recipientCount: 52,
    },
    {
      id: 'ann-timetable',
      title: "Changement d'emploi du temps — 6ème B",
      body: "À partir du jeudi 26 novembre, le cours d'Arts plastiques du jeudi est déplacé de 14:30 à 15:30 (échange avec l'anglais).",
      publishedAt: '2026-11-12T16:00:00',
      authorId: STAFF_VIE_SCOLAIRE,
      authorName: 'Vie scolaire',
      scope: 'class',
      classIds: ['cls-6-b'],
      category: 'timetable',
      priority: 'normal',
      requiresAck: false,
      acknowledgedBy: [],
      recipientCount: 52,
    },
    {
      id: 'ann-bus7',
      title: 'Retard du bus N°7',
      body: 'En raison de travaux sur la route de la Marsa, le bus N°7 aura environ 15 minutes de retard ce matin. Les élèves concernés ne seront pas comptés en retard.',
      publishedAt: '2026-11-16T07:20:00',
      authorId: STAFF_TRANSPORT,
      authorName: 'Service transport',
      scope: 'school',
      classIds: [],
      category: 'transport',
      priority: 'normal',
      requiresAck: false,
      acknowledgedBy: [],
      recipientCount: 210,
    },
    {
      id: 'ann-reinscriptions',
      title: 'Réinscriptions 2027-2028',
      body: 'Les réinscriptions pour l\'année 2027-2028 ouvriront le 1er décembre directement depuis l\'application, rubrique Documents.',
      publishedAt: '2026-11-10T10:00:00',
      authorId: ADMIN_ID,
      authorName: 'Administration',
      scope: 'school',
      classIds: [],
      category: 'administrative',
      priority: 'normal',
      requiresAck: false,
      acknowledgedBy: [],
      recipientCount: 1032,
    },
  ];
}

/* ------------------------------------------------------------------------------ */
/* News                                                                            */

export function buildNews(): NewsArticle[] {
  return [
    {
      id: 'news-library',
      title: 'Nouvelle bibliothèque scolaire',
      excerpt: 'Notre nouvelle bibliothèque ouvre ses portes lundi 23 novembre : 4 000 ouvrages, un espace numérique et un coin lecture.',
      body: "Notre nouvelle bibliothèque ouvre ses portes lundi 23 novembre. Plus de 4 000 ouvrages, un espace numérique de 12 postes et un coin lecture pour les plus jeunes attendent les élèves.\n\nLes horaires : du lundi au vendredi de 08:00 à 17:00, le mercredi jusqu'à 12:30. Chaque classe bénéficiera d'un créneau hebdomadaire accompagné par Mme Saidi, notre professeure documentaliste.\n\nUne inauguration ouverte aux familles aura lieu le samedi 28 novembre à 10:00.",
      publishedAt: '2026-11-13',
      category: 'school',
      cover: { from: '#2563EB', to: '#14B8A6', icon: 'library-outline' },
      readMinutes: 2,
    },
    {
      id: 'news-robotics',
      title: 'Champions régionaux de robotique',
      excerpt: 'L\'équipe du club robotique remporte la première place au concours régional de Tunis.',
      body: "Bravo à l'équipe du club robotique qui a remporté la première place au concours régional de Tunis avec son robot trieur de déchets. Les six élèves, encadrés par M. Gharbi, représenteront l'école lors de la finale nationale en mars.",
      publishedAt: '2026-11-09',
      category: 'activities',
      cover: { from: '#7C3AED', to: '#2563EB', icon: 'hardware-chip-outline' },
      readMinutes: 1,
    },
    {
      id: 'news-football',
      title: 'Tournoi inter-classes de football',
      excerpt: 'Les inscriptions des équipes du collège sont ouvertes jusqu\'au 20 novembre.',
      body: "Le tournoi inter-classes de football du collège se déroulera pendant les pauses déjeuner du 23 novembre au 11 décembre. Chaque classe peut inscrire une équipe mixte de 7 joueurs auprès de M. Jebali avant le 20 novembre.",
      publishedAt: '2026-11-06',
      category: 'sport',
      cover: { from: '#F97316', to: '#F59E0B', icon: 'football-outline' },
      readMinutes: 1,
    },
    {
      id: 'news-theatre',
      title: 'Atelier théâtre : inscriptions ouvertes',
      excerpt: 'Un nouvel atelier théâtre le vendredi soir pour les élèves de la 6ème à la 4ème.',
      body: "M. Trabelsi anime cette année un atelier théâtre le vendredi de 16:30 à 18:00. Au programme : improvisation, mise en voix et préparation d'une pièce présentée lors du spectacle de fin d'année.",
      publishedAt: '2026-11-04',
      category: 'culture',
      cover: { from: '#EC4899', to: '#7C3AED', icon: 'film-outline' },
      readMinutes: 1,
    },
    {
      id: 'news-farm',
      title: '6ème B : visite de la ferme pédagogique',
      excerpt: 'Retour en images sur la sortie de la classe à la ferme pédagogique de Mornag.',
      body: "Les élèves de 6ème B ont découvert la ferme pédagogique de Mornag dans le cadre du programme de sciences : observation des animaux, atelier semis et découverte du compost. Merci aux parents accompagnateurs !",
      publishedAt: '2026-10-15',
      category: 'class',
      cover: { from: '#22C55E', to: '#14B8A6', icon: 'leaf-outline' },
      readMinutes: 1,
    },
    {
      id: 'news-councils',
      title: 'Calendrier des conseils de classe',
      excerpt: 'Les conseils de classe du premier trimestre auront lieu du 7 au 11 décembre.',
      body: 'Les conseils de classe du premier trimestre se tiendront du 7 au 11 décembre. Les bulletins seront publiés dans l\'application le vendredi 11 décembre.',
      publishedAt: '2026-11-02',
      category: 'administrative',
      cover: { from: '#0EA5E9', to: '#2563EB', icon: 'document-text-outline' },
      readMinutes: 1,
    },
  ];
}

/* ------------------------------------------------------------------------------ */
/* Events                                                                          */

export function buildEvents(): { events: SchoolEvent[]; participants: EventParticipation[] } {
  const events: SchoolEvent[] = [
    { id: 'ev-show', title: 'Spectacle scolaire', emoji: '🎭', description: 'Les élèves du primaire et du collège présentent leurs créations : chorale, théâtre et danse. Ouvert aux familles.', date: '2026-11-18', time: '15:00', endTime: '17:00', location: 'Salle polyvalente', category: 'show', classIds: [], requiresAuthorization: false, organizer: 'Équipe pédagogique' },
    { id: 'ev-meeting', title: 'Réunion parents-professeurs', emoji: '👥', description: 'Rencontre avec l\'équipe pédagogique de la classe : bilan de début d\'année et échanges individuels.', date: '2026-11-20', time: '17:00', endTime: '19:00', location: 'Bâtiment A — salles du collège', category: 'meeting', classIds: ['cls-6-a', 'cls-6-b', 'cls-6-c', 'cls-3-a', 'cls-3-b', 'cls-3-c'], requiresAuthorization: false, organizer: 'Vie scolaire' },
    { id: 'ev-sport', title: 'Journée sportive', emoji: '🏃', description: 'Ateliers d\'athlétisme, relais et tournoi de handball. Prévoir une tenue de sport, une casquette et une gourde.', date: '2026-11-24', time: '08:30', endTime: '15:30', location: 'Stade municipal de La Marsa', category: 'sport', classIds: [], requiresAuthorization: true, organizer: 'M. Jebali' },
    { id: 'ev-forum', title: 'Forum des métiers', emoji: '🎓', description: 'Une vingtaine de professionnels présentent leur métier aux élèves de 3ème pour préparer l\'orientation.', date: '2026-11-26', time: '09:00', endTime: '12:00', location: 'CDI et salle polyvalente', category: 'culture', classIds: ['cls-3-a', 'cls-3-b', 'cls-3-c'], requiresAuthorization: false, organizer: 'M. Kacem' },
    { id: 'ev-bardo', title: 'Sortie au Musée du Bardo', emoji: '🏛️', description: 'Visite guidée des mosaïques romaines dans le cadre du programme d\'histoire. Départ en bus à 08:30, retour à 13:00.', date: '2026-12-03', time: '08:30', endTime: '13:00', location: 'Musée national du Bardo', category: 'trip', classIds: ['cls-6-a', 'cls-6-b'], requiresAuthorization: true, cost: 25, organizer: 'Mme Dupont' },
    { id: 'ev-science', title: 'Fête de la science', emoji: '🔬', description: 'Expériences, stands et démonstrations préparés par les élèves.', date: '2026-12-10', time: '13:30', endTime: '16:30', location: 'Laboratoires — Bâtiment B', category: 'culture', classIds: [], requiresAuthorization: false, organizer: 'M. Gharbi' },
    { id: 'ev-market', title: 'Marché solidaire d\'hiver', emoji: '❄️', description: 'Vente d\'objets réalisés par les élèves au profit d\'une association locale.', date: '2026-12-17', time: '15:00', endTime: '18:00', location: 'Cour principale', category: 'ceremony', classIds: [], requiresAuthorization: false, organizer: 'Association des parents' },
    { id: 'ev-cross', title: 'Cross du collège', emoji: '👟', description: 'Course solidaire de rentrée.', date: '2026-10-09', time: '09:00', endTime: '12:00', location: 'Parc du Belvédère', category: 'sport', classIds: [], requiresAuthorization: true, organizer: 'M. Jebali' },
  ];

  const participants: EventParticipation[] = [
    { eventId: 'ev-show', studentId: SARAH_ID, response: 'yes' },
    { eventId: 'ev-sport', studentId: SARAH_ID, response: 'yes', authorizationSignedAt: '2026-11-14T20:12:00', signedBy: PARENT_ID },
    { eventId: 'ev-bardo', studentId: SARAH_ID },
    { eventId: 'ev-cross', studentId: SARAH_ID, response: 'yes', authorizationSignedAt: '2026-10-02T19:00:00', signedBy: PARENT_ID },
    { eventId: 'ev-forum', studentId: ADAM_ID, response: 'yes' },
  ];
  return { events, participants };
}

/* ------------------------------------------------------------------------------ */
/* Messaging                                                                       */

export function buildMessaging(): { conversations: Conversation[]; messages: Message[] } {
  const bs = teacherUserId('t-bensalem');
  const tr = teacherUserId('t-trabelsi');
  const kc = teacherUserId('t-kacem');
  const conversations: Conversation[] = [
    { id: 'conv-bensalem', category: 'teacher', participantIds: [PARENT_ID, bs], studentId: SARAH_ID, title: 'Mme Ben Salem', subtitle: 'Professeure de Mathématiques', avatarColor: '#2563EB' },
    { id: 'conv-vs', category: 'administration', participantIds: [PARENT_ID, STAFF_VIE_SCOLAIRE], studentId: SARAH_ID, title: 'Vie scolaire', subtitle: 'Administration', avatarColor: '#0EA5E9' },
    { id: 'conv-trabelsi', category: 'teacher', participantIds: [PARENT_ID, tr], studentId: SARAH_ID, title: 'M. Trabelsi', subtitle: 'Professeur de Français · Professeur principal', avatarColor: '#7C3AED' },
    { id: 'conv-transport', category: 'transport', participantIds: [PARENT_ID, STAFF_TRANSPORT], title: 'Transport scolaire', subtitle: 'Bus N°4', avatarColor: '#F59E0B' },
    { id: 'conv-compta', category: 'accounting', participantIds: [PARENT_ID, STAFF_ACCOUNTING], title: 'Comptabilité', subtitle: 'Frais de scolarité', avatarColor: '#22C55E' },
    { id: 'conv-kacem', category: 'teacher', participantIds: [PARENT_ID, kc], studentId: ADAM_ID, title: 'M. Kacem', subtitle: 'Professeur de Mathématiques · Professeur principal', avatarColor: '#0F766E' },
  ];

  const messages: Message[] = [
    { id: 'm1', conversationId: 'conv-bensalem', senderId: PARENT_ID, body: "Bonjour Madame, je voudrais avoir plus d'informations concernant le dernier contrôle de Sarah.", sentAt: '2026-11-13T18:02:00', readAt: '2026-11-14T08:10:00' },
    { id: 'm2', conversationId: 'conv-bensalem', senderId: bs, body: 'Bonjour Monsieur Ben Ali, bien sûr. Sarah a obtenu 17/20 au contrôle N°2 sur les fractions. Elle maîtrise très bien les calculs ; il reste quelques imprécisions dans la rédaction des problèmes. Je peux vous proposer un rendez-vous si vous le souhaitez.', sentAt: '2026-11-14T08:15:00', readAt: '2026-11-14T12:30:00' },
    { id: 'm3', conversationId: 'conv-bensalem', senderId: PARENT_ID, body: 'Merci beaucoup pour ce retour détaillé. Je vais réserver un créneau.', sentAt: '2026-11-14T12:32:00', readAt: '2026-11-14T13:00:00' },
    { id: 'm4', conversationId: 'conv-bensalem', senderId: bs, body: 'Je vous joins la fiche de révision pour le contrôle de mercredi. Bonne soirée !', sentAt: '2026-11-16T12:40:00', attachment: { id: 'att-rev', name: 'Fiche de révision — Contrôle N°3.pdf', kind: 'pdf', size: '320 Ko' } },
    { id: 'm5', conversationId: 'conv-vs', senderId: STAFF_VIE_SCOLAIRE, body: "Bonjour, nous n'avons pas encore reçu de justificatif pour l'absence de Sarah du mardi 10 novembre. Vous pouvez le transmettre directement depuis la rubrique Présence.", sentAt: '2026-11-12T09:30:00' },
    { id: 'm6', conversationId: 'conv-trabelsi', senderId: tr, body: 'Bonjour, je vous confirme la réunion parents-professeurs du vendredi 20 novembre à partir de 17:00.', sentAt: '2026-11-09T17:45:00', readAt: '2026-11-09T19:00:00' },
    { id: 'm7', conversationId: 'conv-trabelsi', senderId: PARENT_ID, body: 'Merci, nous serons présents.', sentAt: '2026-11-09T19:02:00', readAt: '2026-11-10T07:50:00' },
    { id: 'm8', conversationId: 'conv-transport', senderId: STAFF_TRANSPORT, body: 'Rappel : le bus N°4 partira à 16:40 précises. Merci de prévenir le service en cas d\'absence au retour.', sentAt: '2026-11-02T08:00:00', readAt: '2026-11-02T08:30:00' },
    { id: 'm9', conversationId: 'conv-compta', senderId: STAFF_ACCOUNTING, body: 'Bonjour, la facture de cantine du mois de novembre (95 DT) est disponible dans la rubrique Paiements.', sentAt: '2026-11-14T10:00:00', readAt: '2026-11-14T18:00:00' },
    { id: 'm10', conversationId: 'conv-kacem', senderId: kc, body: 'Bonjour, le brevet blanc aura lieu la semaine du 7 décembre. Adam est très investi, bravo à lui.', sentAt: '2026-11-10T16:20:00', readAt: '2026-11-10T20:00:00' },
  ];
  return { conversations, messages };
}

/* ------------------------------------------------------------------------------ */
/* Documents                                                                       */

export function buildDocuments(): SchoolDocument[] {
  return [
    { id: 'doc-rc-t3', title: 'Bulletin — Trimestre 3 (2025-2026)', category: 'report_card', date: '2026-06-26', size: '412 Ko', fileType: 'pdf', studentId: SARAH_ID, requiresSignature: false },
    { id: 'doc-cert', title: 'Certificat de scolarité 2026-2027', category: 'certificate', date: '2026-09-04', size: '88 Ko', fileType: 'pdf', studentId: SARAH_ID, requiresSignature: false },
    { id: 'doc-rules', title: 'Règlement intérieur 2026-2027', category: 'rules', date: '2026-09-01', size: '1,1 Mo', fileType: 'pdf', requiresSignature: true, signedAt: '2026-09-03T20:15:00', signedBy: PARENT_ID },
    { id: 'doc-auth-bardo', title: 'Autorisation — Sortie au Musée du Bardo', category: 'authorization', date: '2026-11-15', size: '64 Ko', fileType: 'pdf', classIds: ['cls-6-a', 'cls-6-b'], requiresSignature: true },
    { id: 'doc-auth-image', title: "Autorisation de droit à l'image", category: 'authorization', date: '2026-09-01', size: '52 Ko', fileType: 'pdf', requiresSignature: true, signedAt: '2026-09-03T20:18:00', signedBy: PARENT_ID },
    { id: 'doc-tt-6b', title: 'Emploi du temps — 6ème B', category: 'timetable', date: '2026-09-07', size: '120 Ko', fileType: 'pdf', classIds: ['cls-6-b'], requiresSignature: false },
    { id: 'doc-inv-t1', title: 'Facture — Frais de scolarité T1', category: 'invoice', date: '2026-10-01', size: '74 Ko', fileType: 'pdf', studentId: SARAH_ID, requiresSignature: false },
    { id: 'doc-inv-canteen', title: 'Facture — Cantine novembre', category: 'invoice', date: '2026-11-14', size: '70 Ko', fileType: 'pdf', studentId: SARAH_ID, requiresSignature: false },
    { id: 'doc-ped-fractions', title: 'Fiche de révision — Fractions', category: 'pedagogical', date: '2026-11-16', size: '320 Ko', fileType: 'pdf', classIds: ['cls-6-b'], requiresSignature: false, sharedBy: 'Mme Ben Salem' },
    { id: 'doc-ped-method', title: 'Méthodologie : apprendre une leçon', category: 'pedagogical', date: '2026-09-10', size: '240 Ko', fileType: 'pdf', classIds: ['cls-6-a', 'cls-6-b', 'cls-6-c'], requiresSignature: false, sharedBy: 'M. Trabelsi' },
    { id: 'doc-3a-cert', title: 'Certificat de scolarité 2026-2027', category: 'certificate', date: '2026-09-04', size: '88 Ko', fileType: 'pdf', studentId: ADAM_ID, requiresSignature: false },
    { id: 'doc-3a-brevet', title: 'Annales du brevet 2026', category: 'pedagogical', date: '2026-11-10', size: '2,4 Mo', fileType: 'pdf', classIds: ['cls-3-a'], requiresSignature: false, sharedBy: 'Mme Rekik' },
  ];
}

/* ------------------------------------------------------------------------------ */
/* Payments                                                                        */

export function buildPayments(students: Student[], classLevel: (classId: string) => string): Payment[] {
  const payments: Payment[] = [
    { id: 'pay-s-t1', studentId: SARAH_ID, category: 'tuition', label: 'Frais de scolarité — Trimestre 1', amount: 450, dueDate: '2026-10-01', status: 'paid', paidAt: '2026-10-01', receiptNumber: 'REC-2026-10-0412', method: 'card' },
    { id: 'pay-s-books', studentId: SARAH_ID, category: 'books', label: 'Manuels scolaires 6ème', amount: 180, dueDate: '2026-09-05', status: 'paid', paidAt: '2026-09-02', receiptNumber: 'REC-2026-09-0188', method: 'card' },
    { id: 'pay-s-transport-nov', studentId: SARAH_ID, category: 'transport', label: 'Transport scolaire — novembre', amount: 60, dueDate: '2026-11-05', status: 'paid', paidAt: '2026-11-03', receiptNumber: 'REC-2026-11-0091', method: 'transfer' },
    { id: 'pay-s-club', studentId: SARAH_ID, category: 'activities', label: 'Club robotique — année', amount: 120, dueDate: '2026-10-15', status: 'paid', paidAt: '2026-10-10', receiptNumber: 'REC-2026-10-0733', method: 'card' },
    { id: 'pay-s-canteen-nov', studentId: SARAH_ID, category: 'canteen', label: 'Cantine — novembre', amount: 95, dueDate: '2026-11-20', status: 'pending' },
    { id: 'pay-s-bardo', studentId: SARAH_ID, category: 'trips', label: 'Sortie au Musée du Bardo', amount: 25, dueDate: '2026-11-30', status: 'pending' },
    { id: 'pay-s-t2', studentId: SARAH_ID, category: 'tuition', label: 'Frais de scolarité — Trimestre 2', amount: 450, dueDate: '2027-01-05', status: 'pending' },
    { id: 'pay-s-canteen-oct', studentId: SARAH_ID, category: 'canteen', label: 'Cantine — octobre', amount: 110, dueDate: '2026-10-20', status: 'paid', paidAt: '2026-10-18', receiptNumber: 'REC-2026-10-0902', method: 'card' },
    { id: 'pay-a-t1', studentId: ADAM_ID, category: 'tuition', label: 'Frais de scolarité — Trimestre 1', amount: 450, dueDate: '2026-10-01', status: 'paid', paidAt: '2026-10-01', receiptNumber: 'REC-2026-10-0413', method: 'card' },
    { id: 'pay-a-canteen-nov', studentId: ADAM_ID, category: 'canteen', label: 'Cantine — novembre', amount: 95, dueDate: '2026-11-20', status: 'pending' },
    { id: 'pay-a-transport-nov', studentId: ADAM_ID, category: 'transport', label: 'Transport scolaire — novembre', amount: 60, dueDate: '2026-11-05', status: 'paid', paidAt: '2026-11-03', receiptNumber: 'REC-2026-11-0092', method: 'transfer' },
  ];

  /* Tuition for the rest of the school: 29 families have not paid yet (32 pending in total). */
  const rng = createRng(450);
  const others = students.filter((s) => s.id !== SARAH_ID && s.id !== ADAM_ID);
  const unpaid = new Set(rng.shuffle(others.map((s) => s.id)).slice(0, 29));
  for (const s of others) {
    const level = classLevel(s.classId);
    const amount = level === 'primaire' ? 380 : level === 'college' ? 450 : 520;
    const isUnpaid = unpaid.has(s.id);
    payments.push({
      id: `pay-${s.id}-t1`,
      studentId: s.id,
      category: 'tuition',
      label: 'Frais de scolarité — Trimestre 1',
      amount,
      dueDate: '2026-10-01',
      status: isUnpaid ? 'overdue' : 'paid',
      paidAt: isUnpaid ? undefined : `2026-${rng.chance(0.8) ? '09' : '10'}-${String(rng.int(1, 28)).padStart(2, '0')}`,
      receiptNumber: isUnpaid ? undefined : `REC-2026-${String(rng.int(1000, 9999))}`,
      method: isUnpaid ? undefined : rng.pick(['card', 'transfer', 'cash', 'cheque'] as const),
    });
  }
  return payments;
}

/* ------------------------------------------------------------------------------ */
/* Transport                                                                       */

export function buildTransport(): { buses: Bus[]; routes: TransportRoute[]; assignments: BusAssignment[]; live: TransportLiveStatus[] } {
  const drivers = ['Ahmed', 'Mourad', 'Slim', 'Kamel', 'Nabil', 'Riadh', 'Hichem', 'Lotfi'];
  const buses: Bus[] = drivers.map((d, i) => ({ id: `bus-${i + 1}`, number: i + 1, driverFirstName: d, plate: `2${10 + i} TU ${8800 + i * 7}`, capacity: 30 }));
  // Bus N°4 is driven by Ahmed in the demo story.
  buses[3].driverFirstName = 'Ahmed';
  buses[0].driverFirstName = 'Mourad';

  const routes: TransportRoute[] = [
    {
      id: 'rt-4-am', busId: 'bus-4', name: 'Maison → École', direction: 'to_school',
      stops: [
        { id: 's1', name: 'La Marsa Plage', time: '07:22' },
        { id: 's2', name: 'Résidence Les Jasmins', time: '07:31' },
        { id: 's3', name: 'Sidi Daoud', time: '07:38' },
        { id: 's4', name: 'Gammarth Village', time: '07:45' },
        { id: 's5', name: 'École Horizon', time: '07:58' },
      ],
    },
    {
      id: 'rt-4-pm', busId: 'bus-4', name: 'École → Maison', direction: 'to_home',
      stops: [
        { id: 's5', name: 'École Horizon', time: '16:40' },
        { id: 's4', name: 'Gammarth Village', time: '16:52' },
        { id: 's3', name: 'Sidi Daoud', time: '16:58' },
        { id: 's2', name: 'Résidence Les Jasmins', time: '17:06' },
        { id: 's1', name: 'La Marsa Plage', time: '17:14' },
      ],
    },
  ];

  const assignments: BusAssignment[] = [
    { studentId: SARAH_ID, busId: 'bus-4', morningRouteId: 'rt-4-am', eveningRouteId: 'rt-4-pm', stopName: 'Résidence Les Jasmins' },
    { studentId: ADAM_ID, busId: 'bus-4', morningRouteId: 'rt-4-am', eveningRouteId: 'rt-4-pm', stopName: 'Résidence Les Jasmins' },
  ];

  const live: TransportLiveStatus[] = buses.map((b, i) => ({
    busId: b.id,
    routeId: b.id === 'bus-4' ? 'rt-4-pm' : `rt-${i + 1}-pm`,
    state: b.number === 7 ? 'delayed' : b.number === 8 ? 'at_school' : 'en_route',
    nextStopIndex: 1,
    etaToFamilyStop: b.id === 'bus-4' ? '17:06' : undefined,
    delayMinutes: b.number === 7 ? 12 : 0,
    updatedAt: '2026-11-16T16:45:00',
  }));

  return { buses, routes, assignments, live };
}

/* ------------------------------------------------------------------------------ */
/* Notifications                                                                   */

export function buildNotifications(): AppNotification[] {
  const P = PARENT_ID;
  const n = (id: string, userId: string, studentId: string | undefined, category: AppNotification['category'], title: string, body: string, createdAt: string, read: boolean, link?: string): AppNotification => ({ id, userId, studentId, category, title, body, createdAt, read, link });
  return [
    n('n-elections', P, undefined, 'urgent', 'Information importante', "Fermeture exceptionnelle vendredi 27 novembre. Merci de confirmer la lecture.", '2026-11-16T09:00:00', false, '/announcements'),
    n('n-bus-board', P, SARAH_ID, 'transport', 'Transport', 'Sarah est montée dans le bus N°4.', '2026-11-16T16:36:00', false, '/transport'),
    n('n-exit', P, SARAH_ID, 'attendance', 'Sortie', "Sarah a quitté l'établissement à 16:32.", '2026-11-16T16:32:00', false, '/attendance'),
    n('n-grade-fr', P, SARAH_ID, 'grades', 'Nouvelle note', 'Français — Compréhension de texte : 16/20', '2026-11-16T14:10:00', false, '/grades'),
    n('n-hw-en', P, SARAH_ID, 'homework', 'Nouveau devoir', 'Anglais — Workbook p. 18, pour jeudi', '2026-11-16T13:05:00', true, '/homework'),
    n('n-msg-bs', P, SARAH_ID, 'messages', 'Mme Ben Salem', 'Je vous joins la fiche de révision pour le contrôle de mercredi.', '2026-11-16T12:40:00', false, '/chat/conv-bensalem'),
    n('n-entry', P, SARAH_ID, 'attendance', 'Entrée', "Sarah est entrée à l'école à 08:05.", '2026-11-16T08:05:00', true, '/attendance'),
    n('n-entry-adam', P, ADAM_ID, 'attendance', 'Entrée', "Adam est entré à l'école à 07:52.", '2026-11-16T07:52:00', true, '/attendance'),
    n('n-bus-arrived', P, SARAH_ID, 'transport', 'Transport', "Le bus est arrivé à l'école.", '2026-11-16T07:58:00', true, '/transport'),
    n('n-auth-bardo', P, SARAH_ID, 'events', 'Autorisation à signer', 'Sortie au Musée du Bardo — jeudi 3 décembre', '2026-11-15T10:00:00', false, '/events/ev-bardo'),
    n('n-canteen-invoice', P, SARAH_ID, 'payments', 'Facture disponible', 'Cantine — novembre : 95 DT', '2026-11-14T10:00:00', true, '/payments'),
    n('n-grade-adam', P, ADAM_ID, 'grades', 'Nouvelle note', 'Anglais — Writing : 17/20', '2026-11-13T15:00:00', true, '/grades'),
    n('n-grade-maths', P, SARAH_ID, 'grades', 'Nouvelle note', 'Mathématiques — Contrôle N°2 : 17/20', '2026-11-12T17:20:00', true, '/grades'),
    n('n-absent', P, SARAH_ID, 'attendance', 'Absence', "Sarah a été marquée absente aujourd'hui.", '2026-11-10T08:20:00', true, '/attendance'),
    n('n-late', P, SARAH_ID, 'attendance', 'Retard', 'Sarah est arrivée avec 12 minutes de retard.', '2026-10-07T08:12:00', true, '/attendance'),
    /* Teacher */
    n('n-t-msg', teacherUserId('t-bensalem'), undefined, 'messages', 'M. Ben Ali', 'Merci beaucoup pour ce retour détaillé.', '2026-11-14T12:32:00', true, '/chat/conv-bensalem'),
    n('n-t-grades', teacherUserId('t-bensalem'), undefined, 'grades', 'Rappel', 'Saisir les notes du contrôle de 5ème A avant vendredi.', '2026-11-16T07:30:00', false, '/teacher/grade'),
    /* Student */
    n('n-s-hw', SARAH_USER_ID, SARAH_ID, 'homework', 'Nouveau devoir', 'Anglais — Workbook p. 18, pour jeudi', '2026-11-16T13:05:00', false, '/homework'),
    n('n-s-exam', SARAH_USER_ID, SARAH_ID, 'events', 'Rappel', 'Contrôle de mathématiques dans 2 jours.', '2026-11-16T07:00:00', false, '/exams'),
  ];
}

/* ------------------------------------------------------------------------------ */
/* Appointments                                                                    */

export function buildAppointments(): { slots: AppointmentSlot[]; appointments: Appointment[] } {
  const slot = (teacherId: string, date: string, start: string, end: string, bookedBy?: string): AppointmentSlot => ({ id: `slot-${teacherId}-${date}-${start}`, teacherId, date, start, end, bookedBy });
  const slots: AppointmentSlot[] = [
    slot('t-bensalem', '2026-11-17', '15:30', '15:45'),
    slot('t-bensalem', '2026-11-17', '15:45', '16:00'),
    slot('t-bensalem', '2026-11-17', '16:00', '16:15', 'u-par-0102'),
    slot('t-bensalem', '2026-11-19', '16:30', '16:45'),
    slot('t-bensalem', '2026-11-19', '16:45', '17:00'),
    slot('t-bensalem', '2026-11-24', '15:30', '15:45'),
    slot('t-trabelsi', '2026-11-18', '13:30', '13:45'),
    slot('t-trabelsi', '2026-11-18', '13:45', '14:00', 'u-par-0044'),
    slot('t-trabelsi', '2026-11-20', '17:00', '17:15'),
    slot('t-trabelsi', '2026-11-20', '17:15', '17:30'),
    slot('t-martin', '2026-11-17', '12:30', '12:45'),
    slot('t-martin', '2026-11-19', '12:30', '12:45'),
    slot('t-gharbi', '2026-11-19', '16:30', '16:45'),
    slot('t-gharbi', '2026-11-23', '16:30', '16:45'),
    slot('t-kacem', '2026-11-18', '12:30', '12:45'),
    slot('t-kacem', '2026-11-25', '12:30', '12:45'),
  ];
  const appointments: Appointment[] = [
    { id: 'apt-1', slotId: 'slot-past-1', parentId: PARENT_ID, teacherId: 't-trabelsi', studentId: SARAH_ID, date: '2026-10-08', start: '17:00', end: '17:15', reason: 'Rencontre de rentrée avec le professeur principal', mode: 'in_person', status: 'completed' },
    { id: 'apt-2', slotId: 'slot-past-2', parentId: PARENT_ID, teacherId: 't-kacem', studentId: ADAM_ID, date: '2026-10-14', start: '12:30', end: '12:45', reason: 'Orientation et préparation du brevet', mode: 'video', status: 'completed' },
  ];
  return { slots, appointments };
}

/* ------------------------------------------------------------------------------ */
/* Clubs, canteen                                                                  */

export function buildClubs(): { clubs: Club[]; registrations: ClubRegistration[] } {
  const clubs: Club[] = [
    { id: 'club-foot', name: 'Football', emoji: '⚽', description: 'Entraînements techniques et matchs amicaux inter-écoles.', schedule: 'Mercredi 14:00 – 15:30', supervisor: 'M. Jebali', capacity: 24, enrolled: 22, levels: ['college'], fee: 90 },
    { id: 'club-dessin', name: 'Dessin', emoji: '🎨', description: 'Croquis, aquarelle et bande dessinée.', schedule: 'Jeudi 16:30 – 17:30', supervisor: 'Mme Lefèvre', capacity: 15, enrolled: 15, levels: ['primaire', 'college'], fee: 80 },
    { id: 'club-robot', name: 'Robotique', emoji: '🤖', description: 'Programmation de robots et préparation des concours.', schedule: 'Mercredi 13:30 – 15:00', supervisor: 'M. Gharbi', capacity: 16, enrolled: 14, levels: ['college', 'lycee'], fee: 120 },
    { id: 'club-theatre', name: 'Théâtre', emoji: '🎭', description: 'Improvisation, mise en voix et spectacle de fin d\'année.', schedule: 'Vendredi 16:30 – 18:00', supervisor: 'M. Trabelsi', capacity: 20, enrolled: 11, levels: ['college'], fee: 70 },
    { id: 'club-echecs', name: 'Échecs', emoji: '♟️', description: 'Stratégie, tournois internes et initiation.', schedule: 'Mardi 12:30 – 13:15', supervisor: 'M. Kacem', capacity: 16, enrolled: 9, levels: ['primaire', 'college', 'lycee'] },
    { id: 'club-musique', name: 'Musique — Chorale', emoji: '🎵', description: 'Chant choral et préparation des concerts.', schedule: 'Lundi 12:30 – 13:15', supervisor: 'Mme Haddad', capacity: 30, enrolled: 18, levels: ['primaire', 'college'] },
  ];
  const registrations: ClubRegistration[] = [
    { clubId: 'club-robot', studentId: SARAH_ID, status: 'registered', registeredAt: '2026-09-15' },
    { clubId: 'club-foot', studentId: ADAM_ID, status: 'registered', registeredAt: '2026-09-14' },
  ];
  return { clubs, registrations };
}

export function buildCanteen(): { menus: CanteenMenu[]; dietary: DietaryProfile[] } {
  const menus: CanteenMenu[] = [
    { date: '2026-11-16', starter: 'Salade de saison', main: 'Poulet rôti', side: 'Riz aux légumes', dessert: 'Fruit de saison', vegetarian: 'Galette de pois chiches', allergens: [] },
    { date: '2026-11-17', starter: 'Soupe de légumes', main: 'Couscous au poisson', dessert: 'Yaourt', vegetarian: 'Couscous aux légumes', allergens: ['Poisson', 'Lait', 'Gluten'] },
    { date: '2026-11-18', starter: 'Carottes râpées', main: 'Pâtes à la bolognaise', dessert: 'Compote', vegetarian: 'Pâtes à la sauce tomate', allergens: ['Gluten'] },
    { date: '2026-11-19', starter: 'Salade tunisienne', main: 'Escalope de dinde', side: 'Purée', dessert: 'Gâteau maison', vegetarian: 'Omelette aux herbes', allergens: ['Œuf', 'Lait', 'Gluten'] },
    { date: '2026-11-20', starter: 'Velouté de potiron', main: 'Poisson grillé', side: 'Légumes vapeur', dessert: 'Fruit de saison', vegetarian: 'Gratin de légumes', allergens: ['Poisson'] },
    { date: '2026-11-23', starter: 'Salade verte', main: 'Kefta et semoule', dessert: 'Orange', vegetarian: 'Semoule aux légumes', allergens: ['Gluten'] },
    { date: '2026-11-24', starter: 'Pique-nique', main: 'Sandwich poulet-crudités', dessert: 'Fruit et compote', vegetarian: 'Sandwich fromage-crudités', allergens: ['Gluten', 'Lait'] },
    { date: '2026-11-25', starter: 'Betteraves', main: 'Lasagnes', dessert: 'Yaourt aux fruits', vegetarian: 'Lasagnes aux légumes', allergens: ['Gluten', 'Lait'] },
    { date: '2026-11-26', starter: 'Soupe de lentilles', main: 'Poulet basquaise', side: 'Riz', dessert: 'Crème dessert', vegetarian: 'Riz aux lentilles', allergens: ['Lait'] },
  ];
  const dietary: DietaryProfile[] = [
    { studentId: SARAH_ID, allergies: ['Arachides'], preferences: [], notes: 'Merci de vérifier les desserts contenant des fruits à coque.', updatedAt: '2026-09-02' },
    { studentId: ADAM_ID, allergies: [], preferences: [], notes: '' },
  ];
  return { menus, dietary };
}

/* ------------------------------------------------------------------------------ */
/* Audit                                                                           */

export function buildAuditLogs(): AuditLog[] {
  return [
    { id: 'log-1', at: '2026-11-16T16:40:00', actorId: PARENT_ID, actorName: 'M. Mohamed Ben Ali', action: 'Connexion réussie (Face ID)', target: 'Application mobile — iPhone' },
    { id: 'log-2', at: '2026-11-16T14:10:00', actorId: teacherUserId('t-trabelsi'), actorName: 'M. Sami Trabelsi', action: 'Note ajoutée', target: '6ème B — Français — Compréhension de texte' },
    { id: 'log-3', at: '2026-11-16T09:00:00', actorId: ADMIN_ID, actorName: 'Mme Nadia Chaabane', action: 'Annonce critique publiée (accusé de lecture requis)', target: 'Fermeture exceptionnelle — 27 novembre' },
    { id: 'log-4', at: '2026-11-16T08:02:00', actorId: teacherUserId('t-bensalem'), actorName: 'Mme Leila Ben Salem', action: 'Appel effectué', target: '6ème B — 08:00 Mathématiques' },
    { id: 'log-5', at: '2026-11-15T18:30:00', actorId: ADMIN_ID, actorName: 'Mme Nadia Chaabane', action: 'Export de la liste des élèves', target: 'Collège — 6ème' },
    { id: 'log-6', at: '2026-11-14T11:05:00', actorId: STAFF_VIE_SCOLAIRE, actorName: 'Vie scolaire', action: 'Justificatif accepté', target: 'Absence du 03/11 — 3ème A' },
    { id: 'log-7', at: '2026-11-13T10:20:00', actorId: ADMIN_ID, actorName: 'Mme Nadia Chaabane', action: 'Permissions de messagerie modifiées', target: 'Messages vocaux : désactivés' },
    { id: 'log-8', at: '2026-11-12T22:47:00', actorId: 'unknown', actorName: 'Inconnu', action: 'Échec de connexion (3 tentatives) — compte verrouillé 15 min', target: 'HZ-P-0871' },
  ];
}
