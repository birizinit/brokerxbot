// Tipos compartilhados do domínio do bot.

export type OpStatus = "pending" | "won" | "lost" | "tie" | "error"

/** Uma operação enviada pelo robô, enriquecida com o resultado real da corretora. */
export interface BotOp {
  id: string // uuid local
  tradeId: string | null // id do trade na corretora
  time: number // momento de abertura (ms)
  closeTime: number | null // fechamento previsto (ms)
  symbol: string
  direction: "BUY" | "SELL"
  amount: number
  isDemo: boolean
  status: OpStatus
  pnl: number | null // lucro/prejuízo real (após liquidar)
  balanceAfter: number | null
  openPrice: number | null
  closePrice: number | null
  message: string
}

/** Resultado bruto de um trade vindo de GET /token/trades/{id}. */
export interface TradeResult {
  status: string // PROCESSING | COMPLETED
  result: string // WON | LOST | TIE | HOLD
  pnl: number
  balance: number | null
  openPrice: number | null
  closePrice: number | null
  closeTime: number | null
}

/** Métricas agregadas a partir das operações liquidadas. */
export interface Stats {
  sent: number
  settled: number
  pending: number
  wins: number
  losses: number
  winRate: number // 0..100
  dayPnl: number
  roi: number // %
  streak: number // >0 vitórias seguidas, <0 derrotas seguidas
  recent: OpStatus[] // resultados recentes (mais novo primeiro)
}

/** Ponto da série de evolução do saldo. */
export interface BalancePoint {
  time: number
  value: number // pnl acumulado
}
