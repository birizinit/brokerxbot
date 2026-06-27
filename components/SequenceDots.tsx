import type { OpStatus } from "@/lib/types"

interface SequenceDotsProps {
  recent: OpStatus[] // mais novo primeiro
  max?: number
}

/** Mostra a sequência recente de resultados como bolinhas (verde ganho, vermelho perda). */
export function SequenceDots({ recent, max = 14 }: SequenceDotsProps) {
  // Exibe do mais antigo para o mais novo (esquerda → direita).
  const items = recent.slice(0, max).reverse()

  if (items.length === 0) {
    return <span className="seq-empty">Sem operações ainda</span>
  }

  return (
    <div className="seq">
      {items.map((s, i) => (
        <span key={i} className="seq-dot" data-r={s} title={s} />
      ))}
    </div>
  )
}
