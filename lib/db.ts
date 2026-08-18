// Acesso ao Postgres — SOMENTE no servidor (route handlers).
// A connection string vem de process.env.DATABASE_URL e nunca é exposta ao browser.

import { Pool } from "pg"
import { SEED_COMPRADORES } from "@/lib/compradores"

const globalForPg = globalThis as unknown as { _pgPool?: Pool }

export function pool(): Pool {
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

export async function ensureSchema(): Promise<void> {
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
    CREATE TABLE IF NOT EXISTS bots (
      account_id BIGINT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      active BOOLEAN NOT NULL DEFAULT false,
      config JSONB NOT NULL,
      strategy JSONB NOT NULL DEFAULT '{"galeStep":0,"sorosBank":0,"sorosWins":0}',
      activated_at TIMESTAMPTZ,
      next_run_at BIGINT,
      last_balance NUMERIC,
      stop_reason TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS operations (
      id BIGSERIAL PRIMARY KEY,
      account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
      trade_id TEXT,
      symbol TEXT, direction TEXT, amount NUMERIC,
      status TEXT NOT NULL,
      pnl NUMERIC, balance_after NUMERIC,
      close_time BIGINT,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS buyers (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS push_subs (
      endpoint TEXT PRIMARY KEY,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS app_events (
      key TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  await seedBuyers()
  schemaReady = true
}

export interface BotRow {
  active: boolean
  config: Record<string, unknown>
  strategy: { galeStep: number; sorosBank: number; sorosWins: number }
  activated_at: string | null
  next_run_at: string | null
  last_balance: string | null
  stop_reason: string | null
}

export async function getBot(accountId: string): Promise<BotRow | null> {
  await ensureSchema()
  const r = await pool().query(`SELECT * FROM bots WHERE account_id = $1`, [accountId])
  return (r.rows[0] as BotRow) ?? null
}

/** Cria/atualiza a configuração do bot, preservando o estado ativo. */
export async function upsertBotConfig(accountId: string, config: unknown): Promise<void> {
  await ensureSchema()
  await pool().query(
    `INSERT INTO bots (account_id, config) VALUES ($1, $2)
     ON CONFLICT (account_id) DO UPDATE SET config = $2, updated_at = now()`,
    [accountId, JSON.stringify(config)],
  )
}

/** Liga/desliga o bot. Ao ligar, zera o motivo de parada e libera a próxima operação. */
export async function setBotActive(accountId: string, active: boolean): Promise<void> {
  await ensureSchema()
  if (active) {
    await pool().query(
      `UPDATE bots SET active = true, activated_at = now(), stop_reason = NULL, next_run_at = NULL,
       strategy = '{"galeStep":0,"sorosBank":0,"sorosWins":0}', updated_at = now() WHERE account_id = $1`,
      [accountId],
    )
  } else {
    await pool().query(`UPDATE bots SET active = false, updated_at = now() WHERE account_id = $1`, [accountId])
  }
}

export interface OperationRow {
  id: string
  trade_id: string | null
  symbol: string | null
  direction: string | null
  amount: string | null
  status: string
  pnl: string | null
  balance_after: string | null
  close_time: string | null
  message: string | null
  created_at: string
}

export async function getOperations(accountId: string, limit = 120): Promise<OperationRow[]> {
  await ensureSchema()
  const r = await pool().query(
    `SELECT * FROM operations WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [accountId, limit],
  )
  return r.rows as OperationRow[]
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

/** Redefine a senha (hash) de uma conta de usuário. */
export async function setAccountPassword(id: string, passwordHash: string): Promise<void> {
  await ensureSchema()
  await pool().query(`UPDATE accounts SET password_hash = $2, updated_at = now() WHERE id = $1`, [id, passwordHash])
}

// ---------- Administradores ----------

export interface AdminRow {
  id: string
  name: string
  email: string
  password_hash: string
  created_at: string
}

export interface AdminPublic {
  id: string
  name: string
  email: string
  created_at: string
}

export interface NewAdmin {
  name: string
  email: string
  passwordHash: string
}

/** Cria um administrador. Lança 'EMAIL_TAKEN' se o e-mail já existir. */
export async function createAdmin(a: NewAdmin): Promise<string> {
  await ensureSchema()
  try {
    const r = await pool().query(
      `INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [a.name, a.email, a.passwordHash],
    )
    return r.rows[0].id as string
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505") {
      throw new Error("EMAIL_TAKEN")
    }
    throw e
  }
}

export async function getAdminByEmail(email: string): Promise<AdminRow | null> {
  await ensureSchema()
  const r = await pool().query(`SELECT * FROM admins WHERE email = $1`, [email])
  return (r.rows[0] as AdminRow) ?? null
}

export async function getAdminById(id: string): Promise<AdminRow | null> {
  await ensureSchema()
  const r = await pool().query(`SELECT * FROM admins WHERE id = $1`, [id])
  return (r.rows[0] as AdminRow) ?? null
}

/** Lista administradores (sem hash de senha). */
export async function listAdmins(): Promise<AdminPublic[]> {
  await ensureSchema()
  const r = await pool().query(`SELECT id, name, email, created_at FROM admins ORDER BY created_at ASC`)
  return r.rows as AdminPublic[]
}

export async function deleteAdmin(id: string): Promise<void> {
  await ensureSchema()
  await pool().query(`DELETE FROM admins WHERE id = $1`, [id])
}

/** Redefine a senha (hash) de um administrador. */
export async function setAdminPassword(id: string, passwordHash: string): Promise<void> {
  await ensureSchema()
  await pool().query(`UPDATE admins SET password_hash = $2 WHERE id = $1`, [id, passwordHash])
}

// ---------- Métricas para o painel admin ----------

export interface DailyPoint {
  date: string // YYYY-MM-DD
  count: number
}

export interface AdminStats {
  accounts: number
  /** Compradores liberados na allowlist. */
  buyers: number
  /** Liberados que ainda não criaram conta. */
  pendingBuyers: number
  /** Soma do valor de todas as entradas. */
  volume: number
  activeBots: number
  totalOps: number
  wins: number
  losses: number
  pnlSum: number
  signupsPerDay: DailyPoint[]
  opsPerDay: DailyPoint[]
}

/** Agrega métricas do sistema para os gráficos do painel administrativo. */
export async function adminStats(): Promise<AdminStats> {
  await ensureSchema()
  const [accountsR, botsR, opsR, signupsR, opsDayR, buyersR] = await Promise.all([
    pool().query(`SELECT COUNT(*)::int AS n FROM accounts`),
    pool().query(`SELECT COUNT(*)::int AS n FROM bots WHERE active = true`),
    pool().query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'won')::int AS wins,
              COUNT(*) FILTER (WHERE status = 'lost')::int AS losses,
              COALESCE(SUM(pnl), 0)::float AS pnl,
              COALESCE(SUM(amount), 0)::float AS volume
         FROM operations`,
    ),
    pool().query(
      `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
         FROM accounts
        WHERE created_at >= now() - interval '29 days'
        GROUP BY 1 ORDER BY 1`,
    ),
    pool().query(
      `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
         FROM operations
        WHERE created_at >= now() - interval '13 days'
        GROUP BY 1 ORDER BY 1`,
    ),
    pool().query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (
                WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE lower(a.email) = b.email)
              )::int AS pendentes
         FROM buyers b`,
    ),
  ])

  return {
    accounts: accountsR.rows[0].n as number,
    buyers: buyersR.rows[0].total as number,
    pendingBuyers: buyersR.rows[0].pendentes as number,
    volume: opsR.rows[0].volume as number,
    activeBots: botsR.rows[0].n as number,
    totalOps: opsR.rows[0].total as number,
    wins: opsR.rows[0].wins as number,
    losses: opsR.rows[0].losses as number,
    pnlSum: opsR.rows[0].pnl as number,
    signupsPerDay: signupsR.rows as DailyPoint[],
    opsPerDay: opsDayR.rows as DailyPoint[],
  }
}

// ---------- Compradores liberados (allowlist) ----------

/** Popula `buyers` a partir da semente em lib/compradores.ts, só se estiver vazia. */
async function seedBuyers(): Promise<void> {
  const r = await pool().query(`SELECT COUNT(*)::int AS n FROM buyers`)
  if ((r.rows[0].n as number) > 0 || SEED_COMPRADORES.length === 0) return

  const valores = SEED_COMPRADORES.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")
  const params = SEED_COMPRADORES.flatMap((c) => [c.email, c.nome])
  await pool().query(
    `INSERT INTO buyers (email, name) VALUES ${valores} ON CONFLICT (email) DO NOTHING`,
    params,
  )
}

export interface BuyerRow {
  id: string
  email: string
  name: string
  note: string | null
  created_at: string
  /** Verdadeiro se já existe conta criada com esse e-mail. */
  registered: boolean
}

/** Lista compradores liberados, marcando quem já criou conta. */
export async function listBuyers(): Promise<BuyerRow[]> {
  await ensureSchema()
  const r = await pool().query(
    `SELECT b.id, b.email, b.name, b.note, b.created_at,
            EXISTS (SELECT 1 FROM accounts a WHERE lower(a.email) = b.email) AS registered
       FROM buyers b
      ORDER BY b.created_at DESC, b.id DESC`,
  )
  return r.rows as BuyerRow[]
}

/** Adiciona um comprador. Lança 'EMAIL_TAKEN' se já existir. */
export async function addBuyer(email: string, name: string, note: string | null): Promise<BuyerRow> {
  await ensureSchema()
  try {
    const r = await pool().query(
      `INSERT INTO buyers (email, name, note) VALUES ($1, $2, $3)
       RETURNING id, email, name, note, created_at`,
      [email, name, note],
    )
    return { ...(r.rows[0] as Omit<BuyerRow, "registered">), registered: false }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505") {
      throw new Error("EMAIL_TAKEN")
    }
    throw e
  }
}

export async function removeBuyer(id: string): Promise<void> {
  await ensureSchema()
  await pool().query(`DELETE FROM buyers WHERE id = $1`, [id])
}

/** Verdadeiro se o e-mail está liberado para criar conta. */
export async function isBuyerAllowed(email: string): Promise<boolean> {
  await ensureSchema()
  const r = await pool().query(`SELECT 1 FROM buyers WHERE email = $1 LIMIT 1`, [email])
  return r.rowCount ? r.rowCount > 0 : false
}

export async function countBuyers(): Promise<number> {
  await ensureSchema()
  const r = await pool().query(`SELECT COUNT(*)::int AS n FROM buyers`)
  return r.rows[0].n as number
}

// ---------- Marcos (evita notificar o mesmo marco duas vezes) ----------

/**
 * Reserva um evento único. Devolve true apenas na primeira vez que a chave é
 * gravada — usado para disparar a notificação de marco uma só vez.
 */
export async function claimEvent(key: string): Promise<boolean> {
  await ensureSchema()
  const r = await pool().query(
    `INSERT INTO app_events (key) VALUES ($1) ON CONFLICT (key) DO NOTHING`,
    [key],
  )
  return r.rowCount === 1
}

// ---------- Inscrições de push ----------

export interface PushSub {
  endpoint: string
  p256dh: string
  auth: string
}

export async function savePushSub(s: PushSub, label: string | null): Promise<void> {
  await ensureSchema()
  await pool().query(
    `INSERT INTO push_subs (endpoint, p256dh, auth, label) VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = $2, auth = $3, label = $4`,
    [s.endpoint, s.p256dh, s.auth, label],
  )
}

export async function listPushSubs(): Promise<PushSub[]> {
  await ensureSchema()
  const r = await pool().query(`SELECT endpoint, p256dh, auth FROM push_subs`)
  return r.rows as PushSub[]
}

export async function deletePushSub(endpoint: string): Promise<void> {
  await ensureSchema()
  await pool().query(`DELETE FROM push_subs WHERE endpoint = $1`, [endpoint])
}

// ---------- Ranking de usuários ----------

export interface TopUser {
  id: string
  name: string
  email: string
  ops: number
  volume: number
  pnl: number
  wins: number
  losses: number
  botActive: boolean
  lastOpAt: string | null
}

/** Usuários ordenados por volume operado. */
export async function topUsers(limit = 20): Promise<TopUser[]> {
  await ensureSchema()
  const r = await pool().query(
    `SELECT a.id, a.name, a.email,
            COUNT(o.id)::int AS ops,
            COALESCE(SUM(o.amount), 0)::float AS volume,
            COALESCE(SUM(o.pnl), 0)::float AS pnl,
            COUNT(*) FILTER (WHERE o.status = 'won')::int AS wins,
            COUNT(*) FILTER (WHERE o.status = 'lost')::int AS losses,
            COALESCE(bo.active, false) AS "botActive",
            MAX(o.created_at) AS "lastOpAt"
       FROM accounts a
       LEFT JOIN operations o ON o.account_id = a.id
       LEFT JOIN bots bo ON bo.account_id = a.id
      GROUP BY a.id, a.name, a.email, bo.active
      ORDER BY volume DESC, ops DESC
      LIMIT $1`,
    [limit],
  )
  return r.rows as TopUser[]
}

/** Total de contas criadas. Usado para detectar marcos. */
export async function countAccounts(): Promise<number> {
  await ensureSchema()
  const r = await pool().query(`SELECT COUNT(*)::int AS n FROM accounts`)
  return r.rows[0].n as number
}
