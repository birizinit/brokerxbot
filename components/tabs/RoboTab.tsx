"use client"

import { SequenceDots } from "@/components/SequenceDots"
import type { BotConfig } from "@/lib/storage"
import type { Stats } from "@/lib/types"
import { PowerIcon, ActivityIcon, InfoIcon, BoltIcon, FlameIcon, LayersIcon } from "@/components/icons"

interface RoboTabProps {
  active: boolean
  onToggle: () => void
  nextRunAt: number | null
  now: number
  nextStake: number
  galeStep: number
  config: BotConfig
  stats: Stats
  riskMessage: string | null
}

function countdown(nextRunAt: number | null, now: number): string | null {
  if (!nextRunAt) return null
  const secs = Math.max(0, Math.ceil((nextRunAt - now) / 1000))
  return `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
}

export function RoboTab({
  active,
  onToggle,
  nextRunAt,
  now,
  nextStake,
  galeStep,
  config,
  stats,
  riskMessage,
}: RoboTabProps) {
  const cd = active ? countdown(nextRunAt, now) : null

  return (
    <div className="grid robo-grid">
      <div className="card bot-panel card-glow">
        <div className="bot-status">
          <h3>Robô de operações</h3>
          <span className="status-pill" data-on={active}>
            <span className="dot" data-on={active} />
            {active ? "Operando" : "Parado"}
          </span>
        </div>

        <button type="button" className="power-btn" data-on={active} onClick={onToggle}>
          <span className="ring">
            <PowerIcon size={18} />
          </span>
          {active ? "Desativar robô" : "Ativar robô"}
        </button>

        {riskMessage && (
          <div className="note risk-note">
            <InfoIcon size={16} />
            <span>{riskMessage}</span>
          </div>
        )}

        {active && cd && (
          <div className="note">
            <ActivityIcon size={16} />
            <span>
              Próxima operação em <b className="num accent">{cd}</b> · valor{" "}
              <b className="num accent">$ {nextStake}</b>
            </span>
          </div>
        )}

        <div className="note">
          <InfoIcon size={16} />
          <span>
            O robô permanece ligado até você desativar. Só para sozinho se um limite de risco
            configurado (Stop Win/Loss) for atingido.
          </span>
        </div>
      </div>

      <div className="stack" style={{ gap: 16 }}>
        <div className="card pad">
          <h3 className="mini-title">Situação</h3>
          <div className="kv-list">
            <div className="kv">
              <span className="muted">
                <BoltIcon size={15} /> Próximo valor
              </span>
              <span className="num accent">$ {nextStake}</span>
            </div>
            <div className="kv">
              <span className="muted">
                <FlameIcon size={15} /> Nível de Gale
              </span>
              <span className="num">{config.galeEnabled ? `${galeStep}/${config.galeMaxSteps}` : "off"}</span>
            </div>
            <div className="kv">
              <span className="muted">
                <LayersIcon size={15} /> Soros
              </span>
              <span className="num">{config.sorosEnabled ? "ativo" : "off"}</span>
            </div>
            <div className="kv">
              <span className="muted">Conta</span>
              <span className={`num ${config.isDemo ? "" : "down"}`}>{config.isDemo ? "Demo" : "Real"}</span>
            </div>
            <div className="kv">
              <span className="muted">Em aberto</span>
              <span className="num">{stats.pending}</span>
            </div>
          </div>
        </div>

        <div className="card pad">
          <h3 className="mini-title">Sequência</h3>
          <SequenceDots recent={stats.recent} />
        </div>
      </div>
    </div>
  )
}
