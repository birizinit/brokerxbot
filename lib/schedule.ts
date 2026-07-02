// Janela de operação. Decide se a IA pode operar agora conforme
// dias da semana e o intervalo de horário configurados.

export interface Schedule {
  enabled: boolean
  start: string // "HH:MM"
  end: string // "HH:MM"
  days: boolean[] // [Seg, Ter, Qua, Qui, Sex, Sáb, Dom]
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10))
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

/** Verdadeiro se a IA está autorizada a operar no instante atual. */
export function isWithinSchedule(s: Schedule, at: Date = new Date()): boolean {
  if (!s.enabled) return true

  // getDay(): 0=Dom..6=Sáb → índice da nossa semana (0=Seg..6=Dom).
  const dayIdx = (at.getDay() + 6) % 7
  if (!s.days[dayIdx]) return false

  const cur = at.getHours() * 60 + at.getMinutes()
  const start = toMinutes(s.start)
  const end = toMinutes(s.end)
  if (start === end) return true
  return start < end ? cur >= start && cur < end : cur >= start || cur < end
}
