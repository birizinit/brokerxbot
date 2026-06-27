import type { BotOp, Stats, BalancePoint } from "@/lib/types"

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function isToday(ts: number): boolean {
  const d = new Date(ts)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

/** Agrega métricas a partir das operações (assertividade, lucro do dia, ROI, sequência). */
export function computeStats(ops: BotOp[]): Stats {
  const wins = ops.filter((o) => o.status === "won").length
  const losses = ops.filter((o) => o.status === "lost").length
  const pending = ops.filter((o) => o.status === "pending").length
  const settled = ops.filter((o) => o.status === "won" || o.status === "lost" || o.status === "tie").length
  const decided = wins + losses
  const winRate = decided > 0 ? round2((wins / decided) * 100) : 0

  const dayPnl = round2(ops.reduce((s, o) => (o.pnl != null && isToday(o.time) ? s + o.pnl : s), 0))
  const staked = ops.reduce((s, o) => (isToday(o.time) && o.status !== "error" ? s + o.amount : s), 0)
  const roi = staked > 0 ? round2((dayPnl / staked) * 100) : 0

  // Sequência atual (ops do mais novo para o mais antigo).
  let streak = 0
  for (const o of ops) {
    if (o.status === "pending") continue
    if (o.status === "won") {
      if (streak < 0) break
      streak++
    } else if (o.status === "lost") {
      if (streak > 0) break
      streak--
    } else {
      break
    }
  }

  const recent = ops
    .filter((o) => o.status === "won" || o.status === "lost" || o.status === "tie")
    .slice(0, 14)
    .map((o) => o.status)

  return { sent: ops.length, settled, pending, wins, losses, winRate, dayPnl, roi, streak, recent }
}

/** Série de evolução (pnl acumulado) a partir de um instante. */
export function balanceSeries(ops: BotOp[], sinceMs: number): BalancePoint[] {
  const settled = ops
    .filter((o) => o.pnl != null && o.time >= sinceMs)
    .sort((a, b) => a.time - b.time)

  const points: BalancePoint[] = [{ time: sinceMs, value: 0 }]
  let cum = 0
  for (const o of settled) {
    cum = round2(cum + (o.pnl ?? 0))
    points.push({ time: o.time, value: cum })
  }
  return points
}
