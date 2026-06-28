// ============================================================
//  SNIPER TRADER — Worker 24/7
//  Opera o robô no servidor para cada conta ativa, independente
//  do navegador do usuário. Lê config/estado do Postgres,
//  decripta a chave API, abre e liquida operações na corretora.
// ============================================================

import pg from "pg"
import { createDecipheriv } from "node:crypto"

const { Pool } = pg

const BROKER_BASE = "https://broker-api.mybrokerdev.com"
const PARTNER_CODE = "asafe"
const TICK_MS = 1000
const SETTLE_BUFFER_MS = 4000
const MIN_INTERVAL_MS = 2000
const ASSETS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "ADAUSDT"]

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false, max: 5 })

// ---------- cripto (espelha lib/crypto.ts) ----------
function decrypt(blob) {
  const secret = process.env.APP_SECRET
  if (!secret) throw new Error("APP_SECRET ausente")
  const key = Buffer.from(secret.slice(0, 64), "hex")
  const [ivh, tagh, dh] = blob.split(":")
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivh, "hex"))
  decipher.setAuthTag(Buffer.from(tagh, "hex"))
  return Buffer.concat([decipher.update(Buffer.from(dh, "hex")), decipher.final()]).toString("utf8")
}

// ---------- estratégia (espelha lib/strategy.ts, já testada) ----------
const round2 = (n) => Math.round(n * 100) / 100

function computeStake(config, state) {
  const sorosAdd = config.sorosEnabled ? state.sorosBank : 0
  const galeMult = config.galeEnabled ? Math.pow(config.galeMultiplier, state.galeStep) : 1
  return Math.max(1, round2((config.amount + sorosAdd) * galeMult))
}

function reduceStrategy(config, state, outcome, pnl) {
  if (outcome === "lost") {
    return {
      galeStep: config.galeEnabled ? Math.min(state.galeStep + 1, config.galeMaxSteps) : state.galeStep,
      sorosBank: 0,
      sorosWins: 0,
    }
  }
  if (outcome === "won") {
    if (!config.sorosEnabled) return { galeStep: 0, sorosBank: 0, sorosWins: 0 }
    if (state.sorosWins >= config.sorosLevels) return { galeStep: 0, sorosBank: 0, sorosWins: 0 }
    return {
      galeStep: 0,
      sorosBank: round2(state.sorosBank + Math.max(0, pnl) * (config.sorosReinvest ?? 1)),
      sorosWins: state.sorosWins + 1,
    }
  }
  return state
}

// ---------- horário (espelha lib/schedule.ts) ----------
function isWithinSchedule(s, at = new Date()) {
  if (!s || !s.enabled) return true
  const dayIdx = (at.getDay() + 6) % 7
  if (Array.isArray(s.days) && !s.days[dayIdx]) return false
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(":").map((n) => parseInt(n, 10))
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
  }
  const cur = at.getHours() * 60 + at.getMinutes()
  const start = toMin(s.start)
  const end = toMin(s.end)
  if (start === end) return true
  return start < end ? cur >= start && cur < end : cur >= start || cur < end
}

// ---------- corretora ----------
function headers(apiKey) {
  return { "api-token": apiKey, "x-timestamp": Date.now().toString(), "x-partner": PARTNER_CODE }
}

async function realBalance(apiKey) {
  const res = await fetch(`${BROKER_BASE}/token/wallets`, { headers: headers(apiKey) })
  if (!res.ok) return null
  const wallets = await res.json()
  if (!Array.isArray(wallets)) return null
  return wallets.filter((w) => w.type === "REAL").reduce((s, w) => s + (w.balance ?? 0), 0)
}

async function openTrade(apiKey, symbol, direction, amount) {
  const res = await fetch(`${BROKER_BASE}/token/trades/open-async`, {
    method: "POST",
    headers: { ...headers(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, direction, amount, closeType: "01:00", expirationType: "CANDLE_CLOSE", isDemo: false }),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return {
    ok: res.ok,
    status: res.status,
    tradeId: body?.id ?? null,
    closeTime: body?.closeTime ?? null,
    error: res.ok ? null : body?.data?.message ?? body?.message ?? body?.error ?? `HTTP ${res.status}`,
  }
}

async function getTrade(apiKey, id) {
  const res = await fetch(`${BROKER_BASE}/token/trades/${encodeURIComponent(id)}`, { headers: headers(apiKey) })
  if (!res.ok) return null
  const t = await res.json()
  const wallet = Array.isArray(t.wallets) ? t.wallets[0] : null
  return {
    status: t.status ?? "",
    result: t.result ?? "",
    pnl: typeof t.pnl === "number" ? t.pnl : wallet?.pnl ?? 0,
    balance: wallet?.balance ?? null,
    openPrice: t.openPrice ?? null,
    closePrice: t.closePrice ?? null,
    closeTime: t.closeTime ?? null,
  }
}

// ---------- banco ----------
async function ensureSchema() {
  await pool.query(`
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
    CREATE INDEX IF NOT EXISTS operations_pending_idx ON operations (status) WHERE status = 'pending';
  `)
}

async function dayPnl(accountId) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(pnl),0) AS s FROM operations
     WHERE account_id = $1 AND pnl IS NOT NULL AND created_at::date = now()::date`,
    [accountId],
  )
  return Number(r.rows[0].s)
}

async function deactivate(accountId, reason) {
  await pool.query(
    `UPDATE bots SET active = false, stop_reason = $2, next_run_at = NULL, updated_at = now() WHERE account_id = $1`,
    [accountId, reason],
  )
  log(`conta ${accountId}: robô parado — ${reason}`)
}

// ---------- liquidação ----------
async function settleDue() {
  const cutoff = Date.now() - SETTLE_BUFFER_MS
  const r = await pool.query(
    `SELECT o.id, o.account_id, o.trade_id, a.api_key_enc
       FROM operations o JOIN accounts a ON a.id = o.account_id
      WHERE o.status = 'pending' AND o.trade_id IS NOT NULL AND o.close_time IS NOT NULL AND o.close_time < $1
      LIMIT 50`,
    [cutoff],
  )

  for (const row of r.rows) {
    try {
      const apiKey = decrypt(row.api_key_enc)
      const t = await getTrade(apiKey, row.trade_id)
      if (!t) continue
      if (t.status !== "COMPLETED") continue // ainda processando

      let status = "tie"
      if (t.result === "WON" || t.pnl > 0) status = "won"
      else if (t.result === "LOST" || t.pnl < 0) status = "lost"

      await pool.query(
        `UPDATE operations SET status=$2, pnl=$3, balance_after=$4, message=$5 WHERE id=$1`,
        [row.id, status, round2(t.pnl), t.balance, status === "won" ? "Vitória" : status === "lost" ? "Derrota" : "Empate"],
      )

      // aplica Gale/Soros no estado do bot
      const b = await pool.query(`SELECT config, strategy FROM bots WHERE account_id=$1`, [row.account_id])
      if (b.rows[0]) {
        const config = b.rows[0].config
        const strat = reduceStrategy(config, b.rows[0].strategy, status, t.pnl ?? 0)
        await pool.query(`UPDATE bots SET strategy=$2, last_balance=$3, updated_at=now() WHERE account_id=$1`, [
          row.account_id,
          strat,
          t.balance,
          ])

        // checa stops
        const day = await dayPnl(row.account_id)
        if (config.stopWin > 0 && day >= config.stopWin) await deactivate(row.account_id, `Stop Win atingido (+$${day.toFixed(2)})`)
        else if (config.stopLoss > 0 && day <= -config.stopLoss) await deactivate(row.account_id, `Stop Loss atingido (-$${Math.abs(day).toFixed(2)})`)
      }
    } catch (e) {
      console.error("settle erro:", e.message)
    }
  }
}

// ---------- abertura ----------
async function openDue() {
  const now = Date.now()
  const r = await pool.query(
    `SELECT b.account_id, b.config, b.strategy, b.next_run_at, a.api_key_enc
       FROM bots b JOIN accounts a ON a.id = b.account_id
      WHERE b.active = true AND (b.next_run_at IS NULL OR b.next_run_at <= $1)
      LIMIT 50`,
    [now],
  )

  for (const row of r.rows) {
    const accountId = row.account_id
    const config = row.config
    try {
      // janela de horário
      if (!isWithinSchedule(config.schedule)) {
        await pool.query(`UPDATE bots SET next_run_at=$2 WHERE account_id=$1`, [accountId, now + 30000])
        continue
      }

      const apiKey = decrypt(row.api_key_enc)
      const balance = await realBalance(apiKey)
      const stake = computeStake(config, row.strategy)

      if (balance !== null && balance < stake) {
        await deactivate(accountId, "Saldo real insuficiente")
        continue
      }

      const symbol = ASSETS[Math.floor(Math.random() * ASSETS.length)]
      const direction = Math.random() < 0.5 ? "BUY" : "SELL"
      const res = await openTrade(apiKey, symbol, direction, stake)

      if (res.ok && res.tradeId) {
        await pool.query(
          `INSERT INTO operations (account_id, trade_id, symbol, direction, amount, status, close_time, message)
           VALUES ($1,$2,$3,$4,$5,'pending',$6,'Em andamento')`,
          [accountId, res.tradeId, symbol, direction, stake, res.closeTime ?? now + 60000],
        )
        const interval = Math.max(MIN_INTERVAL_MS, Math.round(3600000 / Math.max(1, config.opsPerHour)))
        await pool.query(`UPDATE bots SET next_run_at=$2, stop_reason=NULL, updated_at=now() WHERE account_id=$1`, [
          accountId,
          now + interval,
        ])
        log(`conta ${accountId}: abriu ${direction} ${symbol} $${stake}`)
      } else {
        const msg = (res.error || "").toLowerCase()
        if (/insufficient|insuficiente|saldo|balance|fund/.test(msg) || (balance !== null && balance < stake)) {
          await deactivate(accountId, "Saldo real insuficiente (recusado pela corretora)")
        } else {
          // erro transitório: tenta de novo em 15s, registra
          await pool.query(
            `INSERT INTO operations (account_id, symbol, direction, amount, status, message)
             VALUES ($1,$2,$3,$4,'error',$5)`,
            [accountId, symbol, direction, stake, `Recusada: ${res.error}`],
          )
          await pool.query(`UPDATE bots SET next_run_at=$2 WHERE account_id=$1`, [accountId, now + 15000])
          log(`conta ${accountId}: recusada — ${res.error}`)
        }
      }
    } catch (e) {
      console.error(`open erro (conta ${accountId}):`, e.message)
      await pool.query(`UPDATE bots SET next_run_at=$2 WHERE account_id=$1`, [accountId, Date.now() + 15000])
    }
  }
}

// ---------- loop ----------
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

let ticking = false
async function tick() {
  if (ticking) return
  ticking = true
  try {
    await settleDue()
    await openDue()
  } catch (e) {
    console.error("tick erro:", e.message)
  } finally {
    ticking = false
  }
}

async function main() {
  log("Sniper Worker iniciando...")
  await ensureSchema()
  log("schema ok — entrando no loop")
  setInterval(tick, TICK_MS)
}

main().catch((e) => {
  console.error("fatal:", e)
  process.exit(1)
})
