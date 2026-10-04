import type {
  ClassRoom,
  School,
  SchoolLevel,
  Student,
  StudentParent,
  Subject,
  Teacher,
  User,
} from '../types';
import { createRng } from '../rng';

export const SCHOOL: School = {
  id: 'sch-horizon',
  name: 'École Internationale Horizon',
  shortName: 'Horizon',
  city: 'Tunis',
  address: '12 avenue de la République, La Marsa, Tunis',
  phone: '+216 71 740 120',
  email: 'contact@horizon.edu.tn',
  website: 'horizon.edu.tn',
  principal: 'Mme Nadia Chaabane',
  primaryLanguage: 'fr',
  levels: ['primaire', 'college', 'lycee'],
  academicYear: '2026-2027',
  currency: 'DT',
  modules: {
    payments: true,
    transport: true,
    canteen: true,
    clubs: true,
    appointments: true,
    qrCheckIn: true,
    voiceMessages: false,
  },
  messaging: {
    parentToTeacher: true,
    parentToStaff: true,
    studentMessaging: false,
    attachments: true,
    quietHours: { start: '20:00', end: '07:00' },
  },
};

export const SUBJECTS: Subject[] = [
  { id: 'sub-maths', name: 'Mathématiques', shortName: 'Maths', color: 'blue', icon: 'calculator-outline', coefficient: 4 },
  { id: 'sub-fr', name: 'Français', shortName: 'Français', color: 'violet', icon: 'book-outline', coefficient: 4 },
  { id: 'sub-en', name: 'Anglais', shortName: 'Anglais', color: 'teal', icon: 'chatbubbles-outline', coefficient: 3 },
  { id: 'sub-sci', name: 'Sciences', shortName: 'Sciences', color: 'green', icon: 'flask-outline', coefficient: 3 },
  { id: 'sub-hg', name: 'Histoire-Géographie', shortName: 'Hist-Géo', color: 'amber', icon: 'earth-outline', coefficient: 3 },
  { id: 'sub-ar', name: 'Arabe', shortName: 'Arabe', color: 'rose', icon: 'language-outline', coefficient: 3 },
  { id: 'sub-eps', name: 'Éducation physique', shortName: 'EPS', color: 'orange', icon: 'football-outline', coefficient: 2 },
  { id: 'sub-art', name: 'Arts plastiques', shortName: 'Arts', color: 'sky', icon: 'color-palette-outline', coefficient: 1 },
];

const AVATAR_COLORS = ['#2563EB', '#14B8A6', '#7C3AED', '#F59E0B', '#EC4899', '#0EA5E9', '#22C55E', '#F97316'];

/* ---------------------------------- People ---------------------------------- */

export const PARENT_ID = 'u-parent-mohamed';
export const PARENT2_ID = 'u-parent-amira';
export const SARAH_ID = 'stu-sarah';
export const ADAM_ID = 'stu-adam';
export const SARAH_USER_ID = 'u-student-sarah';
export const ADMIN_ID = 'u-admin-nadia';
export const STAFF_VIE_SCOLAIRE = 'u-staff-vs';
export const STAFF_TRANSPORT = 'u-staff-transport';
export const STAFF_ACCOUNTING = 'u-staff-compta';
export const TEACHER_BEN_SALEM = 't-bensalem';

interface NamedTeacher {
  id: string;
  title: 'M.' | 'Mme';
  firstName: string;
  lastName: string;
  subjectId: string;
  classIds: string[];
}

export const NAMED_TEACHERS: NamedTeacher[] = [
  { id: 't-bensalem', title: 'Mme', firstName: 'Leila', lastName: 'Ben Salem', subjectId: 'sub-maths', classIds: ['cls-6-b', 'cls-5-a', 'cls-6-a', 'cls-4-b'] },
  { id: 't-trabelsi', title: 'M.', firstName: 'Sami', lastName: 'Trabelsi', subjectId: 'sub-fr', classIds: ['cls-6-b', 'cls-6-a', 'cls-5-b'] },
  { id: 't-martin', title: 'Mme', firstName: 'Claire', lastName: 'Martin', subjectId: 'sub-en', classIds: ['cls-6-b', 'cls-3-a', 'cls-4-a'] },
  { id: 't-gharbi', title: 'M.', firstName: 'Walid', lastName: 'Gharbi', subjectId: 'sub-sci', classIds: ['cls-6-b', 'cls-3-a', 'cls-5-a'] },
  { id: 't-dupont', title: 'Mme', firstName: 'Hélène', lastName: 'Dupont', subjectId: 'sub-hg', classIds: ['cls-6-b', 'cls-3-a'] },
  { id: 't-haddad', title: 'Mme', firstName: 'Ines', lastName: 'Haddad', subjectId: 'sub-ar', classIds: ['cls-6-b', 'cls-3-a'] },
  { id: 't-jebali', title: 'M.', firstName: 'Youssef', lastName: 'Jebali', subjectId: 'sub-eps', classIds: ['cls-6-b', 'cls-3-a'] },
  { id: 't-lefevre', title: 'Mme', firstName: 'Sophie', lastName: 'Lefèvre', subjectId: 'sub-art', classIds: ['cls-6-b', 'cls-3-a'] },
  { id: 't-kacem', title: 'M.', firstName: 'Hatem', lastName: 'Kacem', subjectId: 'sub-maths', classIds: ['cls-3-a', 'cls-3-b'] },
  { id: 't-rekik', title: 'Mme', firstName: 'Asma', lastName: 'Rekik', subjectId: 'sub-fr', classIds: ['cls-3-a', 'cls-4-a'] },
];

export const teacherUserId = (teacherId: string) => `u-${teacherId}`;

const FIRST_F = ['Yasmine', 'Lina', 'Inès', 'Nour', 'Mariem', 'Emna', 'Salma', 'Rania', 'Chaima', 'Eya', 'Malek', 'Farah', 'Léa', 'Chloé', 'Emma', 'Sofia', 'Jade', 'Amel', 'Rim', 'Aya', 'Hana', 'Lilia', 'Meriem', 'Zeineb', 'Camille', 'Louise', 'Alma', 'Selma', 'Dorra', 'Ons'];
const FIRST_M = ['Youssef', 'Ahmed', 'Omar', 'Yassine', 'Aziz', 'Rayen', 'Iyed', 'Skander', 'Hamza', 'Elyes', 'Louis', 'Hugo', 'Nathan', 'Karim', 'Anas', 'Fares', 'Mehdi', 'Zied', 'Ilyes', 'Amine', 'Tarek', 'Bilel', 'Nassim', 'Lucas', 'Gabriel', 'Ali', 'Seif', 'Wassim', 'Aymen', 'Mootez'];
const LAST = ['Trabelsi', 'Gharbi', 'Haddad', 'Jebali', 'Bouaziz', 'Mansouri', 'Hammami', 'Ayari', 'Khelifi', 'Mejri', 'Sassi', 'Ferchichi', 'Dridi', 'Zouari', 'Karoui', 'Mzali', 'Bouslama', 'Masmoudi', 'Riahi', 'Ben Amor', 'Ben Youssef', 'Guesmi', 'Laabidi', 'Martin', 'Dubois', 'Bernard', 'Moreau', 'Laurent', 'Girard', 'Chebbi', 'Saidi', 'Belhaj', 'Kammoun', 'Ellouze', 'Fourati', 'Jaziri', 'Hachicha', 'Baccouche', 'Toumi', 'Cherif'];
const TEACHER_FIRST_F = ['Samia', 'Mouna', 'Olfa', 'Sonia', 'Hela', 'Imen', 'Nadia', 'Rim', 'Anne', 'Julie', 'Sarra', 'Wafa', 'Amira', 'Fatma', 'Manel'];
const TEACHER_FIRST_M = ['Riadh', 'Mourad', 'Kamel', 'Nabil', 'Hichem', 'Lotfi', 'Marc', 'Pierre', 'Fethi', 'Slim', 'Mounir', 'Chokri', 'Adel', 'Habib', 'Thierry'];

/* ---------------------------------- Classes --------------------------------- */

const CLASS_PLAN: { grade: string; key: string; level: SchoolLevel; sections: string[]; size: number }[] = [
  { grade: 'CP', key: 'cp', level: 'primaire', sections: ['A', 'B', 'C'], size: 28 },
  { grade: 'CE1', key: 'ce1', level: 'primaire', sections: ['A', 'B', 'C'], size: 28 },
  { grade: 'CE2', key: 'ce2', level: 'primaire', sections: ['A', 'B', 'C'], size: 28 },
  { grade: 'CM1', key: 'cm1', level: 'primaire', sections: ['A', 'B', 'C'], size: 28 },
  { grade: 'CM2', key: 'cm2', level: 'primaire', sections: ['A', 'B', 'C'], size: 28 },
  { grade: '6ème', key: '6', level: 'college', sections: ['A', 'B', 'C'], size: 30 },
  { grade: '5ème', key: '5', level: 'college', sections: ['A', 'B', 'C'], size: 30 },
  { grade: '4ème', key: '4', level: 'college', sections: ['A', 'B', 'C'], size: 30 },
  { grade: '3ème', key: '3', level: 'college', sections: ['A', 'B', 'C'], size: 30 },
  { grade: '2nde', key: '2nde', level: 'lycee', sections: ['A', 'B', 'C', 'D', 'E'], size: 31 },
  { grade: '1ère', key: '1ere', level: 'lycee', sections: ['A', 'B', 'C', 'D', 'E'], size: 31 },
  { grade: 'Terminale', key: 'tle', level: 'lycee', sections: ['A', 'B', 'C', 'D', 'E'], size: 31 },
];

export interface Directory {
  users: User[];
  students: Student[];
  classes: ClassRoom[];
  teachers: Teacher[];
  studentParents: StudentParent[];
}

/**
 * Builds the whole school directory: 42 classes, 1,245 students, 78 teachers and the
 * parent accounts. The two demo children (Sarah & Adam) are placed in 6ème B and 3ème A.
 */
export function buildDirectory(): Directory {
  const rng = createRng(2026);
  const users: User[] = [];
  const students: Student[] = [];
  const classes: ClassRoom[] = [];
  const teachers: Teacher[] = [];
  const studentParents: StudentParent[] = [];

  /* Named staff & family accounts */
  users.push(
    { id: PARENT_ID, role: 'parent', firstName: 'Mohamed', lastName: 'Ben Ali', title: 'M.', email: 'mohamed.benali@exemple.tn', phone: '+216 98 123 456', schoolCode: 'HZ-P-2041', avatarColor: '#2563EB', activated: true, lastActiveAt: '2026-11-16T16:40:00', preferredLocale: 'fr' },
    { id: PARENT2_ID, role: 'parent', firstName: 'Amira', lastName: 'Ben Ali', title: 'Mme', email: 'amira.benali@exemple.tn', phone: '+216 22 456 789', schoolCode: 'HZ-P-2042', avatarColor: '#EC4899', activated: true, lastActiveAt: '2026-11-15T21:10:00', preferredLocale: 'fr' },
    { id: SARAH_USER_ID, role: 'student', firstName: 'Sarah', lastName: 'Ben Ali', email: 'sarah.benali@eleve.horizon.edu.tn', schoolCode: 'HZ-E-6B14', avatarColor: '#7C3AED', activated: true, lastActiveAt: '2026-11-16T16:50:00', preferredLocale: 'fr' },
    { id: ADMIN_ID, role: 'admin', firstName: 'Nadia', lastName: 'Chaabane', title: 'Mme', email: 'nadia.chaabane@horizon.edu.tn', phone: '+216 71 740 121', schoolCode: 'HZ-A-0001', avatarColor: '#0F766E', activated: true, lastActiveAt: '2026-11-16T16:30:00' },
    { id: STAFF_VIE_SCOLAIRE, role: 'admin', firstName: 'Vie', lastName: 'scolaire', email: 'vie.scolaire@horizon.edu.tn', avatarColor: '#0EA5E9', activated: true },
    { id: STAFF_TRANSPORT, role: 'admin', firstName: 'Service', lastName: 'Transport', email: 'transport@horizon.edu.tn', avatarColor: '#F59E0B', activated: true },
    { id: STAFF_ACCOUNTING, role: 'admin', firstName: 'Service', lastName: 'Comptabilité', email: 'comptabilite@horizon.edu.tn', avatarColor: '#22C55E', activated: true },
  );

  for (const t of NAMED_TEACHERS) {
    const userId = teacherUserId(t.id);
    const email = `${t.firstName}.${t.lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '') + '@horizon.edu.tn';
    users.push({ id: userId, role: 'teacher', title: t.title, firstName: t.firstName, lastName: t.lastName, email, schoolCode: `HZ-T-${t.id.slice(2, 6).toUpperCase()}`, avatarColor: rng.pick(AVATAR_COLORS), activated: true, lastActiveAt: '2026-11-16T15:00:00' });
    teachers.push({ id: t.id, userId, title: t.title, firstName: t.firstName, lastName: t.lastName, subjectIds: [t.subjectId], classIds: t.classIds, email, acceptsMessages: true });
  }

  /* Generated teachers up to 78 */
  for (let i = teachers.length; i < 78; i++) {
    const female = rng.chance(0.55);
    const firstName = rng.pick(female ? TEACHER_FIRST_F : TEACHER_FIRST_M);
    const lastName = rng.pick(LAST);
    const id = `t-gen-${i}`;
    const userId = `u-${id}`;
    const subject = SUBJECTS[i % SUBJECTS.length];
    const email = `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '') + `${i}@horizon.edu.tn`;
    users.push({ id: userId, role: 'teacher', title: female ? 'Mme' : 'M.', firstName, lastName, email, avatarColor: rng.pick(AVATAR_COLORS), activated: rng.chance(0.96), lastActiveAt: '2026-11-16T12:00:00' });
    teachers.push({ id, userId, title: female ? 'Mme' : 'M.', firstName, lastName, subjectIds: [subject.id], classIds: [], email, acceptsMessages: rng.chance(0.9) });
  }

  /* Classes */
  let genTeacherCursor = NAMED_TEACHERS.length;
  for (const plan of CLASS_PLAN) {
    plan.sections.forEach((section, si) => {
      const id = `cls-${plan.key}-${section.toLowerCase()}`;
      const name = `${plan.grade} ${section}`;
      let homeroom = teachers[genTeacherCursor % teachers.length];
      genTeacherCursor++;
      if (id === 'cls-6-b') homeroom = teachers.find((t) => t.id === 't-trabelsi')!;
      if (id === 'cls-3-a') homeroom = teachers.find((t) => t.id === 't-kacem')!;
      if (!homeroom.classIds.includes(id)) homeroom.classIds.push(id);
      const average = id === 'cls-6-b' ? 13.8 : id === 'cls-3-a' ? 12.9 : rng.float(11.6, 14.9);
      classes.push({
        id,
        name,
        level: plan.level,
        grade: plan.grade,
        section,
        homeroomTeacherId: homeroom.id,
        room: `${String.fromCharCode(65 + (si % 3))}${String(rng.int(1, 18)).padStart(2, '0')}`,
        studentCount: plan.size,
        average,
      });
    });
  }

  /* Students & parents */
  let parentSeq = 0;
  let studentSeq = 0;
  const birthYearFor = (grade: string) => {
    const order = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
    return 2020 - order.indexOf(grade);
  };

  for (const cls of classes) {
    for (let i = 0; i < cls.studentCount; i++) {
      let student: Student;
      const isSarah = cls.id === 'cls-6-b' && i === 13;
      const isAdam = cls.id === 'cls-3-a' && i === 0;
      if (isSarah) {
        student = { id: SARAH_ID, userId: SARAH_USER_ID, firstName: 'Sarah', lastName: 'Ben Ali', gender: 'F', birthDate: '2015-03-14', classId: cls.id, studentNumber: 'HZ-E-6B14', avatarColor: '#7C3AED', enrolledAt: '2021-09-01' };
      } else if (isAdam) {
        student = { id: ADAM_ID, firstName: 'Adam', lastName: 'Ben Ali', gender: 'M', birthDate: '2012-07-02', classId: cls.id, studentNumber: 'HZ-E-3A01', avatarColor: '#0EA5E9', enrolledAt: '2018-09-03' };
      } else {
        const female = rng.chance(0.5);
        studentSeq++;
        const year = birthYearFor(cls.grade);
        student = {
          id: `stu-${String(studentSeq).padStart(4, '0')}`,
          firstName: rng.pick(female ? FIRST_F : FIRST_M),
          lastName: rng.pick(LAST),
          gender: female ? 'F' : 'M',
          birthDate: `${year}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`,
          classId: cls.id,
          studentNumber: `HZ-E-${String(studentSeq).padStart(4, '0')}`,
          avatarColor: rng.pick(AVATAR_COLORS),
          enrolledAt: `${rng.int(2015, 2026)}-09-01`,
        };
      }
      students.push(student);

      if (isSarah || isAdam) {
        studentParents.push(
          { studentId: student.id, parentId: PARENT_ID, relation: 'père', isPrimaryContact: true },
          { studentId: student.id, parentId: PARENT2_ID, relation: 'mère', isPrimaryContact: false },
        );
        continue;
      }

      parentSeq++;
      const parentFemale = rng.chance(0.55);
      const pid = `u-par-${String(parentSeq).padStart(4, '0')}`;
      const pFirst = rng.pick(parentFemale ? TEACHER_FIRST_F : TEACHER_FIRST_M);
      users.push({
        id: pid,
        role: 'parent',
        title: parentFemale ? 'Mme' : 'M.',
        firstName: pFirst,
        lastName: student.lastName,
        email: `${pFirst}.${student.lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '') + `${parentSeq}@exemple.tn`,
        phone: `+216 ${rng.int(20, 99)} ${rng.int(100, 999)} ${rng.int(100, 999)}`,
        avatarColor: rng.pick(AVATAR_COLORS),
        // 87% of families have activated the app.
        activated: rng.chance(0.87),
        lastActiveAt: `2026-11-${String(rng.int(9, 16)).padStart(2, '0')}T${String(rng.int(7, 21)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}:00`,
      });
      studentParents.push({ studentId: student.id, parentId: pid, relation: parentFemale ? 'mère' : 'père', isPrimaryContact: true });
    }
  }

  /* Assign generated teachers to a few classes each (for admin listings). */
  const genTeachers = teachers.filter((t) => t.id.startsWith('t-gen-'));
  classes.forEach((c, i) => {
    for (let k = 0; k < 3; k++) {
      const t = genTeachers[(i * 3 + k) % genTeachers.length];
      if (!t.classIds.includes(c.id)) t.classIds.push(c.id);
    }
  });

  return { users, students, classes, teachers, studentParents };
}
