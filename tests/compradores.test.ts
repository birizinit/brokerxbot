import { describe, it, expect } from "vitest"
import { isComprador, totalCompradores } from "@/lib/compradores"

describe("lista de compradores", () => {
  it("libera um e-mail que está na planilha", () => {
    expect(isComprador("ricardolonog@yahoo.com.br")).toBe(true)
    expect(isComprador("neiltonf426@gmail.com")).toBe(true)
  })

  it("bloqueia um e-mail que não está na planilha", () => {
    expect(isComprador("desconhecido@gmail.com")).toBe(false)
  })

  it("ignora maiúsculas e espaços sobrando", () => {
    expect(isComprador("  Silvana.Zibetti@GMAIL.com  ")).toBe(true)
  })

  it("não trata comentário nem linha vazia como e-mail liberado", () => {
    expect(isComprador("")).toBe(false)
    expect(isComprador("# Ricardo Lobo Nogueira")).toBe(false)
  })

  it("carrega os 22 compradores da planilha", () => {
    expect(totalCompradores()).toBe(22)
  })
})
