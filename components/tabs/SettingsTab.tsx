"use client"

import type { BotConfig, Profile } from "@/lib/storage"
import { ASSETS } from "@/lib/assets"
import { LogoutIcon, ShieldIcon } from "@/components/icons"

interface SettingsTabProps {
  config: BotConfig
  patch: (changes: Partial<BotConfig>) => void
  profile: Profile
  onLogout: () => void
  onOpenTerms: () => void
}

const AMOUNTS = [1, 5, 10, 25, 50, 100]
const MIN_OPS = 1
const MAX_OPS = 60

export function SettingsTab({ config, patch, profile, onLogout, onOpenTerms }: SettingsTabProps) {
  return (
    <div className="grid manage-grid">
      <div className="card pad">
        <h3 className="mini-title">Operação</h3>

        <div className="config-row">
          <div className="head">
            <span className="k">Operações por hora</span>
            <span className="v num accent">{config.opsPerHour}</span>
          </div>
          <input
            className="range"
            type="range"
            min={MIN_OPS}
            max={MAX_OPS}
            value={config.opsPerHour}
            onChange={(e) => patch({ opsPerHour: Number(e.target.value) })}
          />
          <span className="hint">1 operação a cada {Math.max(2, Math.round(3600 / config.opsPerHour))} segundos.</span>
        </div>

        <div className="config-row">
          <div className="head">
            <span className="k">Valor base por operação</span>
            <span className="v num">$ {config.amount}</span>
          </div>
          <div className="chips">
            {AMOUNTS.map((a) => (
              <button key={a} className="chip" data-on={config.amount === a} onClick={() => patch({ amount: a })}>
                ${a}
              </button>
            ))}
          </div>
        </div>

        <div className="config-row">
          <div className="head">
            <span className="k">Tipo de conta</span>
          </div>
          <div className="seg">
            <button data-on={config.isDemo} onClick={() => patch({ isDemo: true })}>
              Demo
            </button>
            <button data-on={!config.isDemo} onClick={() => patch({ isDemo: false })}>
              Real
            </button>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 16 }}>
        <div className="card pad">
          <div className="card-head">
            <h3 className="mini-title" style={{ marginBottom: 0 }}>
              Ativos
            </h3>
            <span className="hint">Escolhidos conforme o movimento do mercado</span>
          </div>
          <div className="asset-row" style={{ marginTop: 14 }}>
            {ASSETS.map((a) => (
              <span className="asset-coin" key={a.symbol} title={a.name}>
                <img src={a.logo} alt={a.name} />
              </span>
            ))}
          </div>
        </div>

        <div className="card pad">
          <h3 className="mini-title">Conta</h3>
          <div className="kv-list">
            <div className="kv">
              <span className="muted">Nome</span>
              <span>{profile.name}</span>
            </div>
            <div className="kv">
              <span className="muted">E-mail</span>
              <span className="faint">{profile.email}</span>
            </div>
          </div>
          <div className="settings-actions">
            <button className="btn btn-ghost" onClick={onOpenTerms}>
              <ShieldIcon size={17} /> Ver termo de aceite
            </button>
            <button className="btn btn-danger" onClick={onLogout}>
              <LogoutIcon size={17} /> Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
