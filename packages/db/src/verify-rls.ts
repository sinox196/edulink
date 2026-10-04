import assert from 'node:assert/strict';
import type pg from 'pg';
import { ADAM_ID, PARENT_ID, SARAH_ID, SARAH_USER_ID, ADMIN_ID, teacherUserId } from '@edulink/shared';
import { createPool } from './client';

/**
 * Executes each check as a real application user (role edulink_app + app.user_id), inside a
 * transaction that is always rolled back, to prove the row-level security rules hold.
 */
async function as<T>(pool: pg.Pool, userId: string, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role edulink_app');
    await c.query(`select set_config('app.user_id', $1, true)`, [userId]);
    return await fn(c);
  } finally {
    await c.query('rollback');
    c.release();
  }
}

const count = async (c: pg.PoolClient, sql: string, params: unknown[] = []) => Number((await c.query(sql, params)).rows[0].n);

const checks: [string, (pool: pg.Pool) => Promise<void>][] = [
  ['Un parent ne voit que ses deux enfants', (pool) => as(pool, PARENT_ID, async (c) => {
    const rows = (await c.query('select id from students order by id')).rows.map((r) => r.id);
    assert.deepEqual(rows, [ADAM_ID, SARAH_ID].sort());
  })],
  ["Un parent ne voit aucune note, présence ou paiement d'un autre élève", (pool) => as(pool, PARENT_ID, async (c) => {
    assert.equal(await count(c, `select count(*) n from grades where student_id not in ($1, $2)`, [SARAH_ID, ADAM_ID]), 0);
    assert.equal(await count(c, `select count(*) n from attendance where student_id not in ($1, $2)`, [SARAH_ID, ADAM_ID]), 0);
    assert.equal(await count(c, `select count(*) n from payments where student_id not in ($1, $2)`, [SARAH_ID, ADAM_ID]), 0);
    assert.ok((await count(c, `select count(*) n from grades where student_id = $1`, [SARAH_ID])) > 0);
  })],
  ['Un parent ne peut pas ajouter de note', (pool) => as(pool, PARENT_ID, async (c) => {
    await assert.rejects(c.query(`insert into grades (student_id, subject_id, teacher_id, exam_name, date, score, term) values ($1, 'sub-maths', 't-bensalem', 'Fraude', current_date, 20, 1)`, [SARAH_ID]));
  })],
  ["Un parent peut justifier l'absence de son enfant, pas celle d'un autre", (pool) => as(pool, PARENT_ID, async (c) => {
    await c.query(`select app.justify_absence('att-stu-sarah-2026-11-10', 'illness', 'Fièvre', null)`);
    const r = (await c.query(`select justification_status from attendance where id = 'att-stu-sarah-2026-11-10'`)).rows[0];
    assert.equal(r.justification_status, 'pending');
    await c.query('savepoint s');
    await assert.rejects(c.query(`select app.justify_absence((select id from attendance where student_id = 'stu-0001' limit 1), 'other', 'x', null)`));
    await c.query('rollback to savepoint s');
  })],
  ['Une enseignante voit ses classes autorisées uniquement', (pool) => as(pool, teacherUserId('t-bensalem'), async (c) => {
    const n = await count(c, `select count(*) n from students`);
    assert.equal(n, 120); // 6ème A, 6ème B, 5ème A, 4ème B × 30
    assert.equal(await count(c, `select count(*) n from students where id = $1`, [ADAM_ID]), 0);
    assert.equal(await count(c, `select count(*) n from payments`), 0);
  })],
  ['Une enseignante peut noter un élève de sa classe (et cela est audité)', (pool) => as(pool, teacherUserId('t-bensalem'), async (c) => {
    await c.query(`insert into grades (student_id, subject_id, teacher_id, exam_name, date, score, term) values ($1, 'sub-maths', 't-bensalem', 'Test RLS', current_date, 15, 1)`, [SARAH_ID]);
    assert.equal(await count(c, `select count(*) n from grades where exam_name = 'Test RLS'`), 1);
    // L'enseignante ne peut pas lire le journal d'audit…
    assert.equal(await count(c, `select count(*) n from audit_logs`), 0);
    await c.query('savepoint s');
    await assert.rejects(c.query(`insert into grades (student_id, subject_id, teacher_id, exam_name, date, score, term) values ($1, 'sub-maths', 't-bensalem', 'Hors classe', current_date, 15, 1)`, [ADAM_ID]));
    await c.query('rollback to savepoint s');
    // …mais l'écriture y a bien été tracée avec son identité.
    await c.query('reset role');
    assert.equal(await count(c, `select count(*) n from audit_logs where action = 'insert grades' and actor_id = $1`, [teacherUserId('t-bensalem')]), 1);
  })],
  ['Une enseignante ne peut pas publier une alerte critique à toute l\'école', (pool) => as(pool, teacherUserId('t-bensalem'), async (c) => {
    await assert.rejects(c.query(`insert into announcements (school_id, title, body, author_id, author_name, scope, category, priority) values ('sch-horizon', 'x', 'y', $1, 'x', 'school', 'general', 'critical')`, [teacherUserId('t-bensalem')]));
  })],
  ['Une élève ne voit que son propre dossier', (pool) => as(pool, SARAH_USER_ID, async (c) => {
    assert.deepEqual((await c.query('select id from students')).rows.map((r) => r.id), [SARAH_ID]);
    assert.equal(await count(c, `select count(*) n from payments`), 0);
  })],
  ["L'administration voit tout l'établissement et le journal d'audit", (pool) => as(pool, ADMIN_ID, async (c) => {
    assert.equal(await count(c, `select count(*) n from students`), 1245);
    assert.ok((await count(c, `select count(*) n from audit_logs`)) > 0);
    const rate = Number((await c.query(`select app.ack_rate('ann-elections') r`)).rows[0].r);
    assert.ok(rate > 70 && rate < 80);
  })],
  ['Les messages ne sont visibles que des participants', (pool) => as(pool, teacherUserId('t-martin'), async (c) => {
    assert.equal(await count(c, `select count(*) n from messages where conversation_id = 'conv-bensalem'`), 0);
  })],
  ['Sans identité, aucune donnée', (pool) => as(pool, '', async (c) => {
    assert.equal(await count(c, `select count(*) n from students`), 0);
    assert.equal(await count(c, `select count(*) n from users`), 0);
  })],
];

async function main() {
  const pool = createPool();
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      await fn(pool);
      console.log(`✓ ${name}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${name}\n    ${(err as Error).message.split('\n')[0]}`);
    }
  }
  await pool.end();
  console.log(failed ? `\n${failed} contrôle(s) en échec` : `\nTous les contrôles de sécurité sont passés (${checks.length}).`);
  process.exit(failed ? 1 : 0);
}

main();
