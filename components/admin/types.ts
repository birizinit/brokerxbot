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
  activeBots: number
  totalOps: number
  wins: number
  losses: number
  pnlSum: number
  signupsPerDay: DailyPoint[]
  opsPerDay: DailyPoint[]
}
