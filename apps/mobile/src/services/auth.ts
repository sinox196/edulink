import type { EduLinkDatabase, Session, User } from '@edulink/shared';
import { normalize } from '@edulink/shared';

/**
 * Demo authentication service.
 * Production: POST /auth/login on the API → verifies the scrypt hash stored in PostgreSQL
 * (packages/db), returns a short-lived JWT access token + rotating refresh token.
 * The prototype mirrors the same rules locally: identifier by e-mail, phone or school ID,
 * lockout after 5 failed attempts, 12-hour session.
 */
export const DEMO_PASSWORD = 'edulink2026';
export const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_HOURS = 12;

export type LoginMethod = 'email' | 'phone' | 'schoolId';

const attempts = new Map<string, { count: number; lockedUntil?: number }>();

export type LoginResult =
  | { ok: true; user: User; session: Session }
  | { ok: false; error: 'required' | 'invalid' | 'locked'; attemptsLeft?: number };

const digits = (s: string) => s.replace(/\D/g, '');

export function findUser(db: EduLinkDatabase, method: LoginMethod, identifier: string): User | undefined {
  const id = identifier.trim();
  if (!id) return undefined;
  return db.users.find((u) => {
    if (method === 'email') return normalize(u.email) === normalize(id);
    if (method === 'phone') return !!u.phone && digits(u.phone).endsWith(digits(id)) && digits(id).length >= 8;
    return !!u.schoolCode && u.schoolCode.toUpperCase() === id.toUpperCase();
  });
}

function randomToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 48; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function login(db: EduLinkDatabase, method: LoginMethod, identifier: string, password: string): LoginResult {
  if (!identifier.trim() || !password) return { ok: false, error: 'required' };
  const key = `${method}:${normalize(identifier.trim())}`;
  const state = attempts.get(key) ?? { count: 0 };
  if (state.lockedUntil && state.lockedUntil > Date.now()) return { ok: false, error: 'locked' };

  const user = findUser(db, method, identifier);
  // Only the named demo accounts have a password in the prototype.
  const valid = !!user && !!user.schoolCode && user.activated && password === DEMO_PASSWORD;
  if (!valid) {
    state.count += 1;
    if (state.count >= MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCK_MS;
      state.count = 0;
      attempts.set(key, state);
      return { ok: false, error: 'locked' };
    }
    attempts.set(key, state);
    return { ok: false, error: 'invalid', attemptsLeft: MAX_ATTEMPTS - state.count };
  }
  attempts.delete(key);
  const now = new Date();
  return {
    ok: true,
    user: user!,
    session: {
      userId: user!.id,
      role: user!.role,
      token: randomToken(),
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_HOURS * 3600_000).toISOString(),
    },
  };
}

export function isSessionValid(session: Session | null): session is Session {
  return !!session && new Date(session.expiresAt).getTime() > Date.now();
}

/** Activation codes are 6 digits; in the demo any 6-digit code works with a strong password. */
export function validateActivation(code: string, password: string): boolean {
  return /^\d{6}$/.test(code.trim()) && password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export const DEMO_ACCOUNTS: { role: User['role']; email: string; label: string }[] = [
  { role: 'parent', email: 'mohamed.benali@exemple.tn', label: 'Mohamed Ben Ali' },
  { role: 'student', email: 'sarah.benali@eleve.horizon.edu.tn', label: 'Sarah Ben Ali' },
  { role: 'teacher', email: 'leila.bensalem@horizon.edu.tn', label: 'Mme Ben Salem' },
  { role: 'admin', email: 'nadia.chaabane@horizon.edu.tn', label: 'Mme Chaabane' },
];
