"use client"

import { useMemo, useState } from "react"
import { LineChart } from "@/components/LineChart"
import { HistoryTable } from "@/components/HistoryTable"
import { balanceSeries } from "@/lib/stats"
import type { BotOp, Stats } from "@/lib/types"
import { ChartIcon } from "@/components/icons"

interface StatsTabProps {
  ops: BotOp[]
  stats: Stats
}

type Range = "today" | "7d" | "30d"

function sinceFor(range: Range): number {
  const now = new Date()
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  }
  const days = range === "7d" ? 7 : 30
  return Date.now() - days * 24 * 60 * 60 * 1000
}

export function StatsTab({ ops, stats }: StatsTabProps) {
  const [range, setRange] = useState<Range>("today")
  const series = useMemo(() => balanceSeries(ops, sinceFor(range)), [ops, range])
  const decided = stats.wins + stats.losses
  const winPct = decided > 0 ? (stats.wins / decided) * 100 : 0

  return (
    <div className="tab-stack">
      <div className="card pad">
        <div className="card-head">
          <h3>
            <ChartIcon size={15} /> Evolução do resultado
          </h3>
          <div className="seg">
            <button data-on={range === "today"} onClick={() => setRange("today")}>
              Hoje
            </button>
            <button data-on={range === "7d"} onClick={() => setRange("7d")}>
              7 dias
            </button>
            <button data-on={range === "30d"} onClick={() => setRange("30d")}>
              30 dias
            </button>
          </div>
        </div>
        <LineChart points={series} />
      </div>

      <section className="grid breakdown-grid">
        <div className="card pad">
          <h3 className="mini-title">Assertividade</h3>
          <div className="big-rate num">{stats.winRate}%</div>
          <div className="wl-bar">
            <span className="wl-win" style={{ width: `${winPct}%` }} />
            <span className="wl-loss" style={{ width: `${100 - winPct}%` }} />
          </div>
          <div className="wl-legend">
            <span>
              <i className="dot-win" /> {stats.wins} ganhos
            </span>
            <span>
              <i className="dot-loss" /> {stats.losses} perdas
            </span>
          </div>
        </div>

        <div className="card pad">
          <h3 className="mini-title">Resumo</h3>
          <div className="kv-list">
            <div className="kv">
              <span className="muted">Operações enviadas</span>
              <span className="num">{stats.sent}</span>
            </div>
            <div className="kv">
              <span className="muted">Liquidadas</span>
              <span className="num">{stats.settled}</span>
            </div>
            <div className="kv">
              <span className="muted">Em aberto</span>
              <span className="num">{stats.pending}</span>
            </div>
            <div className="kv">
              <span className="muted">Lucro do dia</span>
              <span className={`num ${stats.dayPnl >= 0 ? "up" : "down"}`}>
                {stats.dayPnl >= 0 ? "+" : ""}${stats.dayPnl.toFixed(2)}
              </span>
            </div>
            <div className="kv">
              <span className="muted">ROI</span>
              <span className={`num ${stats.roi >= 0 ? "up" : "down"}`}>
                {stats.roi >= 0 ? "+" : ""}
                {stats.roi}%
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="card pad">
        <h3 className="mini-title">Histórico de operações</h3>
        <HistoryTable ops={ops} />
      </div>
    </div>
  )
}
