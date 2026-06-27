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
  `)
  schemaReady = true
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
