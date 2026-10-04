import type {
  AttendanceRecord,
  Exam,
  Grade,
  Homework,
  HomeworkCompletion,
  ReportCard,
  ReportCardSubject,
  Student,
  TeacherFeedback,
  TimetableSlot,
} from '../types';
import { DEMO_TODAY, eachDay, isWeekend } from '../dates';
import { createRng } from '../rng';
import { ADAM_ID, PARENT_ID, SARAH_ID, SUBJECTS } from './directory';

/* ------------------------------------------------------------------------------ */
/* Timetables                                                                      */

type SlotSpec = [start: string, end: string, subject: string, room?: string];

const PAUSE = 'pause';
const LUNCH = 'lunch';

const TEACHERS_6B: Record<string, string> = {
  'sub-maths': 't-bensalem',
  'sub-fr': 't-trabelsi',
  'sub-en': 't-martin',
  'sub-sci': 't-gharbi',
  'sub-hg': 't-dupont',
  'sub-ar': 't-haddad',
  'sub-eps': 't-jebali',
  'sub-art': 't-lefevre',
};

const TEACHERS_3A: Record<string, string> = { ...TEACHERS_6B, 'sub-maths': 't-kacem', 'sub-fr': 't-rekik' };

const ROOMS: Record<string, string> = {
  'sub-maths': 'B12',
  'sub-fr': 'A04',
  'sub-en': 'A07',
  'sub-sci': 'Labo 2',
  'sub-hg': 'A04',
  'sub-ar': 'A05',
  'sub-eps': 'Gymnase',
  'sub-art': 'Atelier',
};

const M = 'sub-maths', F = 'sub-fr', E = 'sub-en', S = 'sub-sci', H = 'sub-hg', A = 'sub-ar', P = 'sub-eps', R = 'sub-art';

const WEEK_6B: Record<number, SlotSpec[]> = {
  1: [['08:00', '09:00', M], ['09:00', '10:00', F], ['10:00', '10:15', PAUSE], ['10:15', '11:15', S], ['11:15', '12:15', E], ['12:15', '13:30', LUNCH], ['13:30', '14:30', R], ['14:30', '16:30', P]],
  2: [['08:00', '09:00', F], ['09:00', '10:00', H], ['10:00', '10:15', PAUSE], ['10:15', '11:15', M], ['11:15', '12:15', A], ['12:15', '13:30', LUNCH], ['13:30', '14:30', E], ['14:30', '15:30', S], ['15:30', '16:30', H]],
  3: [['08:00', '09:00', A], ['09:00', '10:00', M], ['10:00', '10:15', PAUSE], ['10:15', '11:15', F], ['11:15', '12:15', E]],
  4: [['08:00', '09:00', S], ['09:00', '10:00', M], ['10:00', '10:15', PAUSE], ['10:15', '11:15', H], ['11:15', '12:15', F], ['12:15', '13:30', LUNCH], ['13:30', '14:30', A], ['14:30', '15:30', R], ['15:30', '16:30', E]],
  5: [['08:00', '09:00', E], ['09:00', '10:00', F], ['10:00', '10:15', PAUSE], ['10:15', '11:15', M], ['11:15', '12:15', A], ['12:15', '13:30', LUNCH], ['13:30', '15:30', P], ['15:30', '16:30', S]],
};

const WEEK_3A: Record<number, SlotSpec[]> = {
  1: [['08:00', '09:00', H], ['09:00', '10:00', E], ['10:00', '10:15', PAUSE], ['10:15', '11:15', M], ['11:15', '12:15', F], ['12:15', '13:30', LUNCH], ['13:30', '14:30', S], ['14:30', '15:30', A], ['15:30', '16:30', R]],
  2: [['08:00', '09:00', M], ['09:00', '10:00', S], ['10:00', '10:15', PAUSE], ['10:15', '11:15', F], ['11:15', '12:15', H], ['12:15', '13:30', LUNCH], ['13:30', '15:30', P], ['15:30', '16:30', E]],
  3: [['08:00', '09:00', F], ['09:00', '10:00', A], ['10:00', '10:15', PAUSE], ['10:15', '11:15', M], ['11:15', '12:15', E]],
  4: [['08:00', '09:00', M], ['09:00', '10:00', F], ['10:00', '10:15', PAUSE], ['10:15', '11:15', S], ['11:15', '12:15', A], ['12:15', '13:30', LUNCH], ['13:30', '14:30', H], ['14:30', '15:30', E], ['15:30', '16:30', M]],
  5: [['08:00', '09:00', S], ['09:00', '10:00', M], ['10:00', '10:15', PAUSE], ['10:15', '11:15', F], ['11:15', '12:15', H], ['12:15', '13:30', LUNCH], ['13:30', '14:30', A], ['14:30', '15:30', E], ['15:30', '16:30', R]],
};

/** Mme Ben Salem's lessons in her other classes (6ème B is covered by WEEK_6B). */
const BEN_SALEM_OTHER: [classId: string, day: number, start: string, end: string, room: string][] = [
  ['cls-5-a', 1, '09:00', '10:00', 'B12'],
  ['cls-6-a', 1, '10:15', '11:15', 'B12'],
  ['cls-4-b', 1, '14:30', '15:30', 'B14'],
  ['cls-5-a', 2, '08:00', '09:00', 'B12'],
  ['cls-4-b', 2, '13:30', '14:30', 'B14'],
  ['cls-6-a', 3, '10:15', '11:15', 'B12'],
  ['cls-4-b', 4, '08:00', '09:00', 'B14'],
  ['cls-5-a', 4, '13:30', '14:30', 'B12'],
  ['cls-6-a', 5, '08:00', '09:00', 'B12'],
  ['cls-5-a', 5, '14:30', '15:30', 'B12'],
];

function weekSlots(classId: string, week: Record<number, SlotSpec[]>, teachers: Record<string, string>): TimetableSlot[] {
  const out: TimetableSlot[] = [];
  for (const [dayStr, slots] of Object.entries(week)) {
    const day = Number(dayStr);
    slots.forEach(([start, end, subject], i) => {
      const id = `tt-${classId}-${day}-${i}`;
      if (subject === PAUSE || subject === LUNCH) {
        out.push({ id, classId, day, start, end, subjectId: null, label: subject === PAUSE ? 'Pause' : 'Déjeuner' });
      } else {
        out.push({ id, classId, day, start, end, subjectId: subject, room: ROOMS[subject], teacherId: teachers[subject] });
      }
    });
  }
  return out;
}

export function buildTimetable(): TimetableSlot[] {
  return [
    ...weekSlots('cls-6-b', WEEK_6B, TEACHERS_6B),
    ...weekSlots('cls-3-a', WEEK_3A, TEACHERS_3A),
    ...BEN_SALEM_OTHER.map(([classId, day, start, end, room], i) => ({
      id: `tt-bs-${i}`,
      classId,
      day,
      start,
      end,
      subjectId: 'sub-maths',
      room,
      teacherId: 't-bensalem',
    })),
  ];
}

/* ------------------------------------------------------------------------------ */
/* Attendance                                                                      */

export const SCHOOL_START = '2026-09-01';
export const HOLIDAYS = [
  { id: 'hol-toussaint', label: 'Vacances de la Toussaint', start: '2026-10-17', end: '2026-11-01' },
  { id: 'hol-elections', label: 'Fermeture exceptionnelle (élections)', start: '2026-11-27', end: '2026-11-27' },
  { id: 'hol-hiver', label: "Vacances d'hiver", start: '2026-12-19', end: '2027-01-03' },
  { id: 'hol-fevrier', label: 'Vacances de février', start: '2027-02-13', end: '2027-02-28' },
  { id: 'hol-printemps', label: 'Vacances de printemps', start: '2027-04-10', end: '2027-04-25' },
];

export function isSchoolDay(iso: string): boolean {
  if (isWeekend(iso)) return false;
  return !HOLIDAYS.some((h) => iso >= h.start && iso <= h.end);
}

export function schoolDaysUntil(to: string): string[] {
  return eachDay(SCHOOL_START, to).filter(isSchoolDay);
}

interface StudentAttendancePlan {
  studentId: string;
  today: { checkIn: string; checkOut: string };
  special: Record<string, Partial<AttendanceRecord>>;
  seed: number;
}

function studentAttendance(plan: StudentAttendancePlan): AttendanceRecord[] {
  const rng = createRng(plan.seed);
  return schoolDaysUntil(DEMO_TODAY).map((date) => {
    const base: AttendanceRecord = {
      id: `att-${plan.studentId}-${date}`,
      studentId: plan.studentId,
      date,
      status: 'present',
      checkIn: `07:${String(rng.int(46, 59)).padStart(2, '0')}`,
      checkOut: new Date(`${date}T00:00:00Z`).getUTCDay() === 3 ? `12:${String(rng.int(16, 24))}` : `16:${String(rng.int(31, 39))}`,
      source: 'qr',
    };
    if (date === DEMO_TODAY) Object.assign(base, plan.today);
    const special = plan.special[date];
    if (special) {
      Object.assign(base, special);
      if (special.status === 'absent' || special.status === 'excused' || special.status === 'unexcused') {
        delete base.checkIn;
        delete base.checkOut;
      }
    }
    return base;
  });
}

export function buildAttendance(students: Student[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [
    ...studentAttendance({
      studentId: SARAH_ID,
      seed: 14,
      today: { checkIn: '08:05', checkOut: '16:32' },
      special: {
        '2026-09-22': {
          status: 'excused',
          source: 'teacher',
          justification: { reason: 'illness', message: 'Sarah avait de la fièvre. Certificat médical joint.', attachmentName: 'certificat_medical_22-09.pdf', submittedAt: '2026-09-22T07:40:00', submittedBy: PARENT_ID, status: 'accepted' },
        },
        '2026-10-07': { status: 'late', checkIn: '08:12', minutesLate: 12 },
        '2026-11-10': { status: 'absent', source: 'teacher', note: 'Absence constatée à 08:00 — en attente de justificatif.' },
      },
    }),
    ...studentAttendance({
      studentId: ADAM_ID,
      seed: 3,
      today: { checkIn: '07:52', checkOut: '16:35' },
      special: {
        '2026-10-01': { status: 'late', checkIn: '08:07', minutesLate: 7 },
        '2026-11-03': {
          status: 'excused',
          source: 'teacher',
          justification: { reason: 'family', message: 'Rendez-vous administratif familial.', submittedAt: '2026-11-02T19:12:00', submittedBy: PARENT_ID, status: 'accepted' },
        },
      },
    }),
  ];

  /* Today's records for the rest of the school: exactly 72 absences and 18 late arrivals. */
  const rng = createRng(1116);
  const others = rng.shuffle(students.filter((s) => s.id !== SARAH_ID && s.id !== ADAM_ID));
  others.forEach((s, i) => {
    const status = i < 72 ? (i < 21 ? 'excused' : 'absent') : i < 90 ? 'late' : 'present';
    const minutesLate = status === 'late' ? rng.int(3, 25) : undefined;
    records.push({
      id: `att-${s.id}-${DEMO_TODAY}`,
      studentId: s.id,
      date: DEMO_TODAY,
      status,
      checkIn: status === 'present' ? `07:${String(rng.int(40, 59)).padStart(2, '0')}` : status === 'late' ? `08:${String(minutesLate).padStart(2, '0')}` : undefined,
      minutesLate,
      source: rng.pick(['qr', 'rfid', 'badge', 'teacher'] as const),
    });
  });
  return records;
}

/* ------------------------------------------------------------------------------ */
/* Grades                                                                          */

type GradeSpec = [subject: string, examName: string, date: string, score: number, coefficient: number, classAverage: number, comment?: string];

const SARAH_GRADES: GradeSpec[] = [
  [M, 'Interrogation n°1 — Nombres décimaux', '2026-09-17', 16, 1, 14.3, 'Bonne maîtrise des nombres décimaux.'],
  [M, 'Contrôle N°1 — Nombres entiers et décimaux', '2026-10-08', 17, 2, 14.0, 'Très bon contrôle, raisonnements clairs.'],
  [M, 'Devoir maison — Géométrie', '2026-11-04', 18, 1, 15.1, 'Constructions précises et soignées. Bravo !'],
  [M, 'Contrôle N°2 — Fractions', '2026-11-12', 17, 2, 13.9, 'Excellent travail. Continue ainsi.'],
  [F, 'Dictée n°1', '2026-09-15', 14, 1, 12.8, "Quelques erreurs d'accord, mais des progrès visibles."],
  [F, 'Rédaction — Le portrait', '2026-10-02', 14.5, 2, 13.4, 'Portrait vivant et bien construit ; attention à la ponctuation.'],
  [F, 'Lecture suivie — Le Petit Prince', '2026-10-14', 15, 1, 14.2, 'Lecture attentive, réponses bien justifiées.'],
  [F, 'Dictée n°2', '2026-11-09', 16, 1, 13.9, "Belle progression en orthographe."],
  [F, 'Compréhension de texte', '2026-11-16', 16, 1, 14.5, 'Très bonne compréhension du texte. Expression écrite claire.'],
  [E, 'Vocabulary quiz — School life', '2026-09-21', 17.5, 1, 14.8, 'Great vocabulary, well done!'],
  [E, 'Test — Present simple', '2026-10-12', 18, 2, 15.0, 'Excellent work, very accurate.'],
  [E, 'Oral — Presenting my family', '2026-11-06', 18.5, 1, 15.6, 'Confident and fluent presentation.'],
  [S, 'Contrôle — Le vivant et ses besoins', '2026-09-24', 15.5, 1, 13.4, 'Connaissances solides.'],
  [S, 'TP — Mesurer des volumes', '2026-10-13', 14, 1, 13.0, 'Manipulations soignées, compte rendu à compléter.'],
  [S, 'Évaluation — Les mélanges', '2026-11-11', 12.5, 1, 13.2, 'Quelques confusions entre mélanges homogènes et hétérogènes. Revoir la fiche 3 ; aide aux devoirs disponible le jeudi.'],
  [H, 'Contrôle — Les premières villes', '2026-10-05', 13, 1, 12.6, 'Bonnes connaissances, développer davantage les réponses.'],
  [H, 'Croquis — Habiter une métropole', '2026-11-13', 14, 1, 13.2, 'Croquis lisible et légende complète.'],
  [A, 'Dictée — الإملاء', '2026-10-06', 13.5, 1, 12.9, 'Lecture fluide, quelques erreurs de hamza.'],
  [A, 'Expression écrite', '2026-11-05', 14.5, 1, 13.3, 'Texte bien organisé.'],
  [P, "Course d'endurance", '2026-10-15', 16, 1, 14.6, 'Effort régulier et belle gestion de la course.'],
  [R, 'Projet — Paysage imaginaire', '2026-10-16', 15.5, 1, 13.7, 'Composition originale et colorée.'],
];

const ADAM_GRADES: GradeSpec[] = [
  [M, 'Contrôle — Calcul littéral', '2026-09-23', 12.5, 2, 11.4, 'Méthode correcte, attention aux erreurs de signe.'],
  [M, 'Interrogation — Théorème de Pythagore', '2026-10-09', 14, 1, 12.2, 'Bonne application du théorème.'],
  [M, 'Contrôle — Fonctions linéaires', '2026-11-10', 13, 2, 11.9, 'Progrès réels, continuer les exercices de la fiche.'],
  [F, 'Commentaire de texte', '2026-10-06', 13, 1, 12.1, 'Analyse pertinente, conclusion à développer.'],
  [F, 'Rédaction — Récit autobiographique', '2026-11-09', 14.5, 1, 12.7, 'Récit sincère et bien écrit.'],
  [E, 'Reading comprehension', '2026-10-05', 16, 1, 13.6, 'Very good understanding.'],
  [E, 'Writing — My future job', '2026-11-13', 17, 1, 14.2, 'Excellent ideas and structure.'],
  [S, 'Évaluation — Génétique', '2026-10-13', 14, 1, 12.4, 'Bonnes bases.'],
  [S, 'TP — Circuits électriques', '2026-11-12', 15, 1, 12.8, 'Montage réussi et rigoureux.'],
  [H, 'Contrôle — La Première Guerre mondiale', '2026-10-02', 12, 1, 12.0, 'Revoir les dates clés.'],
  [H, 'Étude de document — 1936', '2026-11-05', 13.5, 1, 12.4, 'Analyse plus précise, bien.'],
  [A, 'Analyse de texte', '2026-10-08', 14, 1, 13.1, 'Bon travail.'],
  [A, 'Expression écrite', '2026-11-06', 14, 1, 12.9, 'Style agréable.'],
  [P, 'Volley-ball', '2026-10-14', 15, 1, 14.1, 'Bon esprit collectif.'],
  [R, 'Affiche — Engagement citoyen', '2026-10-15', 16, 1, 14.5, 'Très belle réalisation.'],
];

function toGrades(studentId: string, specs: GradeSpec[], teachers: Record<string, string>): Grade[] {
  return specs.map(([subjectId, examName, date, score, coefficient, classAverage, comment], i) => ({
    id: `gr-${studentId}-${i}`,
    studentId,
    subjectId,
    teacherId: teachers[subjectId],
    examName,
    date,
    score,
    outOf: 20,
    coefficient,
    classAverage,
    comment,
    term: 1,
  }));
}

export function buildGrades(): Grade[] {
  return [...toGrades(SARAH_ID, SARAH_GRADES, TEACHERS_6B), ...toGrades(ADAM_ID, ADAM_GRADES, TEACHERS_3A)];
}

/* ------------------------------------------------------------------------------ */
/* Report cards                                                                    */

const weighted = (subjects: ReportCardSubject[], key: 'average' | 'classAverage') => {
  let sum = 0;
  let coef = 0;
  for (const s of subjects) {
    const c = SUBJECTS.find((x) => x.id === s.subjectId)!.coefficient;
    sum += s[key] * c;
    coef += c;
  }
  return Math.round((sum / coef) * 10) / 10;
};

const APPRECIATIONS: Record<string, string[]> = {
  'sub-maths': ['Bon travail, méthode à consolider.', 'Des progrès réguliers, continue.', 'Très bon trimestre, raisonnements rigoureux.'],
  'sub-fr': ['Expression écrite en progrès.', 'Lectrice attentive, bonne participation.', 'Des efforts appréciables en orthographe.'],
  'sub-en': ['Excellent niveau à l\'oral.', 'Très bonne élève, participation active.', 'Remarquable, félicitations.'],
  'sub-sci': ['Curieuse et impliquée en TP.', 'Bonnes connaissances.', 'Travail sérieux.'],
  'sub-hg': ['Bon investissement.', 'Connaissances solides.', 'Travail régulier.'],
  'sub-ar': ['Lecture fluide, bonne participation.', 'Des progrès à l\'écrit.', 'Bon trimestre.'],
  'sub-eps': ['Très bon état d\'esprit.', 'Engagement constant.', 'Excellent esprit d\'équipe.'],
  'sub-art': ['Créativité remarquable.', 'Travaux soignés.', 'Très bonne implication.'],
};

function reportCard(
  studentId: string,
  year: string,
  classLabel: string,
  term: number,
  base: Record<string, [number, number]>,
  shift: number,
  observation: string,
  principal: string,
  rank: number,
  mention?: string,
): ReportCard {
  const subjects: ReportCardSubject[] = SUBJECTS.map((s) => ({
    subjectId: s.id,
    average: Math.round((base[s.id][0] + shift) * 10) / 10,
    classAverage: base[s.id][1],
    appreciation: APPRECIATIONS[s.id][(term - 1) % 3],
  }));
  return {
    id: `rc-${studentId}-${year}-${term}`,
    studentId,
    academicYear: year,
    classLabel,
    period: `Trimestre ${term}`,
    term,
    average: weighted(subjects, 'average'),
    classAverage: weighted(subjects, 'classAverage'),
    rank,
    classSize: 28,
    subjects,
    teacherObservation: observation,
    principalComment: principal,
    mention,
    publishedAt: year === '2025-2026' ? ['2025-12-12', '2026-03-20', '2026-06-26'][term - 1] : '2026-12-11',
    status: 'published',
  };
}

/** Last year's subject averages (T3) — used for the trimester-to-trimester progression. */
export const SARAH_PREVIOUS_TERM: Record<string, [number, number]> = {
  'sub-maths': [14.7, 13.6],
  'sub-fr': [13.9, 13.2],
  'sub-en': [17.4, 14.9],
  'sub-sci': [14.8, 13.1],
  'sub-hg': [13.2, 12.8],
  'sub-ar': [13.6, 13.0],
  'sub-eps': [15.8, 14.6],
  'sub-art': [15.0, 13.9],
};

export const ADAM_PREVIOUS_TERM: Record<string, [number, number]> = {
  'sub-maths': [12.4, 11.6],
  'sub-fr': [13.2, 12.3],
  'sub-en': [15.9, 13.8],
  'sub-sci': [13.8, 12.5],
  'sub-hg': [12.9, 12.1],
  'sub-ar': [13.7, 12.8],
  'sub-eps': [14.8, 14.0],
  'sub-art': [15.4, 14.2],
};

export function buildReportCards(): ReportCard[] {
  return [
    reportCard(SARAH_ID, '2025-2026', 'CM2 B', 1, SARAH_PREVIOUS_TERM, -0.4, 'Élève sérieuse et appliquée. Un bon début d\'année.', 'Bon trimestre. Encouragements.', 6),
    reportCard(SARAH_ID, '2025-2026', 'CM2 B', 2, SARAH_PREVIOUS_TERM, -0.1, 'Des progrès constants, une participation de qualité.', 'Trimestre satisfaisant, continuez ainsi.', 5, 'Encouragements'),
    reportCard(SARAH_ID, '2025-2026', 'CM2 B', 3, SARAH_PREVIOUS_TERM, 0, 'Une très belle année. Sarah est prête pour le collège.', 'Félicitations pour cette année réussie. Passage en 6ème.', 4, 'Compliments'),
    reportCard(ADAM_ID, '2025-2026', '4ème A', 1, ADAM_PREVIOUS_TERM, -0.5, 'Adam doit gagner en régularité.', 'Trimestre correct.', 11),
    reportCard(ADAM_ID, '2025-2026', '4ème A', 2, ADAM_PREVIOUS_TERM, -0.2, 'Des efforts visibles, notamment à l\'écrit.', 'Bon trimestre, poursuivez vos efforts.', 9, 'Encouragements'),
    reportCard(ADAM_ID, '2025-2026', '4ème A', 3, ADAM_PREVIOUS_TERM, 0, 'Une progression sérieuse sur l\'année.', 'Passage en 3ème. Bonne continuation.', 8),
  ];
}

/* ------------------------------------------------------------------------------ */
/* Homework & exams                                                                */

export function buildHomework(): { homework: Homework[]; completions: HomeworkCompletion[] } {
  const homework: Homework[] = [
    {
      id: 'hw-maths-42', classId: 'cls-6-b', subjectId: M, teacherId: 't-bensalem',
      title: 'Exercices 5 à 10 — Page 42',
      description: 'Fractions : simplifier puis comparer. Rédiger toutes les étapes de calcul sur le cahier d\'exercices.',
      assignedAt: '2026-11-12', dueDate: '2026-11-17', estimatedMinutes: 40,
      attachments: [{ id: 'att-1', name: 'Fiche_fractions.pdf', kind: 'pdf', size: '214 Ko' }],
    },
    {
      id: 'hw-fr-poem', classId: 'cls-6-b', subjectId: F, teacherId: 't-trabelsi',
      title: 'Apprendre la poésie « Le Cancre »',
      description: 'Apprendre les deux premières strophes du poème de Jacques Prévert. Récitation en classe.',
      assignedAt: '2026-11-13', dueDate: '2026-11-17', estimatedMinutes: 25,
      attachments: [{ id: 'att-2', name: 'Le_Cancre_Prevert.pdf', kind: 'pdf', size: '96 Ko' }],
    },
    {
      id: 'hw-en-wb18', classId: 'cls-6-b', subjectId: E, teacherId: 't-martin',
      title: 'Workbook p. 18 — exercises 1, 2 and 3',
      description: 'Unit 3 — My daily routine. Listen to the audio track before exercise 2.',
      assignedAt: '2026-11-16', dueDate: '2026-11-19', estimatedMinutes: 30,
      attachments: [{ id: 'att-3', name: 'Audio — Unit 3, track 7', kind: 'link', url: 'https://horizon.edu.tn/ressources/anglais/unit3' }],
    },
    {
      id: 'hw-sci-eau', classId: 'cls-6-b', subjectId: S, teacherId: 't-gharbi',
      title: "Fiche : les états de l'eau",
      description: 'Compléter le schéma et répondre aux questions 1 à 4.',
      assignedAt: '2026-11-09', dueDate: '2026-11-13', estimatedMinutes: 20,
      attachments: [{ id: 'att-4', name: 'schema_etats_eau.jpg', kind: 'image', size: '380 Ko' }],
    },
    {
      id: 'hw-hg-carte', classId: 'cls-6-b', subjectId: H, teacherId: 't-dupont',
      title: 'Carte : continents et océans',
      description: 'Colorier et légender la carte du monde distribuée en classe.',
      assignedAt: '2026-11-05', dueDate: '2026-11-12', estimatedMinutes: 30, attachments: [],
    },
    {
      id: 'hw-ar-lecture', classId: 'cls-6-b', subjectId: A, teacherId: 't-haddad',
      title: 'Lecture p. 31 et questions',
      description: 'Lire le texte page 31 et répondre aux questions de compréhension.',
      assignedAt: '2026-11-09', dueDate: '2026-11-13', estimatedMinutes: 30, attachments: [],
    },
    {
      id: 'hw-fr-portrait', classId: 'cls-6-b', subjectId: F, teacherId: 't-trabelsi',
      title: "Rédaction : portrait d'un personnage",
      description: 'Rédiger un portrait de 15 lignes en utilisant au moins cinq adjectifs qualificatifs.',
      assignedAt: '2026-11-03', dueDate: '2026-11-09', estimatedMinutes: 45, attachments: [],
    },
    {
      id: 'hw-maths-fiche', classId: 'cls-6-b', subjectId: M, teacherId: 't-bensalem',
      title: "Fiche d'exercices — fractions égales",
      description: 'Exercices 1 à 6.',
      assignedAt: '2026-11-04', dueDate: '2026-11-09', estimatedMinutes: 30,
      attachments: [{ id: 'att-5', name: 'Fractions_egales.pdf', kind: 'pdf', size: '180 Ko' }],
    },
    /* Adam — 3ème A */
    {
      id: 'hw-3a-maths', classId: 'cls-3-a', subjectId: M, teacherId: 't-kacem',
      title: 'Brevet blanc : réviser les chapitres 1 à 4',
      description: 'Refaire les exercices corrigés des chapitres 1 à 4 (calcul littéral, Pythagore, fonctions).',
      assignedAt: '2026-11-10', dueDate: '2026-11-18', estimatedMinutes: 60,
      attachments: [{ id: 'att-6', name: 'Exercices_corriges_ch1-4.pdf', kind: 'pdf', size: '1,2 Mo' }],
    },
    {
      id: 'hw-3a-hg', classId: 'cls-3-a', subjectId: H, teacherId: 't-dupont',
      title: 'Exposé : la Seconde Guerre mondiale',
      description: 'Préparer un exposé de 5 minutes en binôme.',
      assignedAt: '2026-11-05', dueDate: '2026-11-20', estimatedMinutes: 90, attachments: [],
    },
    {
      id: 'hw-3a-en', classId: 'cls-3-a', subjectId: E, teacherId: 't-martin',
      title: 'Reading — "The Giver", chapter 4',
      description: 'Read chapter 4 and summarise it in 10 lines.',
      assignedAt: '2026-11-09', dueDate: '2026-11-13', estimatedMinutes: 40, attachments: [],
    },
  ];

  const completions: HomeworkCompletion[] = [
    { homeworkId: 'hw-sci-eau', studentId: SARAH_ID, completedAt: '2026-11-12T18:20:00' },
    { homeworkId: 'hw-hg-carte', studentId: SARAH_ID, completedAt: '2026-11-11T19:05:00' },
    { homeworkId: 'hw-fr-portrait', studentId: SARAH_ID, completedAt: '2026-11-08T17:40:00' },
    { homeworkId: 'hw-maths-fiche', studentId: SARAH_ID, completedAt: '2026-11-08T18:10:00' },
    { homeworkId: 'hw-3a-en', studentId: ADAM_ID, completedAt: '2026-11-12T20:15:00' },
  ];
  return { homework, completions };
}

export function buildExams(): Exam[] {
  return [
    {
      id: 'ex-maths-3', classId: 'cls-6-b', subjectId: M, teacherId: 't-bensalem',
      title: 'Contrôle N°3', date: '2026-11-18', time: '09:00', durationMinutes: 55, room: 'B12',
      chapters: ['Fractions', 'Équations simples', 'Géométrie : les angles'],
      revisionDocs: [
        { id: 'rev-1', name: 'Fiche de révision — Contrôle N°3.pdf', kind: 'pdf', size: '320 Ko' },
        { id: 'rev-2', name: 'Exercices corrigés — fractions.pdf', kind: 'pdf', size: '540 Ko' },
      ],
    },
    {
      id: 'ex-en-unit3', classId: 'cls-6-b', subjectId: E, teacherId: 't-martin',
      title: 'Test — Unit 3: My daily routine', date: '2026-11-26', time: '15:30', durationMinutes: 50, room: 'A07',
      chapters: ['Present simple', 'Adverbs of frequency', 'Telling the time'],
      revisionDocs: [{ id: 'rev-3', name: 'Unit 3 — revision sheet.pdf', kind: 'pdf', size: '150 Ko' }],
    },
    {
      id: 'ex-fr-dictee', classId: 'cls-6-b', subjectId: F, teacherId: 't-trabelsi',
      title: 'Dictée bilan', date: '2026-11-30', time: '09:00', durationMinutes: 45, room: 'A04',
      chapters: ['Accords dans le groupe nominal', 'Homophones a / à, et / est'],
      revisionDocs: [],
    },
    {
      id: 'ex-sci-matiere', classId: 'cls-6-b', subjectId: S, teacherId: 't-gharbi',
      title: 'Évaluation — Les états de la matière', date: '2026-12-01', time: '14:30', durationMinutes: 50, room: 'Labo 2',
      chapters: ["Les états de l'eau", 'Les changements d\'état', 'Mélanges et solutions'],
      revisionDocs: [{ id: 'rev-4', name: 'Fiche 3 — mélanges.pdf', kind: 'pdf', size: '210 Ko' }],
    },
    {
      id: 'ex-3a-proba', classId: 'cls-3-a', subjectId: M, teacherId: 't-kacem',
      title: 'Contrôle — Probabilités', date: '2026-11-19', time: '08:00', durationMinutes: 55, room: 'B03',
      chapters: ['Vocabulaire des probabilités', 'Arbres de probabilités'],
      revisionDocs: [],
    },
    {
      id: 'ex-3a-brevet', classId: 'cls-3-a', subjectId: F, teacherId: 't-rekik',
      title: 'Brevet blanc — Français', date: '2026-12-07', time: '09:00', durationMinutes: 180, room: 'Salle polyvalente',
      chapters: ['Compréhension et compétences d\'interprétation', 'Dictée', 'Rédaction'],
      revisionDocs: [{ id: 'rev-5', name: 'Annales du brevet 2026.pdf', kind: 'pdf', size: '2,4 Mo' }],
    },
  ];
}

/* ------------------------------------------------------------------------------ */
/* Behaviour & feedback                                                            */

export function buildFeedback(): TeacherFeedback[] {
  return [
    { id: 'fb-1', studentId: SARAH_ID, teacherId: 't-bensalem', subjectId: M, kind: 'positive', text: 'Excellente participation en classe.', date: '2026-11-12' },
    { id: 'fb-2', studentId: SARAH_ID, teacherId: 't-trabelsi', subjectId: F, kind: 'positive', text: 'Belle progression en rédaction, idées bien organisées.', date: '2026-11-10' },
    { id: 'fb-3', studentId: SARAH_ID, teacherId: 't-haddad', subjectId: A, kind: 'improvement', text: 'Devoir de lecture non remis le 13 novembre — à rattraper cette semaine.', date: '2026-11-13' },
    { id: 'fb-4', studentId: SARAH_ID, teacherId: 't-martin', subjectId: E, kind: 'positive', text: "Très bon travail d'équipe lors de l'exposé.", date: '2026-11-06' },
    { id: 'fb-5', studentId: SARAH_ID, teacherId: 't-gharbi', subjectId: S, kind: 'improvement', text: 'Manque de concentration en fin de journée, à encourager.', date: '2026-10-15' },
    { id: 'fb-6', studentId: SARAH_ID, teacherId: 't-jebali', subjectId: P, kind: 'positive', text: 'Fair-play et encouragements envers ses camarades.', date: '2026-10-15' },
    { id: 'fb-7', studentId: ADAM_ID, teacherId: 't-kacem', subjectId: M, kind: 'positive', text: 'Implication sérieuse dans la préparation du brevet blanc.', date: '2026-11-10' },
    { id: 'fb-8', studentId: ADAM_ID, teacherId: 't-dupont', subjectId: H, kind: 'improvement', text: "Penser à apporter le manuel à chaque séance.", date: '2026-11-05' },
    { id: 'fb-9', studentId: ADAM_ID, teacherId: 't-martin', subjectId: E, kind: 'positive', text: 'Excellent writing — creative and well structured.', date: '2026-11-13' },
  ];
}

