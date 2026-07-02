"use client"

import { useMemo } from "react"
import { MetricCard } from "@/components/MetricCard"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { SequenceDots } from "@/components/SequenceDots"
import { marketSignal, heatmap } from "@/lib/market"
import type { BotConfig } from "@/lib/storage"
import type { Stats } from "@/lib/types"
import {
  WalletIcon,
  BoltIcon,
  ActivityIcon,
  DollarIcon,
  TrophyIcon,
  CpuIcon,
  GridIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PowerIcon,
} from "@/components/icons"

interface DashboardTabProps {
  balance: number | null
  stats: Stats
  config: BotConfig
  patch: (changes: Partial<BotConfig>) => void
  active: boolean
  onToggle: () => void
  activatedAt: number | null
  now: number
  tick: number
}

const AMOUNTS = [1, 2, 5, 10, 20, 50, 100]

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function uptime(activatedAt: number | null, now: number): string {
  if (!activatedAt) return "00h 00min"
  const s = Math.max(0, Math.floor((now - activatedAt) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min`
}

export function DashboardTab({
  balance,
  stats,
  config,
  patch,
  active,
  onToggle,
  activatedAt,
  now,
  tick,
}: DashboardTabProps) {
  const signal = useMemo(() => marketSignal(tick), [tick])
  const cells = useMemo(() => heatmap(tick), [tick])
  const intelConf = Math.min(99, signal.confidence + 4)
  const favorable = signal.confidence >= 82

  return (
    <div className="tab-stack">
      {/* Métricas */}
      <section className="grid metrics-grid">
        <MetricCard
          icon={<WalletIcon size={17} />}
          label="Saldo corretora"
          value={balance === null ? "—" : <AnimatedNumber value={balance} format={(v) => `$ ${money(v)}`} />}
          sub={<span className="faint">Atualizado agora</span>}
        />
        <MetricCard
          icon={<BoltIcon size={17} />}
          label="Ops por hora"
          value={String(config.opsPerHour)}
          sub={<span className="faint">Ritmo configurado</span>}
        />
        <MetricCard
          icon={<ActivityIcon size={17} />}
          label="Ops enviadas"
          value={<AnimatedNumber value={stats.sent} format={(v) => String(Math.round(v))} />}
          sub={<span className="faint">Hoje</span>}
        />
        <MetricCard
          icon={<DollarIcon size={17} />}
          label="Lucro do dia"
          value={<AnimatedNumber value={stats.dayPnl} format={(v) => `${v >= 0 ? "+" : ""}$ ${money(v)}`} />}
          tone={stats.dayPnl > 0 ? "up" : stats.dayPnl < 0 ? "down" : "default"}
          sub={<span className={stats.roi >= 0 ? "up" : "down"}>{stats.roi >= 0 ? "+" : ""}{stats.roi}% ROI</span>}
        />
        <MetricCard
          icon={<TrophyIcon size={17} />}
          label="Assertividade"
          value={<AnimatedNumber value={stats.winRate} format={(v) => `${v.toFixed(1)}%`} />}
          tone={stats.winRate >= 50 ? "up" : stats.winRate > 0 ? "down" : "default"}
          sub={
            <span className="faint">
              <span className="up">{stats.wins}W</span> · <span className="down">{stats.losses}L</span>
            </span>
          }
        />
      </section>

      {/* Sequência + Status do mercado */}
      <section className="grid two-grid">
        <div className="card pad">
          <div className="card-head col">
            <div>
              <h3 className="disp-title">Sequência atual</h3>
              <span className="sub">Últimas operações</span>
            </div>
            <ActivityIcon size={18} className="accent" />
          </div>
          <SequenceDots recent={stats.recent} />
          <div className="seq-foot">
            <span className="muted">
              {stats.streak >= 0 ? "Wins consecutivos" : "Perdas consecutivas"}
            </span>
            <span className="disp big-num accent">{Math.abs(stats.streak)}</span>
          </div>
        </div>

        <div className="card pad">
          <div className="card-head col">
            <div>
              <h3 className="disp-title">Status do mercado</h3>
              <span className="sub">Análise em tempo real</span>
            </div>
            <ActivityIcon size={18} className="accent" />
          </div>
          <span className={`market-pill ${favorable ? "good" : "neutral"}`}>
            <span className="d" /> {favorable ? "Mercado favorável" : "Mercado neutro"}
          </span>
          <div className="market-cols">
            <div>
              <span className="lab">Confiança</span>
              <div className="disp big-num">{signal.confidence}%</div>
              <div className="bar">
                <span style={{ width: `${signal.confidence}%` }} />
              </div>
            </div>
            <div>
              <span className="lab">Tendência</span>
              <div className={`disp big-num ${signal.trendUp ? "up" : "down"}`}>
                {signal.trendUp ? "Alta" : "Baixa"} {signal.trendUp ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
              </div>
              <span className="faint sm">Confirmada em {signal.timeframes} timeframes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Power + Inteligência + Heatmap */}
      <section className="grid power-grid">
        <div className="card pad power-card">
          <button type="button" className={`power-orb ${active ? "on" : ""}`} onClick={onToggle} aria-label={active ? "Desativar" : "Ativar"}>
            <PowerIcon size={46} strokeWidth={2} />
          </button>
          <div className={`power-state ${active ? "on" : ""}`}>
            <span className="d" /> {active ? "ATIVO" : "PARADO"}
          </div>
          <span className="lab">Tempo ligado</span>
          <div className="disp uptime">{active ? uptime(activatedAt, now) : "00h 00min"}</div>
        </div>

        <div className="card pad">
          <div className="card-head col">
            <div>
              <h3 className="disp-title">Inteligência do mercado</h3>
              <span className="sub">Análise em tempo real</span>
            </div>
            <CpuIcon size={18} className="accent" />
          </div>
          <div className="intel-quad">
            <div className="iq">
              <span className="lab">Confiança</span>
              <span className="disp big-num accent">{intelConf}%</span>
            </div>
            <div className="iq">
              <span className="lab">Prob. acerto</span>
              <span className="disp big-num accent">{signal.probability}%</span>
            </div>
            <div className="iq">
              <span className="lab">Mercado</span>
              <span className={`disp md ${favorable ? "up" : "down"}`}>{favorable ? "Favorável" : "Neutro"}</span>
            </div>
            <div className="iq">
              <span className="lab">Ativo</span>
              <span className="disp md">{signal.suggestionAsset.symbol.replace("USDT", "")}/USD</span>
            </div>
          </div>
          <div className="sug">
            <div>
              <span className="lab">Operação sugerida</span>
              <span className="disp md">
                {signal.suggestionDirection} · {signal.suggestionAsset.symbol.replace("USDT", "")}/USD
              </span>
            </div>
            <span className={`op-badge ${signal.suggestionDirection === "CALL" ? "up" : "down"}`}>
              {signal.suggestionDirection}
            </span>
          </div>
        </div>

        <div className="card pad">
          <div className="card-head col">
            <div>
              <h3 className="disp-title">Heatmap de ativos</h3>
              <span className="sub">Condição instantânea</span>
            </div>
            <GridIcon size={18} className="accent" />
          </div>
          <div className="heat">
            {cells.map((c) => (
              <div key={c.asset.symbol} className="heat-cell" data-state={c.state}>
                <span className="num heat-sym">{c.asset.symbol.replace("USDT", "")}</span>
                <span className="heat-dot" data-state={c.state} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operações por hora + Valor */}
      <section className="grid two-grid">
        <div className="card pad">
          <div className="card-head col">
            <div>
              <h3 className="disp-title">Operações por hora</h3>
              <span className="sub">Ritmo da IA</span>
            </div>
          </div>
          <div className="ops-head">
            <span className="disp big-num accent">{config.opsPerHour}</span>
            <span className="faint sm">≈ 1 operação a cada {Math.max(2, Math.round(3600 / config.opsPerHour))} s</span>
          </div>
          <input
            className="range"
            type="range"
            min={1}
            max={60}
            value={config.opsPerHour}
            onChange={(e) => patch({ opsPerHour: Number(e.target.value) })}
          />
          <div className="range-scale">
            <span>1</span>
            <span>30</span>
            <span>60</span>
          </div>
        </div>

        <div className="card pad">
          <div className="card-head col">
            <div>
              <h3 className="disp-title">Valor por operação</h3>
              <span className="sub">Entrada padrão</span>
            </div>
          </div>
          <div className="amount-grid">
            {AMOUNTS.map((a) => (
              <button key={a} className="amount-btn" data-on={config.amount === a} onClick={() => patch({ amount: a })}>
                ${a}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
