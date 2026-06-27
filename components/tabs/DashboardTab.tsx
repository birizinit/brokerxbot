"use client"

import { useMemo } from "react"
import { MetricCard } from "@/components/MetricCard"
import { SequenceDots } from "@/components/SequenceDots"
import { marketSignal, heatmap } from "@/lib/market"
import { assetBySymbol } from "@/lib/assets"
import type { Stats } from "@/lib/types"
import {
  WalletIcon,
  BoltIcon,
  ActivityIcon,
  DollarIcon,
  TrophyIcon,
  CpuIcon,
  TargetIcon,
  GridIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@/components/icons"

interface DashboardTabProps {
  balance: number | null
  stats: Stats
  opsPerHour: number
  tick: number
}

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function DashboardTab({ balance, stats, opsPerHour, tick }: DashboardTabProps) {
  const signal = useMemo(() => marketSignal(tick), [tick])
  const cells = useMemo(() => heatmap(tick), [tick])
  const sugAsset = signal.suggestionAsset

  return (
    <div className="tab-stack">
      <section className="grid metrics-grid">
        <MetricCard
          icon={<WalletIcon size={16} />}
          label="Saldo corretora"
          value={balance === null ? "—" : `$ ${money(balance)}`}
        />
        <MetricCard icon={<BoltIcon size={16} />} label="Ops por hora" value={String(opsPerHour)} />
        <MetricCard icon={<ActivityIcon size={16} />} label="Ops enviadas" value={String(stats.sent)} />
        <MetricCard
          icon={<DollarIcon size={16} />}
          label="Lucro do dia"
          value={`${stats.dayPnl >= 0 ? "+" : ""}$ ${money(stats.dayPnl)}`}
          tone={stats.dayPnl > 0 ? "up" : stats.dayPnl < 0 ? "down" : "default"}
          sub={<span className={stats.roi >= 0 ? "up" : "down"}>{stats.roi >= 0 ? "+" : ""}{stats.roi}% ROI</span>}
        />
        <MetricCard
          icon={<TrophyIcon size={16} />}
          label="Assertividade"
          value={`${stats.winRate}%`}
          tone={stats.winRate >= 50 ? "up" : stats.winRate > 0 ? "down" : "default"}
          sub={
            <span className="faint">
              <span className="up">{stats.wins}V</span> · <span className="down">{stats.losses}D</span>
            </span>
          }
        />
      </section>

      <section className="grid dash-grid">
        <div className="card pad">
          <div className="card-head">
            <h3>Sequência atual</h3>
            <span className={`streak-badge ${stats.streak >= 0 ? "up" : "down"}`}>
              {stats.streak > 0
                ? `${stats.streak} vitórias seguidas`
                : stats.streak < 0
                  ? `${Math.abs(stats.streak)} derrotas seguidas`
                  : "neutro"}
            </span>
          </div>
          <SequenceDots recent={stats.recent} />
        </div>

        <div className="card pad intel">
          <div className="card-head">
            <h3>
              <CpuIcon size={15} /> Inteligência de mercado
            </h3>
            <span className="sim-tag">simulado</span>
          </div>
          <div className="intel-rows">
            <div className="intel-row">
              <span className="muted">Confiança</span>
              <div className="bar">
                <span style={{ width: `${signal.confidence}%` }} />
              </div>
              <span className="num accent">{signal.confidence}%</span>
            </div>
            <div className="intel-row">
              <span className="muted">
                <TargetIcon size={14} /> Probabilidade
              </span>
              <div className="bar">
                <span style={{ width: `${signal.probability}%` }} />
              </div>
              <span className="num accent">{signal.probability}%</span>
            </div>
          </div>
          <div className="suggestion">
            <div className={`sug-dir ${signal.trendUp ? "up" : "down"}`}>
              {signal.trendUp ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
              Tendência {signal.trendUp ? "de alta" : "de baixa"} · {signal.timeframes} timeframes
            </div>
            <div className="sug-op">
              <span className="cell-asset">
                {sugAsset.logo && <img src={sugAsset.logo} alt="" />}
                <span className="num">{sugAsset.symbol.replace("USDT", "")}</span>
              </span>
              <span className={`op-badge ${signal.suggestionDirection === "CALL" ? "up" : "down"}`}>
                {signal.suggestionDirection}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="card pad">
        <div className="card-head">
          <h3>
            <GridIcon size={15} /> Heatmap de ativos
          </h3>
          <span className="sim-tag">tempo real (simulado)</span>
        </div>
        <div className="heat">
          {cells.map((c) => (
            <div key={c.asset.symbol} className="heat-cell" data-state={c.state}>
              {c.asset.logo && <img src={c.asset.logo} alt="" />}
              <span className="num heat-sym">{c.asset.symbol.replace("USDT", "")}</span>
              <span className={`num heat-chg ${c.change >= 0 ? "up" : "down"}`}>
                {c.change >= 0 ? "+" : ""}
                {c.change}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
