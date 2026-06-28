"use client"

import { QuickProfiles, GaleCard, SorosCard } from "@/components/sections/StrategySections"
import { IndicatorsCard, FiltersCard } from "@/components/sections/TechnicalSections"
import type { BotConfig } from "@/lib/storage"
import type { UiPrefs } from "@/lib/prefs"
import type { Stats } from "@/lib/types"
import { PowerIcon, InfoIcon, BoltIcon } from "@/components/icons"

interface RoboTabProps {
  config: BotConfig
  patch: (c: Partial<BotConfig>) => void
  prefs: UiPrefs
  setPrefs: (p: UiPrefs) => void
  active: boolean
  onToggle: () => void
  activatedAt: number | null
  now: number
  nextStake: number
  galeStep: number
  stats: Stats
  riskMessage: string | null
}

const AMOUNTS = [1, 2, 5, 10, 20, 50, 100]

function uptime(activatedAt: number | null, now: number): string {
  if (!activatedAt) return "00h 00min"
  const s = Math.max(0, Math.floor((now - activatedAt) / 1000))
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}min`
}

export function RoboTab({
  config,
  patch,
  prefs,
  setPrefs,
  active,
  onToggle,
  activatedAt,
  now,
  nextStake,
  galeStep,
  riskMessage,
}: RoboTabProps) {
  return (
    <div className="tab-stack">
      <div className="card pad robo-status">
        <div className="rs-left">
          <span className="status-pill" data-on={active}>
            <span className="dot" data-on={active} />
            {active ? "ATIVO" : "PARADO"}
          </span>
          <div>
            <span className="lab">Tempo ligado</span>
            <div className="disp uptime">{active ? uptime(activatedAt, now) : "00h 00min"}</div>
          </div>
          {active && (
            <div>
              <span className="lab">Próximo valor</span>
              <div className="disp uptime accent">$ {nextStake}</div>
            </div>
          )}
        </div>
        <button type="button" className="power-btn rs-power" data-on={active} onClick={onToggle}>
          <span className="ring">
            <PowerIcon size={18} />
          </span>
          {active ? "Desativar robô" : "Ativar robô"}
        </button>
      </div>

      {riskMessage && (
        <div className="note risk-note">
          <InfoIcon size={16} />
          <span>{riskMessage}</span>
        </div>
      )}


      <section className="grid two-grid">
        <div className="card pad">
          <div className="card-head col">
            <div className="sc-titlewrap">
              <h3 className="disp-title">
                <BoltIcon size={16} /> Operações por hora
              </h3>
              <span className="sub">Ritmo do robô</span>
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
            <div className="sc-titlewrap">
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
          <span className="faint sm" style={{ display: "block", marginTop: 10 }}>
            Personalize o valor conforme a estratégia.
          </span>
        </div>
      </section>

      <QuickProfiles config={config} patch={patch} />

      <section className="grid two-grid">
        <GaleCard config={config} patch={patch} prefs={prefs} setPrefs={setPrefs} galeStep={galeStep} />
        <SorosCard config={config} patch={patch} />
      </section>

      <section className="grid two-grid">
        <IndicatorsCard prefs={prefs} setPrefs={setPrefs} />
        <FiltersCard prefs={prefs} setPrefs={setPrefs} />
      </section>
    </div>
  )
}
