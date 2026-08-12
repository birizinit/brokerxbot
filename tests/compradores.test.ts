import { describe, it, expect } from "vitest"
import { isComprador, totalCompradores, listaCompradores } from "@/lib/compradores"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

describe("lista de compradores", () => {
  it("libera um e-mail que está na planilha", () => {
    expect(isComprador("ricardolonog@yahoo.com.br")).toBe(true)
    expect(isComprador("neiltonf426@gmail.com")).toBe(true)
    expect(isComprador("pauloandrepimentelaraujo@gmail.com")).toBe(true)
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

  // Guarda contra erro de edição: uma linha com o nome colado junto do e-mail,
  // ou um endereço truncado, entraria na lista sem este teste perceber.
  it("só contém endereços de e-mail bem formados", () => {
    const invalidos = listaCompradores().filter((email) => !EMAIL_RE.test(email))
    expect(invalidos).toEqual([])
  })

  it("carrega a lista sem ficar vazia", () => {
    expect(totalCompradores()).toBeGreaterThan(0)
  })
})
