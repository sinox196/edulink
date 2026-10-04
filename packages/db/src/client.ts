import pg from 'pg';

export function connectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
  if (!url) {
    throw new Error('DATABASE_URL manquant — copiez DATABASE_PUBLIC_URL depuis le service Postgres sur Railway (voir .env.example).');
  }
  return url;
}

export function createPool(): pg.Pool {
  const url = connectionString();
  const internal = url.includes('.railway.internal') || url.includes('localhost') || url.includes('127.0.0.1');
  return new pg.Pool({ connectionString: url, ssl: internal ? undefined : { rejectUnauthorized: false }, max: 4 });
}
