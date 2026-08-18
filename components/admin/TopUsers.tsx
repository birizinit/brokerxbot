"use client"

import { useMemo, useState } from "react"
import type { TopUser } from "@/components/admin/types"
import { TrophyIcon, ActivityIcon, DollarIcon } from "@/components/icons"

type Ordem = "volume" | "ops" | "pnl"

const ORDENS: { id: Ordem; label: string }[] = [
  { id: "volume", label: "Volume" },
  { id: "ops", label: "Operações" },
  { id: "pnl", label: "Resultado" },
]

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?"
}

function desde(iso: string | null): string {
  if (!iso) return "nunca operou"
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return "operou hoje"
  if (dias === 1) return "ontem"
  return `há ${dias} dias`
}

export function TopUsers({ users }: { users: TopUser[] }) {
  const [ordem, setOrdem] = useState<Ordem>("volume")

  const lista = useMemo(() => {
    const copia = [...users]
    copia.sort((a, b) => (ordem === "ops" ? b.ops - a.ops : ordem === "pnl" ? b.pnl - a.pnl : b.volume - a.volume))
    return copia.slice(0, 10)
  }, [users, ordem])

  const maior = lista.length
    ? Math.max(...lista.map((u) => (ordem === "ops" ? u.ops : ordem === "pnl" ? Math.abs(u.pnl) : u.volume)), 1)
    : 1

  return (
    <div className="card pad">
      <div className="a-chart-head">
        <h3 className="disp-title">
          <TrophyIcon size={15} /> Top usuários
        </h3>
        <div className="a-seg a-seg-sm">
          {ORDENS.map((o) => (
            <button key={o.id} type="button" data-on={ordem === o.id} onClick={() => setOrdem(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="a-chart-empty">Nenhuma operação registrada ainda.</p>
      ) : (
        <div className="a-rank">
          {lista.map((u, i) => {
            const valor = ordem === "ops" ? u.ops : ordem === "pnl" ? u.pnl : u.volume
            const largura = Math.max(3, (Math.abs(valor) / maior) * 100)
            const decididas = u.wins + u.losses
            const acerto = decididas > 0 ? (u.wins / decididas) * 100 : 0

            return (
              <div key={u.id} className="a-rank-row">
                <span className="a-rank-pos">{i + 1}</span>
                <span className="a-rank-av">{initials(u.name)}</span>

                <div className="a-rank-main">
                  <div className="a-rank-top">
                    <span className="a-rank-name">{u.name}</span>
                    {u.botActive && <span className="a-tag on">IA on</span>}
                  </div>
                  <span className="a-rank-mail">{u.email}</span>
                  <div className="a-rank-bar">
                    <span className={"a-rank-fill" + (ordem === "pnl" && valor < 0 ? " neg" : "")} style={{ width: largura + "%" }} />
                  </div>
                  <div className="a-rank-meta">
                    <span>
                      <ActivityIcon size={12} /> {u.ops} op
                    </span>
                    <span>
                      <DollarIcon size={12} /> $ {money(u.volume)}
                    </span>
                    {decididas > 0 && <span>{acerto.toFixed(0)}% acerto</span>}
                    <span className="faint">{desde(u.lastOpAt)}</span>
                  </div>
                </div>

                <span className={"a-rank-val num " + (u.pnl > 0 ? "up" : u.pnl < 0 ? "down" : "")}>
                  {ordem === "ops" ? u.ops : `${u.pnl >= 0 ? "+" : "-"}$ ${money(Math.abs(u.pnl))}`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
