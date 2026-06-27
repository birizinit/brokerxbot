// Preferências de interface (estética). Estes controles têm estado salvo,
// mas NÃO afetam a lógica de operação do robô — a corretora não expõe
// indicadores técnicos, filtros nem agendamento por API.

export interface UiPrefs {
  indicators: Record<string, boolean>
  filters: Record<string, boolean>
  galeDelay: number
  galeOnlyAfterLoss: boolean
  galeRestartAfterWin: boolean
  scheduleEnabled: boolean
  windowStart: string // "HH:MM"
  windowEnd: string // "HH:MM"
  days: boolean[]
  notif: Record<string, boolean>
}

export const INDICATORS: { key: string; name: string; desc: string }[] = [
  { key: "rsi", name: "RSI", desc: "Força relativa" },
  { key: "macd", name: "MACD", desc: "Convergência de médias" },
  { key: "ema9", name: "EMA 9", desc: "Média rápida" },
  { key: "ema21", name: "EMA 21", desc: "Média intermediária" },
  { key: "ema200", name: "EMA 200", desc: "Tendência de longo prazo" },
  { key: "bollinger", name: "Bandas de Bollinger", desc: "Volatilidade" },
  { key: "adx", name: "ADX", desc: "Força da tendência" },
  { key: "volume", name: "Volume", desc: "Pressão compra/venda" },
  { key: "vwap", name: "VWAP", desc: "Preço médio ponderado" },
  { key: "atr", name: "ATR", desc: "Range médio verdadeiro" },
]

export const FILTERS: { key: string; name: string }[] = [
  { key: "trend", name: "Operar somente com tendência" },
  { key: "pullback", name: "Confirmar pullback" },
  { key: "lateral", name: "Ignorar lateralização" },
  { key: "breakout", name: "Confirmar rompimento" },
  { key: "volup", name: "Confirmar aumento de volume" },
  { key: "candle", name: "Confirmar força do candle" },
  { key: "news", name: "Evitar notícias" },
  { key: "lowvol", name: "Evitar baixa volatilidade" },
]

export const NOTIF_TYPES: { key: string; name: string }[] = [
  { key: "win", name: "WIN" },
  { key: "loss", name: "LOSS" },
  { key: "gale", name: "GALE" },
  { key: "stopWin", name: "STOP WIN" },
  { key: "stopLoss", name: "STOP LOSS" },
  { key: "botOn", name: "Robô ligado" },
  { key: "botOff", name: "Robô desligado" },
  { key: "connLost", name: "Conexão perdida" },
]

export const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

function allOn(keys: { key: string }[], except: string[] = []): Record<string, boolean> {
  return Object.fromEntries(keys.map((k) => [k.key, !except.includes(k.key)]))
}

export const DEFAULT_PREFS: UiPrefs = {
  indicators: allOn(INDICATORS, ["atr", "vwap"]),
  filters: allOn(FILTERS, ["news", "lowvol"]),
  galeDelay: 10,
  galeOnlyAfterLoss: true,
  galeRestartAfterWin: true,
  scheduleEnabled: false,
  windowStart: "09:00",
  windowEnd: "18:00",
  days: [true, true, true, true, true, false, false],
  notif: allOn(NOTIF_TYPES),
}

const KEY = "bo_ui_prefs"

export function getPrefs(): UiPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const saved = JSON.parse(raw) as Partial<UiPrefs>
    return {
      ...DEFAULT_PREFS,
      ...saved,
      indicators: { ...DEFAULT_PREFS.indicators, ...(saved.indicators ?? {}) },
      filters: { ...DEFAULT_PREFS.filters, ...(saved.filters ?? {}) },
      notif: { ...DEFAULT_PREFS.notif, ...(saved.notif ?? {}) },
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function setPrefs(value: UiPrefs): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(value))
}
