import { describe, it, expect } from "vitest"
import { isWithinSchedule, type Schedule } from "@/lib/schedule"

const ALL_DAYS = [true, true, true, true, true, true, true]
const WEEKDAYS = [true, true, true, true, true, false, false] // Seg..Sex

// 2024-06-10 é uma segunda-feira; 2024-06-08 é sábado.
const mon = (h: number, m = 0) => new Date(2024, 5, 10, h, m)
const sat = (h: number, m = 0) => new Date(2024, 5, 8, h, m)

describe("isWithinSchedule", () => {
  it("permite sempre quando desligado", () => {
    const s: Schedule = { enabled: false, start: "09:00", end: "18:00", days: WEEKDAYS }
    expect(isWithinSchedule(s, mon(3))).toBe(true)
    expect(isWithinSchedule(s, sat(3))).toBe(true)
  })

  it("opera dentro da janela em dia permitido", () => {
    const s: Schedule = { enabled: true, start: "09:00", end: "18:00", days: WEEKDAYS }
    expect(isWithinSchedule(s, mon(10))).toBe(true)
  })

  it("bloqueia fora da janela", () => {
    const s: Schedule = { enabled: true, start: "09:00", end: "18:00", days: WEEKDAYS }
    expect(isWithinSchedule(s, mon(20))).toBe(false)
    expect(isWithinSchedule(s, mon(8, 59))).toBe(false)
  })

  it("bloqueia em dia não permitido", () => {
    const s: Schedule = { enabled: true, start: "09:00", end: "18:00", days: WEEKDAYS }
    expect(isWithinSchedule(s, sat(10))).toBe(false)
  })

  it("trata janela que vira a noite (22:00–06:00)", () => {
    const s: Schedule = { enabled: true, start: "22:00", end: "06:00", days: ALL_DAYS }
    expect(isWithinSchedule(s, mon(23))).toBe(true)
    expect(isWithinSchedule(s, mon(2))).toBe(true)
    expect(isWithinSchedule(s, mon(12))).toBe(false)
  })

  it("início igual ao fim permite o dia todo", () => {
    const s: Schedule = { enabled: true, start: "00:00", end: "00:00", days: ALL_DAYS }
    expect(isWithinSchedule(s, mon(13))).toBe(true)
  })
})
