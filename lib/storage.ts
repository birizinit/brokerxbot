// Persistência local (localStorage). Mantém sessão, perfil de onboarding,
// configuração do bot e o estado ligado/desligado entre recarregamentos —
// é isso que garante que o bot permanece ligado se o usuário deixar ligado.

export interface Profile {
  name: string
  email: string
  phone: string
}

export interface BotConfig {
  opsPerHour: number
  amount: number
  isDemo: boolean
  // Sistema de Gale (martingale): ao perder, multiplica o valor da próxima.
  galeEnabled: boolean
  galeMultiplier: number
  galeMaxSteps: number
  // Sistema de Soros: reinveste o lucro nas operações seguintes ganhas.
  sorosEnabled: boolean
  sorosLevels: number
  sorosReinvest: number // fração do lucro reinvestida (1 / 0.75 / 0.5)
  // Gerenciamento de risco (0 = desligado). Quando atingido, o robô para.
  stopWin: number
  stopLoss: number
  dailyTargetPct: number // meta diária em % do saldo (0 = desligado)
}

const KEYS = {
  apiKey: "bo_api_key",
  profile: "bo_profile",
  botConfig: "bo_bot_config",
  botActive: "bo_bot_active",
  botActivatedAt: "bo_bot_activated_at",
  termsAccepted: "bo_terms_accepted",
  sidebarCollapsed: "bo_sidebar_collapsed",
} as const

export const DEFAULT_BOT_CONFIG: BotConfig = {
  opsPerHour: 6,
  amount: 5,
  isDemo: true,
  galeEnabled: false,
  galeMultiplier: 2,
  galeMaxSteps: 2,
  sorosEnabled: false,
  sorosLevels: 2,
  sorosReinvest: 1,
  stopWin: 0,
  stopLoss: 0,
  dailyTargetPct: 0,
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function remove(key: string): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(key)
}

export const storage = {
  getApiKey: () => read<string>(KEYS.apiKey),
  setApiKey: (value: string) => write(KEYS.apiKey, value),
  clearApiKey: () => remove(KEYS.apiKey),

  getProfile: () => read<Profile>(KEYS.profile),
  setProfile: (value: Profile) => write(KEYS.profile, value),

  getBotConfig: (): BotConfig => ({ ...DEFAULT_BOT_CONFIG, ...(read<Partial<BotConfig>>(KEYS.botConfig) ?? {}) }),
  setBotConfig: (value: BotConfig) => write(KEYS.botConfig, value),

  getBotActive: () => read<boolean>(KEYS.botActive) ?? false,
  setBotActive: (value: boolean) => write(KEYS.botActive, value),

  getBotActivatedAt: () => read<number>(KEYS.botActivatedAt),
  setBotActivatedAt: (value: number | null) =>
    value == null ? remove(KEYS.botActivatedAt) : write(KEYS.botActivatedAt, value),

  getTermsAccepted: () => read<boolean>(KEYS.termsAccepted) ?? false,
  setTermsAccepted: (value: boolean) => write(KEYS.termsAccepted, value),

  getSidebarCollapsed: () => read<boolean>(KEYS.sidebarCollapsed) ?? false,
  setSidebarCollapsed: (value: boolean) => write(KEYS.sidebarCollapsed, value),
}
