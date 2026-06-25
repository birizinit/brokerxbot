// Cliente de API usado pelo browser. Fala apenas com as nossas rotas
// internas (/api/*), que por sua vez encaminham para a corretora.

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

/** Abre uma operação na corretora. Lança em caso de erro HTTP. */
export async function openTrade(
  apiKey: string,
  payload: OpenTradePayload,
): Promise<{ ok: boolean; status: number; body: unknown }> {
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

  let parsed: unknown = null
  try {
    parsed = await res.json()
  } catch {
    parsed = null
  }

  return { ok: res.ok, status: res.status, body: parsed }
}
