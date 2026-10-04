import type pg from 'pg';
import { createDemoDatabase, PARENT_ID, PARENT2_ID, SARAH_USER_ID, ADMIN_ID, NAMED_TEACHERS, teacherUserId } from '@edulink/shared';
import { createPool } from './client';
import { hashPassword } from './password';

/** Demo password for the named accounts (stored as a scrypt hash). */
export const DEMO_PASSWORD = 'edulink2026';

type Row = Record<string, unknown>;

async function insertMany(client: pg.PoolClient, table: string, rows: Row[], chunk = 400) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const values: unknown[] = [];
    const tuples = part.map((row, r) => {
      const ph = columns.map((c, k) => {
        const v = row[c];
        values.push(v !== null && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : v);
        return `$${r * columns.length + k + 1}`;
      });
      return `(${ph.join(', ')})`;
    });
    await client.query(`insert into ${table} (${columns.join(', ')}) values ${tuples.join(', ')}`, values);
  }
  console.log(`  ${table.padEnd(26)} ${rows.length}`);
}

const json = (v: unknown) => JSON.stringify(v ?? null);

const TABLES = [
  'audit_logs', 'user_sessions', 'push_tokens', 'notification_preferences', 'notifications', 'dietary_profiles', 'canteen_menus',
  'club_registrations', 'clubs', 'appointments', 'appointment_slots', 'transport_live', 'bus_assignments', 'transport_routes',
  'buses', 'payments', 'document_signatures', 'documents', 'messages', 'conversation_participants', 'conversations',
  'event_participants', 'events', 'news', 'announcement_acks', 'announcements', 'teacher_feedback', 'report_cards',
  'homework_completions', 'homework', 'exams', 'grades', 'attendance', 'attendance_sessions', 'timetables', 'teacher_classes',
  'student_parents', 'students', 'classes', 'subjects', 'teachers', 'administrators', 'parents', 'holidays', 'users', 'schools',
];
const AUDITED = ['grades', 'attendance', 'announcements', 'payments', 'documents', 'student_parents', 'report_cards', 'teacher_classes'];

async function main() {
  const db = createDemoDatabase();
  const S = db.school.id;
  const pool = createPool();
  const client = await pool.connect();
  const userIds = new Set(db.users.map((u) => u.id));
  try {
    const existing = Number((await client.query('select count(*) n from schools')).rows[0].n);
    if (existing > 0 && !process.argv.includes('--force') && process.env.SEED_FORCE !== '1') {
      console.log('Base déjà initialisée — données conservées (utilisez --force pour réinitialiser la démo).');
      return;
    }
    await client.query('begin');
    await client.query(`truncate ${TABLES.join(', ')} restart identity cascade`);
    for (const t of AUDITED) await client.query(`alter table ${t} disable trigger user`);

    console.log('Insertion des données de démonstration :');
    await insertMany(client, 'schools', [{
      id: S, name: db.school.name, short_name: db.school.shortName, city: db.school.city, address: db.school.address,
      phone: db.school.phone, email: db.school.email, website: db.school.website, principal: db.school.principal,
      primary_language: db.school.primaryLanguage, levels: db.school.levels, academic_year: db.school.academicYear,
      currency: db.school.currency, modules: json(db.school.modules), messaging_policy: json(db.school.messaging),
    }]);
    await insertMany(client, 'users', db.users.map((u) => ({
      id: u.id, school_id: S, role: u.role, first_name: u.firstName, last_name: u.lastName, title: u.title ?? null,
      email: u.email, phone: u.phone ?? null, school_code: u.schoolCode ?? null, avatar_color: u.avatarColor,
      activated: u.activated, preferred_locale: u.preferredLocale ?? null, last_active_at: u.lastActiveAt ?? null,
    })));
    await insertMany(client, 'parents', db.users.filter((u) => u.role === 'parent').map((u) => ({ user_id: u.id })));
    await insertMany(client, 'administrators', db.users.filter((u) => u.role === 'admin').map((u) => ({ user_id: u.id, job_title: u.id === ADMIN_ID ? 'Directrice' : `${u.firstName} ${u.lastName}` })));
    await insertMany(client, 'teachers', db.teachers.map((t) => ({ id: t.id, user_id: t.userId, school_id: S, accepts_messages: t.acceptsMessages })));
    await insertMany(client, 'subjects', db.subjects.map((s) => ({ id: s.id, school_id: S, name: s.name, short_name: s.shortName, color: s.color, icon: s.icon, coefficient: s.coefficient })));
    await insertMany(client, 'classes', db.classes.map((c) => ({ id: c.id, school_id: S, name: c.name, level: c.level, grade: c.grade, section: c.section, homeroom_teacher_id: c.homeroomTeacherId, room: c.room, academic_year: db.school.academicYear })));
    await insertMany(client, 'students', db.students.map((s) => ({ id: s.id, school_id: S, user_id: s.userId ?? null, class_id: s.classId, first_name: s.firstName, last_name: s.lastName, gender: s.gender, birth_date: s.birthDate, student_number: s.studentNumber, avatar_color: s.avatarColor, enrolled_at: s.enrolledAt })));
    await insertMany(client, 'student_parents', db.studentParents.map((l) => ({ student_id: l.studentId, parent_id: l.parentId, relation: l.relation, is_primary_contact: l.isPrimaryContact })));
    await insertMany(client, 'teacher_classes', db.teachers.flatMap((t) => t.classIds.map((c) => ({ teacher_id: t.id, class_id: c, subject_id: t.subjectIds[0] ?? null }))));
    await insertMany(client, 'timetables', db.timetable.map((s) => ({ id: s.id, class_id: s.classId, day: s.day, starts_at: s.start, ends_at: s.end, subject_id: s.subjectId, label: s.label ?? null, room: s.room ?? null, teacher_id: s.teacherId ?? null })));
    await insertMany(client, 'attendance', db.attendance.map((a) => ({
      id: a.id, student_id: a.studentId, date: a.date, status: a.status, check_in: a.checkIn ?? null, check_out: a.checkOut ?? null,
      minutes_late: a.minutesLate ?? null, source: a.source, note: a.note ?? null,
      justification_reason: a.justification?.reason ?? null, justification_message: a.justification?.message ?? null,
      justification_document: a.justification?.attachmentName ?? null, justification_submitted_at: a.justification?.submittedAt ?? null,
      justification_submitted_by: a.justification?.submittedBy ?? null, justification_status: a.justification?.status ?? null,
    })));
    await insertMany(client, 'grades', db.grades.map((g) => ({ id: g.id, student_id: g.studentId, subject_id: g.subjectId, teacher_id: g.teacherId, exam_name: g.examName, date: g.date, score: g.score, out_of: g.outOf, coefficient: g.coefficient, class_average: g.classAverage, comment: g.comment ?? null, term: g.term })));
    await insertMany(client, 'exams', db.exams.map((e) => ({ id: e.id, class_id: e.classId, subject_id: e.subjectId, teacher_id: e.teacherId, title: e.title, date: e.date, starts_at: e.time, duration_minutes: e.durationMinutes, room: e.room, chapters: e.chapters, revision_docs: json(e.revisionDocs) })));
    await insertMany(client, 'homework', db.homework.map((h) => ({ id: h.id, class_id: h.classId, subject_id: h.subjectId, teacher_id: h.teacherId, title: h.title, description: h.description, assigned_at: h.assignedAt, due_date: h.dueDate, estimated_minutes: h.estimatedMinutes ?? null, attachments: json(h.attachments) })));
    await insertMany(client, 'homework_completions', db.homeworkCompletions.map((c) => ({ homework_id: c.homeworkId, student_id: c.studentId, completed_at: c.completedAt })));
    await insertMany(client, 'report_cards', db.reportCards.map((r) => ({ id: r.id, student_id: r.studentId, academic_year: r.academicYear, class_label: r.classLabel, period: r.period, term: r.term, average: r.average, class_average: r.classAverage, rank: r.rank ?? null, class_size: r.classSize ?? null, subjects: json(r.subjects), teacher_observation: r.teacherObservation, principal_comment: r.principalComment, mention: r.mention ?? null, published_at: r.publishedAt, status: r.status })));
    await insertMany(client, 'teacher_feedback', db.feedback.map((f) => ({ id: f.id, student_id: f.studentId, teacher_id: f.teacherId, subject_id: f.subjectId ?? null, kind: f.kind, text: f.text, date: f.date })));
    await insertMany(client, 'announcements', db.announcements.map((a) => ({ id: a.id, school_id: S, title: a.title, body: a.body, published_at: a.publishedAt, author_id: a.authorId, author_name: a.authorName, scope: a.scope, class_ids: a.classIds, category: a.category, priority: a.priority, requires_ack: a.requiresAck, recipient_count: a.recipientCount })));
    await insertMany(client, 'announcement_acks', db.announcements.flatMap((a) => a.acknowledgedBy.filter((u) => userIds.has(u)).map((u) => ({ announcement_id: a.id, user_id: u }))));
    await insertMany(client, 'news', db.news.map((n) => ({ id: n.id, school_id: S, title: n.title, excerpt: n.excerpt, body: n.body, published_at: n.publishedAt, category: n.category, cover: json(n.cover), read_minutes: n.readMinutes })));
    await insertMany(client, 'events', db.events.map((e) => ({ id: e.id, school_id: S, title: e.title, emoji: e.emoji, description: e.description, date: e.date, starts_at: e.time ?? null, ends_at: e.endTime ?? null, location: e.location, category: e.category, class_ids: e.classIds, requires_authorization: e.requiresAuthorization, cost: e.cost ?? null, organizer: e.organizer })));
    await insertMany(client, 'event_participants', db.eventParticipants.map((p) => ({ event_id: p.eventId, student_id: p.studentId, response: p.response ?? null, authorization_signed_at: p.authorizationSignedAt ?? null, signed_by: p.signedBy ?? null })));
    await insertMany(client, 'conversations', db.conversations.map((c) => ({ id: c.id, school_id: S, category: c.category, student_id: c.studentId ?? null, title: c.title, subtitle: c.subtitle, avatar_color: c.avatarColor })));
    await insertMany(client, 'conversation_participants', db.conversations.flatMap((c) => c.participantIds.map((u) => ({ conversation_id: c.id, user_id: u }))));
    await insertMany(client, 'messages', db.messages.map((m) => ({ id: m.id, conversation_id: m.conversationId, sender_id: m.senderId, body: m.body, sent_at: m.sentAt, read_at: m.readAt ?? null, attachment: m.attachment ? json(m.attachment) : null })));
    await insertMany(client, 'documents', db.documents.map((d) => ({ id: d.id, school_id: S, title: d.title, category: d.category, date: d.date, size: d.size, file_type: d.fileType, storage_path: `documents/${S}/${d.id}.${d.fileType}`, student_id: d.studentId ?? null, class_ids: d.classIds ?? null, requires_signature: d.requiresSignature, shared_by: d.sharedBy ?? null })));
    await insertMany(client, 'document_signatures', db.documents.filter((d) => d.signedAt && d.signedBy).map((d) => ({ document_id: d.id, user_id: d.signedBy, signed_at: d.signedAt })));
    await insertMany(client, 'payments', db.payments.map((p) => ({ id: p.id, student_id: p.studentId, category: p.category, label: p.label, amount: p.amount, due_date: p.dueDate, status: p.status, paid_at: p.paidAt ?? null, receipt_number: p.receiptNumber ?? null, method: p.method ?? null })));
    await insertMany(client, 'buses', db.buses.map((b) => ({ id: b.id, school_id: S, number: b.number, driver_first_name: b.driverFirstName, plate: b.plate, capacity: b.capacity })));
    await insertMany(client, 'transport_routes', db.routes.map((r) => ({ id: r.id, bus_id: r.busId, name: r.name, direction: r.direction, stops: json(r.stops) })));
    await insertMany(client, 'bus_assignments', db.busAssignments.map((a) => ({ student_id: a.studentId, bus_id: a.busId, morning_route_id: a.morningRouteId, evening_route_id: a.eveningRouteId, stop_name: a.stopName })));
    const routeIds = new Set(db.routes.map((r) => r.id));
    await insertMany(client, 'transport_live', db.transportLive.map((l) => ({ bus_id: l.busId, route_id: routeIds.has(l.routeId) ? l.routeId : null, state: l.state, next_stop_index: l.nextStopIndex, delay_minutes: l.delayMinutes, updated_at: l.updatedAt })));
    await insertMany(client, 'notifications', db.notifications.map((n) => ({ id: n.id, user_id: n.userId, student_id: n.studentId ?? null, category: n.category, title: n.title, body: n.body, link: n.link ?? null, created_at: n.createdAt, read: n.read })));
    await insertMany(client, 'appointment_slots', db.appointmentSlots.map((s) => ({ id: s.id, teacher_id: s.teacherId, date: s.date, starts_at: s.start, ends_at: s.end, booked_by: s.bookedBy && userIds.has(s.bookedBy) ? s.bookedBy : null })));
    const slotIds = new Set(db.appointmentSlots.map((s) => s.id));
    await insertMany(client, 'appointments', db.appointments.map((a) => ({ id: a.id, slot_id: slotIds.has(a.slotId) ? a.slotId : null, parent_id: a.parentId, teacher_id: a.teacherId, student_id: a.studentId, date: a.date, starts_at: a.start, ends_at: a.end, reason: a.reason, mode: a.mode, status: a.status })));
    await insertMany(client, 'clubs', db.clubs.map((c) => ({ id: c.id, school_id: S, name: c.name, emoji: c.emoji, description: c.description, schedule: c.schedule, supervisor: c.supervisor, capacity: c.capacity, levels: c.levels, fee: c.fee ?? null })));
    await insertMany(client, 'club_registrations', db.clubRegistrations.map((r) => ({ club_id: r.clubId, student_id: r.studentId, status: r.status, registered_at: r.registeredAt })));
    await insertMany(client, 'canteen_menus', db.canteenMenus.map((m) => ({ school_id: S, date: m.date, starter: m.starter, main: m.main, side: m.side ?? null, dessert: m.dessert, vegetarian: m.vegetarian, allergens: m.allergens })));
    await insertMany(client, 'dietary_profiles', db.dietaryProfiles.map((d) => ({ student_id: d.studentId, allergies: d.allergies, preferences: d.preferences, notes: d.notes })));
    await insertMany(client, 'holidays', db.holidays.map((h) => ({ id: h.id, school_id: S, label: h.label, starts_on: h.start, ends_on: h.end })));
    await insertMany(client, 'audit_logs', db.auditLogs.map((l) => ({ at: l.at, actor_id: l.actorId, actor_name: l.actorName, action: l.action, target: l.target })));

    // Mot de passe de démonstration (haché avec scrypt, sel unique par compte) pour les comptes nommés.
    const demoAccounts = [PARENT_ID, PARENT2_ID, SARAH_USER_ID, ADMIN_ID, ...NAMED_TEACHERS.map((t) => teacherUserId(t.id))];
    for (const id of demoAccounts) {
      await client.query('update users set password_hash = $1 where id = $2', [hashPassword(DEMO_PASSWORD), id]);
    }

    for (const t of AUDITED) await client.query(`alter table ${t} enable trigger user`);
    await client.query('commit');
    console.log(`✓ Données de démonstration chargées (${demoAccounts.length} comptes de démo, mot de passe « ${DEMO_PASSWORD} »).`);
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
