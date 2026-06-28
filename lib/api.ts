// Cliente de API usado pelo browser. Fala apenas com as nossas rotas
// internas (/api/*), que por sua vez encaminham para a corretora.

import type { TradeResult, BotOp, OpStatus } from "@/lib/types"
import type { BotConfig } from "@/lib/storage"

export interface Wallet {
  id: string
  type: string
  balance: number
  rolloverBalance?: number
  totalRollover?: number
}

export interface OpenTradePayload {
  symbol: string
  direction: "BUY" | "SELL"
  amount: number
  closeType: string
  isDemo: boolean
}

export type KeyCheck =
  | { ok: true }
  | { ok: false; reason: "invalid" | "unavailable" | "network"; message: string }

function authHeaders(apiKey: string): HeadersInit {
  return { "api-token": apiKey }
}

// ---------- Controle do robô (server-side via worker) ----------

export interface BotState {
  active: boolean
  config: BotConfig | null
  strategy: { galeStep: number; sorosBank: number; sorosWins: number }
  activatedAt: number | null
  nextRunAt: number | null
  lastBalance: number | null
  stopReason: string | null
  ops: BotOp[]
}

function mapOp(r: Record<string, unknown>): BotOp {
  const num = (v: unknown) => (v == null ? null : Number(v))
  return {
    id: String(r.id),
    tradeId: (r.trade_id as string) ?? null,
    time: r.created_at ? Date.parse(r.created_at as string) : Date.now(),
    closeTime: r.close_time != null ? Number(r.close_time) : null,
    symbol: (r.symbol as string) ?? "",
    direction: r.direction === "SELL" ? "SELL" : "BUY",
    amount: Number(r.amount ?? 0),
    isDemo: false,
    status: (r.status as OpStatus) ?? "pending",
    pnl: num(r.pnl),
    balanceAfter: num(r.balance_after),
    openPrice: null,
    closePrice: null,
    message: (r.message as string) ?? "",
  }
}

/** Lê o estado atual do robô (do banco, atualizado pelo worker). */
export async function getBotState(): Promise<BotState | null> {
  try {
    const res = await fetch("/api/bot", { cache: "no-store" })
    if (!res.ok) return null
    const d = await res.json()
    const bot = d.bot
    const ops = Array.isArray(d.operations) ? d.operations.map(mapOp) : []
    return {
      active: bot?.active ?? false,
      config: (bot?.config as BotConfig) ?? null,
      strategy: bot?.strategy ?? { galeStep: 0, sorosBank: 0, sorosWins: 0 },
      activatedAt: bot?.activated_at ? Date.parse(bot.activated_at) : null,
      nextRunAt: bot?.next_run_at != null ? Number(bot.next_run_at) : null,
      lastBalance: bot?.last_balance != null ? Number(bot.last_balance) : null,
      stopReason: bot?.stop_reason ?? null,
      ops,
    }
  } catch {
    return null
  }
}

export async function saveBotConfig(config: BotConfig): Promise<void> {
  try {
    await fetch("/api/bot/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })
  } catch {
    /* ignora */
  }
}

export async function setBotActiveApi(active: boolean): Promise<void> {
  try {
    await fetch("/api/bot/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
  } catch {
    /* ignora */
  }
}

export interface SessionAccount {
  name: string
  email: string
  phone: string
  apiKey: string
}

/** Carrega a sessão atual (conta + chave API). Null se não logado. */
export async function authMe(): Promise<SessionAccount | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" })
    if (!res.ok) return null
    const d = await res.json()
    return { name: d.name, email: d.email, phone: d.phone, apiKey: d.apiKey }
  } catch {
    return null
  }
}

export async function authLogin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) return { ok: true }
    const d = await res.json().catch(() => ({}))
    return { ok: false, error: d.error ?? "Não foi possível entrar." }
  } catch {
    return { ok: false, error: "Falha de conexão." }
  }
}

export async function authRegister(data: {
  name: string
  email: string
  phone: string
  password: string
  apiKey: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) return { ok: true }
    const d = await res.json().catch(() => ({}))
    return { ok: false, error: d.error ?? "Não foi possível criar a conta." }
  } catch {
    return { ok: false, error: "Falha de conexão." }
  }
}

export async function authLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch {
    /* ignora */
  }
}

/** Salva o cliente (lead do onboarding) no banco. Falha silenciosa. */
export async function saveClient(client: { name: string; email: string; phone: string }): Promise<void> {
  try {
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    })
  } catch {
    /* não bloqueia o onboarding se o banco estiver indisponível */
  }
}

/** Valida a chave API tentando listar as wallets do usuário. */
export async function validateKey(apiKey: string): Promise<KeyCheck> {
  try {
    const res = await fetch("/api/wallets", { headers: authHeaders(apiKey) })

    if (res.ok) return { ok: true }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: "invalid", message: "Chave API inválida. Verifique e tente novamente." }
    }

    return {
      ok: false,
      reason: "unavailable",
      message: "Corretora indisponível no momento. Tente novamente em alguns minutos.",
    }
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Falha de conexão. Verifique sua internet e tente novamente.",
    }
  }
}

/** Lista as wallets do usuário autenticado. */
export async function getWallets(apiKey: string): Promise<Wallet[]> {
  const res = await fetch("/api/wallets", { headers: authHeaders(apiKey) })
  if (!res.ok) throw new Error(`wallets ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Soma o saldo de todas as wallets do tipo informado (ou de todas). */
export function sumBalance(wallets: Wallet[], type?: string): number {
  return wallets
    .filter((w) => (type ? w.type === type : true))
    .reduce((total, w) => total + (w.balance ?? 0), 0)
}

export interface OpenResult {
  ok: boolean
  status: number
  tradeId: string | null
  closeTime: number | null
  error: string | null
}

/** Abre uma operação na corretora e devolve o id e o horário de fechamento. */
export async function openTrade(apiKey: string, payload: OpenTradePayload): Promise<OpenResult> {
  const body = JSON.stringify({
    symbol: payload.symbol,
    direction: payload.direction,
    amount: payload.amount,
    closeType: payload.closeType,
    expirationType: "CANDLE_CLOSE",
    isDemo: payload.isDemo,
  })

  const res = await fetch("/api/open", {
    method: "POST",
    headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
    body,
  })

  let parsed:
    | { id?: string; closeTime?: number; message?: string; error?: string; data?: { message?: string } }
    | null = null
  try {
    parsed = await res.json()
  } catch {
    parsed = null
  }

  const error = res.ok ? null : parsed?.data?.message ?? parsed?.message ?? parsed?.error ?? null

  return {
    ok: res.ok,
    status: res.status,
    tradeId: parsed?.id ?? null,
    closeTime: parsed?.closeTime ?? null,
    error,
  }
}

/** Consulta o resultado de um trade pelo id (após o fechamento). */
export async function getTrade(apiKey: string, id: string): Promise<TradeResult | null> {
  try {
    const res = await fetch(`/api/trade?id=${encodeURIComponent(id)}`, { headers: authHeaders(apiKey) })
    if (!res.ok) return null
    const t = await res.json()
    const wallet = Array.isArray(t.wallets) ? t.wallets[0] : null
    return {
      status: t.status ?? "",
      result: t.result ?? "",
      pnl: typeof t.pnl === "number" ? t.pnl : (wallet?.pnl ?? 0),
      balance: wallet?.balance ?? null,
      openPrice: t.openPrice ?? null,
      closePrice: t.closePrice ?? null,
      closeTime: t.closeTime ?? null,
    }
  } catch {
    return null
  }
}
