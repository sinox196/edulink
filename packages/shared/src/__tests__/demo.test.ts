import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADAM_ID,
  attendanceFor,
  attendanceStats,
  canMessage,
  canViewStudent,
  createDemoDatabase,
  dailyDigest,
  generalAverage,
  homeworkFor,
  PARENT_ID,
  priorityItems,
  progressSummary,
  riskInsights,
  SARAH_ID,
  schoolKpis,
  searchAll,
  subjectSummaries,
  teacherUserId,
  visibleStudents,
  weeklySummary,
} from '../index';

const db = createDemoDatabase();
const parent = { id: PARENT_ID, role: 'parent' as const };

test('school directory matches the brief', () => {
  const k = schoolKpis(db);
  assert.equal(k.students, 1245);
  assert.equal(k.teachers, 78);
  assert.equal(k.classes, 42);
  assert.equal(k.attendanceRate, 94);
  assert.equal(k.absencesToday, 72);
  assert.equal(k.lateToday, 18);
  assert.equal(k.paymentsPending, 32);
  assert.equal(k.upcomingEvents, 4);
});

test("Sarah's academic figures", () => {
  const avg = generalAverage(db, SARAH_ID)!;
  assert.equal(avg.average, 15.4);
  assert.equal(avg.classAverage, 13.8);
  const subs = Object.fromEntries(subjectSummaries(db, SARAH_ID).map((s) => [s.subject.id, s]));
  assert.equal(subs['sub-maths'].average, 17);
  assert.equal(subs['sub-maths'].classAverage, 14.2);
  assert.equal(subs['sub-fr'].average, 15);
  assert.equal(subs['sub-fr'].classAverage, 13.7);
  assert.equal(subs['sub-en'].average, 18);
  assert.equal(subs['sub-en'].classAverage, 15.1);
  assert.equal(subs['sub-sci'].average, 14);
  assert.equal(subs['sub-sci'].classAverage, 13.2);
  assert.equal(subs['sub-maths'].trend, 2.3);
  assert.equal(subs['sub-fr'].trend, 1.1);
  assert.equal(subs['sub-sci'].trend, -0.8);
});

test("Sarah's attendance", () => {
  const s = attendanceStats(attendanceFor(db, SARAH_ID));
  assert.equal(s.rate, 96);
  assert.equal(s.absences, 2);
  assert.equal(s.late, 1);
  assert.equal(s.excused, 1);
  assert.equal(s.pendingJustification, 1);
});

test('homework, digest and summaries', () => {
  const hw = homeworkFor(db, SARAH_ID);
  assert.equal(hw.filter((h) => h.status === 'todo').length, 3);
  assert.equal(hw.filter((h) => h.status === 'late').length, 1);
  const d = dailyDigest(db, SARAH_ID)!;
  assert.equal(d.attendance?.status, 'present');
  assert.equal(d.newHomework, 1);
  assert.deepEqual(d.newGrades.map((g) => [g.subjectId, g.score]), [['sub-fr', 16]]);
  const w = weeklySummary(db, SARAH_ID);
  assert.equal(w.positiveFeedback, 2);
  const summary = progressSummary(db, SARAH_ID, 'fr');
  assert.match(summary, /progresse particulièrement en mathématiques et en anglais/);
  assert.match(summary, /sciences/);
  const risks = riskInsights(db, SARAH_ID, 'fr');
  assert.ok(risks.some((r) => r.kind === 'grades' && /sciences ont légèrement baissé/.test(r.body)));
  const prio = priorityItems(db, SARAH_ID, 'fr').map((p) => p.text);
  assert.ok(prio.includes('2 devoirs pour demain'));
  assert.ok(prio.includes('Nouvelle note en Mathématiques : 17/20'));
  assert.ok(prio.some((p) => p.startsWith('Réunion parents-professeurs vendredi')));
  assert.ok(prio.some((p) => p.includes('Musée du Bardo')));
});

test('parents only see their own children', () => {
  const kids = visibleStudents(db, parent).map((s) => s.id).sort();
  assert.deepEqual(kids, [ADAM_ID, SARAH_ID].sort());
  const stranger = db.students.find((s) => s.classId === 'cls-6-b' && s.id !== SARAH_ID)!;
  assert.equal(canViewStudent(db, parent, stranger.id), false);
  // Search never leaks other students, even when asked by name.
  const res = searchAll(db, parent, [SARAH_ID, stranger.id], stranger.firstName, 'fr');
  assert.ok(res.every((r) => !r.title.includes(stranger.lastName)));
});

test('teachers only see authorised classes', () => {
  const teacher = { id: teacherUserId('t-bensalem'), role: 'teacher' as const };
  assert.equal(canViewStudent(db, teacher, SARAH_ID), true);
  assert.equal(canViewStudent(db, teacher, ADAM_ID), false);
  assert.equal(canMessage(db, parent, teacher), true);
  const kacem = { id: teacherUserId('t-kacem'), role: 'teacher' as const };
  assert.equal(canMessage(db, parent, kacem), true);
  const other = { id: teacherUserId('t-gen-40'), role: 'teacher' as const };
  assert.equal(canMessage(db, parent, other), false);
});

test('universal search groups results', () => {
  const res = searchAll(db, parent, [SARAH_ID, ADAM_ID], 'mathématiques', 'fr');
  const groups = new Set(res.map((r) => r.group));
  assert.ok(groups.has('grades'));
  assert.ok(groups.has('homework'));
  assert.ok(searchAll(db, parent, [SARAH_ID], 'bulletin', 'fr').some((r) => r.link === '/report-cards'));
  assert.ok(searchAll(db, parent, [SARAH_ID], 'sortie scolaire', 'fr').some((r) => r.group === 'events'));
});
