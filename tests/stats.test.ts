import { describe, it, expect } from "vitest"
import { computeStats, balanceSeries } from "@/lib/stats"
import type { BotOp, OpStatus } from "@/lib/types"

let seq = 0
function mk(status: OpStatus, pnl: number | null, time: number, amount = 5): BotOp {
  return {
    id: String(++seq),
    tradeId: null,
    time,
    closeTime: null,
    symbol: "BTCUSDT",
    direction: "BUY",
    amount,
    isDemo: false,
    status,
    pnl,
    balanceAfter: null,
    openPrice: null,
    closePrice: null,
    message: "",
  }
}

describe("computeStats", () => {
  const now = Date.now()
  // mais novo primeiro
  const ops: BotOp[] = [
    mk("pending", null, now),
    mk("won", 4.25, now - 1000),
    mk("won", 4.25, now - 2000),
    mk("lost", -5, now - 3000),
    mk("won", 4.25, now - 4000),
  ]

  const s = computeStats(ops)

  it("conta enviadas, liquidadas e pendentes", () => {
    expect(s.sent).toBe(5)
    expect(s.settled).toBe(4)
    expect(s.pending).toBe(1)
  })

  it("calcula vitórias, derrotas e assertividade", () => {
    expect(s.wins).toBe(3)
    expect(s.losses).toBe(1)
    expect(s.winRate).toBe(75)
  })

  it("calcula lucro do dia e ROI", () => {
    expect(s.dayPnl).toBe(7.75) // 4.25*3 - 5
    // staked = 5 operações (inclui a pendente) * 5 = 25  ->  7.75/25 = 31%
    expect(s.roi).toBe(31)
  })

  it("calcula a sequência atual ignorando pendentes", () => {
    expect(s.streak).toBe(2) // duas vitórias seguidas no topo
  })

  it("monta os resultados recentes sem os pendentes", () => {
    expect(s.recent).toEqual(["won", "won", "lost", "won"])
  })

  it("zera com lista vazia", () => {
    const e = computeStats([])
    expect(e.winRate).toBe(0)
    expect(e.dayPnl).toBe(0)
    expect(e.streak).toBe(0)
  })
})

describe("balanceSeries", () => {
  it("acumula o pnl em ordem cronológica começando do zero", () => {
    const t = Date.now()
    const ops: BotOp[] = [
      mk("won", 4.25, t - 1000),
      mk("lost", -5, t - 2000),
      mk("won", 4.25, t - 3000),
    ]
    const series = balanceSeries(ops, 0)
    expect(series[0]).toEqual({ time: 0, value: 0 })
    expect(series.map((p) => p.value)).toEqual([0, 4.25, -0.75, 3.5])
  })

  it("ignora operações sem resultado e anteriores ao início", () => {
    const t = Date.now()
    const ops: BotOp[] = [mk("pending", null, t), mk("won", 4.25, t - 1000)]
    const series = balanceSeries(ops, t - 2000)
    expect(series.map((p) => p.value)).toEqual([0, 4.25])
  })
})
