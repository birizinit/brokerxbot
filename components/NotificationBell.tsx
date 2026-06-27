"use client"

import { useMemo, useState } from "react"
import type { BotOp } from "@/lib/types"
import { assetBySymbol } from "@/lib/assets"
import { BellIcon, ArrowUpIcon, ArrowDownIcon, CloseIcon } from "@/components/icons"

interface NotificationBellProps {
  ops: BotOp[]
  riskMessage: string | null
}

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function NotificationBell({ ops, riskMessage }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(0)

  const items = useMemo(
    () => ops.filter((o) => o.status === "won" || o.status === "lost").slice(0, 10),
    [ops],
  )
  const unread = items.filter((o) => o.time > seen).length

  const toggle = () => {
    setOpen((o) => !o)
    if (!open) setSeen(Date.now())
  }

  return (
    <div className="bell-wrap">
      <button className="icon-btn bell" onClick={toggle} aria-label="Notificações">
        <BellIcon size={18} />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <>
          <div className="bell-overlay" onClick={() => setOpen(false)} />
          <div className="bell-panel" role="menu">
            <div className="bell-head">
              <span>Notificações</span>
              <button className="bell-close" onClick={() => setOpen(false)} aria-label="Fechar">
                <CloseIcon size={15} />
              </button>
            </div>

            {riskMessage && (
              <div className="bell-item risk">
                <span className="bell-ic warn">!</span>
                <div className="bell-body">
                  <span className="bell-t">{riskMessage}</span>
                  <span className="bell-s">Robô parado pelo limite de risco</span>
                </div>
              </div>
            )}

            {items.length === 0 && !riskMessage ? (
              <div className="bell-empty">Sem notificações ainda.</div>
            ) : (
              items.map((o) => {
                const asset = assetBySymbol(o.symbol)
                const won = o.status === "won"
                return (
                  <div className="bell-item" key={o.id}>
                    <span className={`bell-ic ${won ? "up" : "down"}`}>
                      {won ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />}
                    </span>
                    <div className="bell-body">
                      <span className="bell-t">
                        {won ? "Vitória" : "Derrota"} em {asset.symbol.replace("USDT", "")}
                        <b className={won ? "up" : "down"}>
                          {" "}
                          {o.pnl != null ? `${o.pnl >= 0 ? "+" : ""}${o.pnl.toFixed(2)}` : ""}
                        </b>
                      </span>
                      <span className="bell-s">
                        {timeOf(o.time)} · ${o.amount} · {o.isDemo ? "Demo" : "Real"}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
