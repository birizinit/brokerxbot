// Sinais de "mercado" para a Inteligência de Mercado e o Heatmap.
// IMPORTANTE: são SIMULADOS — a corretora não expõe API de IA/sinais.
// Os valores são determinísticos por "tick" (mudam a cada poucos segundos),
// evitando jitter a cada render.

import { ASSETS, type Asset } from "@/lib/assets"

function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export interface MarketSignal {
  confidence: number // %
  probability: number // %
  trendUp: boolean
  timeframes: number
  suggestionDirection: "CALL" | "PUT"
  suggestionAsset: Asset
}

export function marketSignal(tick: number): MarketSignal {
  return {
    confidence: 78 + Math.floor(rand(tick * 7 + 1) * 18), // 78–95
    probability: 74 + Math.floor(rand(tick * 13 + 3) * 17), // 74–90
    trendUp: rand(tick * 5 + 9) > 0.42,
    timeframes: 3 + Math.floor(rand(tick * 3 + 5) * 3), // 3–5
    suggestionDirection: rand(tick * 17 + 2) > 0.5 ? "CALL" : "PUT",
    suggestionAsset: ASSETS[Math.floor(rand(tick * 11 + 4) * ASSETS.length)] ?? ASSETS[0],
  }
}

export type HeatState = "hot" | "warm" | "cold"

export interface HeatCell {
  asset: Asset
  change: number // variação simulada (%)
  state: HeatState
}

export function heatmap(tick: number): HeatCell[] {
  return ASSETS.map((asset, i) => {
    const v = rand(tick * 1000 + i * 97 + 7)
    const change = Math.round((v - 0.5) * 64) / 10 // ~ -3.2 .. +3.2
    const state: HeatState = change > 0.7 ? "hot" : change < -0.7 ? "cold" : "warm"
    return { asset, change, state }
  })
}
