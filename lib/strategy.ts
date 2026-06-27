// Lógica pura de Gale e Soros — sem React, totalmente testável.
// O motor do bot (useBot) usa estas funções; os testes também.

import type { BotConfig } from "@/lib/storage"

export interface StrategyState {
  galeStep: number // perdas seguidas (degrau do Gale)
  sorosBank: number // lucro acumulado para reinvestir (Soros)
  sorosWins: number // vitórias seguidas no ciclo de Soros
}

export const INITIAL_STRATEGY: StrategyState = { galeStep: 0, sorosBank: 0, sorosWins: 0 }

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Valor da próxima entrada considerando Gale e Soros. */
export function computeStake(config: BotConfig, state: StrategyState): number {
  const sorosAdd = config.sorosEnabled ? state.sorosBank : 0
  const galeMult = config.galeEnabled ? Math.pow(config.galeMultiplier, state.galeStep) : 1
  return Math.max(1, round2((config.amount + sorosAdd) * galeMult))
}

export type Outcome = "won" | "lost" | "tie"

/** Aplica o resultado de uma operação e devolve o novo estado da estratégia. */
export function reduceStrategy(config: BotConfig, state: StrategyState, outcome: Outcome, pnl: number): StrategyState {
  if (outcome === "lost") {
    // Gale sobe um degrau (até o máximo); Soros zera.
    return {
      galeStep: config.galeEnabled ? Math.min(state.galeStep + 1, config.galeMaxSteps) : state.galeStep,
      sorosBank: 0,
      sorosWins: 0,
    }
  }

  if (outcome === "won") {
    // Vitória zera o Gale. No Soros, reinveste a fração do lucro até o limite de níveis.
    if (!config.sorosEnabled) {
      return { galeStep: 0, sorosBank: 0, sorosWins: 0 }
    }
    if (state.sorosWins >= config.sorosLevels) {
      // Ciclo completo: realiza o lucro e recomeça.
      return { galeStep: 0, sorosBank: 0, sorosWins: 0 }
    }
    return {
      galeStep: 0,
      sorosBank: round2(state.sorosBank + Math.max(0, pnl) * config.sorosReinvest),
      sorosWins: state.sorosWins + 1,
    }
  }

  // Empate / reembolso: mantém o estado.
  return state
}
