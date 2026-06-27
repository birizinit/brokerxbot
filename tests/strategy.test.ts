import { describe, it, expect } from "vitest"
import { computeStake, reduceStrategy, INITIAL_STRATEGY, type StrategyState } from "@/lib/strategy"
import type { BotConfig } from "@/lib/storage"

const base: BotConfig = {
  opsPerHour: 6,
  amount: 5,
  isDemo: false,
  galeEnabled: false,
  galeMultiplier: 2,
  galeMaxSteps: 2,
  sorosEnabled: false,
  sorosLevels: 3,
  sorosReinvest: 1,
  stopWin: 0,
  stopLoss: 0,
  dailyTargetPct: 0,
}
const cfg = (o: Partial<BotConfig>): BotConfig => ({ ...base, ...o })

describe("computeStake", () => {
  it("usa o valor base quando Gale e Soros estão desligados", () => {
    expect(computeStake(base, INITIAL_STRATEGY)).toBe(5)
  })

  it("nunca fica abaixo de 1", () => {
    expect(computeStake(cfg({ amount: 0.5 }), INITIAL_STRATEGY)).toBe(1)
  })
})

describe("Gale", () => {
  const c = cfg({ galeEnabled: true, galeMultiplier: 2, galeMaxSteps: 2 })

  it("dobra a cada perda e trava no máximo, voltando ao base na vitória", () => {
    let s: StrategyState = INITIAL_STRATEGY
    expect(computeStake(c, s)).toBe(5)

    s = reduceStrategy(c, s, "lost", -5)
    expect(computeStake(c, s)).toBe(10) // 5 * 2^1

    s = reduceStrategy(c, s, "lost", -10)
    expect(computeStake(c, s)).toBe(20) // 5 * 2^2

    s = reduceStrategy(c, s, "lost", -20)
    expect(computeStake(c, s)).toBe(20) // travado no máx (2 gales)
    expect(s.galeStep).toBe(2)

    s = reduceStrategy(c, s, "won", 17)
    expect(computeStake(c, s)).toBe(5) // vitória reinicia
    expect(s.galeStep).toBe(0)
  })

  it("não sobe o degrau quando o Gale está desligado", () => {
    let s: StrategyState = INITIAL_STRATEGY
    s = reduceStrategy(base, s, "lost", -5)
    expect(s.galeStep).toBe(0)
    expect(computeStake(base, s)).toBe(5)
  })
})

describe("Soros", () => {
  const c = cfg({ sorosEnabled: true, sorosLevels: 3, sorosReinvest: 1 })

  it("reinveste o lucro até o limite de níveis e então recomeça", () => {
    let s: StrategyState = INITIAL_STRATEGY
    expect(computeStake(c, s)).toBe(5)

    s = reduceStrategy(c, s, "won", 4.25)
    expect(s.sorosBank).toBe(4.25)
    expect(computeStake(c, s)).toBe(9.25)

    s = reduceStrategy(c, s, "won", 7.86)
    expect(s.sorosBank).toBe(12.11)
    expect(computeStake(c, s)).toBe(17.11)

    s = reduceStrategy(c, s, "won", 14.54)
    expect(s.sorosWins).toBe(3)
    expect(computeStake(c, s)).toBe(31.65)

    // 4ª vitória atinge o limite de níveis: realiza o lucro e recomeça
    s = reduceStrategy(c, s, "won", 10)
    expect(s.sorosBank).toBe(0)
    expect(computeStake(c, s)).toBe(5)
  })

  it("uma derrota zera o acúmulo do Soros", () => {
    let s = reduceStrategy(c, INITIAL_STRATEGY, "won", 4.25)
    expect(computeStake(c, s)).toBe(9.25)
    s = reduceStrategy(c, s, "lost", -9.25)
    expect(s.sorosBank).toBe(0)
    expect(computeStake(c, s)).toBe(5)
  })

  it("respeita a fração de reinvestimento (50%)", () => {
    const half = cfg({ sorosEnabled: true, sorosReinvest: 0.5 })
    const s = reduceStrategy(half, INITIAL_STRATEGY, "won", 4)
    expect(s.sorosBank).toBe(2) // 4 * 0.5
    expect(computeStake(half, s)).toBe(7)
  })
})

describe("empate", () => {
  it("não altera o estado", () => {
    const c = cfg({ galeEnabled: true, sorosEnabled: true })
    const s0: StrategyState = { galeStep: 1, sorosBank: 3, sorosWins: 1 }
    expect(reduceStrategy(c, s0, "tie", 0)).toEqual(s0)
  })
})
