// Acesso ao Postgres — SOMENTE no servidor (route handlers).
// A connection string vem de process.env.DATABASE_URL e nunca é exposta ao browser.

import { Pool } from "pg"

const globalForPg = globalThis as unknown as { _pgPool?: Pool }

function pool(): Pool {
  if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      max: 3,
      connectionTimeoutMillis: 8000,
    })
  }
  return globalForPg._pgPool
}

let schemaReady = false

async function ensureSchema(): Promise<void> {
  if (schemaReady) return
  await pool().query(`
    CREATE TABLE IF NOT EXISTS clients (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      api_key_enc TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  schemaReady = true
}

export interface AccountRow {
  id: string
  name: string
  email: string
  phone: string | null
  password_hash: string
  api_key_enc: string
  created_at: string
}

export interface NewAccount {
  name: string
  email: string
  phone: string | null
  passwordHash: string
  apiKeyEnc: string
}

/** Cria uma conta. Lança erro 'EMAIL_TAKEN' se o e-mail já existir. */
export async function createAccount(a: NewAccount): Promise<string> {
  await ensureSchema()
  try {
    const r = await pool().query(
      `INSERT INTO accounts (name, email, phone, password_hash, api_key_enc)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [a.name, a.email, a.phone, a.passwordHash, a.apiKeyEnc],
    )
    return r.rows[0].id as string
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505") {
      throw new Error("EMAIL_TAKEN")
    }
    throw e
  }
}

export async function getAccountByEmail(email: string): Promise<AccountRow | null> {
  await ensureSchema()
  const r = await pool().query(`SELECT * FROM accounts WHERE email = $1`, [email])
  return (r.rows[0] as AccountRow) ?? null
}

export async function getAccountById(id: string): Promise<AccountRow | null> {
  await ensureSchema()
  const r = await pool().query(`SELECT * FROM accounts WHERE id = $1`, [id])
  return (r.rows[0] as AccountRow) ?? null
}

/** Lista contas para o admin (sem senha/chave). */
export async function listAccounts(): Promise<ClientRow[]> {
  await ensureSchema()
  const r = await pool().query(
    `SELECT id, name, email, phone, created_at, updated_at FROM accounts ORDER BY created_at DESC`,
  )
  return r.rows as ClientRow[]
}

export async function deleteAccount(id: string): Promise<void> {
  await ensureSchema()
  await pool().query(`DELETE FROM accounts WHERE id = $1`, [id])
}

export interface ClientInput {
  name: string
  email: string
  phone: string | null
}

/** Cria ou atualiza um cliente (chave: e-mail). */
export async function upsertClient(c: ClientInput): Promise<void> {
  await ensureSchema()
  await pool().query(
    `INSERT INTO clients (name, email, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, updated_at = now()`,
    [c.name, c.email, c.phone],
  )
}

export interface ClientRow {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
}

/** Lista todos os clientes (mais recentes primeiro). */
export async function listClients(): Promise<ClientRow[]> {
  await ensureSchema()
  const r = await pool().query(
    `SELECT id, name, email, phone, created_at, updated_at FROM clients ORDER BY created_at DESC`,
  )
  return r.rows as ClientRow[]
}

/** Remove um cliente pelo id. */
export async function deleteClient(id: string): Promise<void> {
  await ensureSchema()
  await pool().query(`DELETE FROM clients WHERE id = $1`, [id])
}
