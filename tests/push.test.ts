import { describe, it, expect } from "vitest"
import { milestoneFor, MILESTONES } from "@/lib/push"

describe("marcos de usuários", () => {
  it("não aponta marco antes do primeiro limite", () => {
    expect(milestoneFor(0)).toBeNull()
    expect(milestoneFor(9)).toBeNull()
  })

  it("aponta o marco exato quando o total bate no limite", () => {
    expect(milestoneFor(10)).toBe(10)
    expect(milestoneFor(50)).toBe(50)
    expect(milestoneFor(100)).toBe(100)
  })

  it("mantém o último marco alcançado entre limites", () => {
    expect(milestoneFor(11)).toBe(10)
    expect(milestoneFor(49)).toBe(25)
    expect(milestoneFor(99)).toBe(50)
  })

  it("não passa do maior marco definido", () => {
    const maior = MILESTONES[MILESTONES.length - 1]
    expect(milestoneFor(maior * 10)).toBe(maior)
  })

  it("mantém os limites em ordem crescente", () => {
    const ordenado = [...MILESTONES].sort((a, b) => a - b)
    expect([...MILESTONES]).toEqual(ordenado)
  })
})
