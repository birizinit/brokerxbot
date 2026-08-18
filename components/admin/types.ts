export interface ClientRow {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
}

export interface AdminRow {
  id: string
  name: string
  email: string
  created_at: string
}

export interface DailyPoint {
  date: string // YYYY-MM-DD
  count: number
}

export interface AdminStats {
  accounts: number
  buyers: number
  pendingBuyers: number
  volume: number
  activeBots: number
  totalOps: number
  wins: number
  losses: number
  pnlSum: number
  signupsPerDay: DailyPoint[]
  opsPerDay: DailyPoint[]
}

export interface BuyerRow {
  id: string
  email: string
  name: string
  note: string | null
  created_at: string
  /** Verdadeiro se já existe conta criada com esse e-mail. */
  registered: boolean
}

export interface TopUser {
  id: string
  name: string
  email: string
  ops: number
  volume: number
  pnl: number
  wins: number
  losses: number
  botActive: boolean
  lastOpAt: string | null
}
