"use client"

import type { BotConfig } from "@/lib/storage"
import { ShieldIcon, FlameIcon, LayersIcon } from "@/components/icons"

interface RiskTabProps {
  config: BotConfig
  patch: (changes: Partial<BotConfig>) => void
  galeStep: number
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="switch"
      data-on={on}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <span className="switch-knob" />
    </button>
  )
}

export function RiskTab({ config, patch, galeStep }: RiskTabProps) {
  return (
    <div className="grid manage-grid">
      <div className="card pad">
        <div className="card-head">
          <h3>
            <ShieldIcon size={15} /> Gerenciamento de risco
          </h3>
        </div>
        <p className="hint" style={{ marginBottom: 16 }}>
          Quando atingido, o robô para automaticamente. Deixe em 0 para desativar.
        </p>

        <div className="field">
          <label className="label up">Stop Win (lucro do dia)</label>
          <div className="input-wrap">
            <span className="lead">$</span>
            <input
              className="input has-lead num"
              type="number"
              min={0}
              step={1}
              value={config.stopWin || ""}
              placeholder="0 (desativado)"
              onChange={(e) => patch({ stopWin: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="label down">Stop Loss (prejuízo do dia)</label>
          <div className="input-wrap">
            <span className="lead">$</span>
            <input
              className="input has-lead num"
              type="number"
              min={0}
              step={1}
              value={config.stopLoss || ""}
              placeholder="0 (desativado)"
              onChange={(e) => patch({ stopLoss: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 16 }}>
        <div className="card pad">
          <div className="card-head">
            <h3>
              <FlameIcon size={15} /> Sistema de Gale
            </h3>
            <Toggle on={config.galeEnabled} onChange={(v) => patch({ galeEnabled: v })} />
          </div>
          <p className="hint">Ao perder, multiplica o valor da próxima operação para recuperar.</p>

          <div className={`sub-config ${config.galeEnabled ? "" : "disabled"}`}>
            <div className="config-row">
              <div className="head">
                <span className="k">Multiplicador</span>
              </div>
              <div className="seg">
                {[1.8, 2, 2.5].map((m) => (
                  <button key={m} data-on={config.galeMultiplier === m} onClick={() => patch({ galeMultiplier: m })}>
                    {m}x
                  </button>
                ))}
              </div>
            </div>
            <div className="config-row">
              <div className="head">
                <span className="k">Máximo de Gales</span>
                <span className="hint">atual: {galeStep}</span>
              </div>
              <div className="seg">
                {[1, 2, 3].map((s) => (
                  <button key={s} data-on={config.galeMaxSteps === s} onClick={() => patch({ galeMaxSteps: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card pad">
          <div className="card-head">
            <h3>
              <LayersIcon size={15} /> Sistema de Soros
            </h3>
            <Toggle on={config.sorosEnabled} onChange={(v) => patch({ sorosEnabled: v })} />
          </div>
          <p className="hint">Reinveste o lucro das operações ganhas, aumentando a exposição.</p>

          <div className={`sub-config ${config.sorosEnabled ? "" : "disabled"}`}>
            <div className="config-row">
              <div className="head">
                <span className="k">Níveis</span>
              </div>
              <div className="seg">
                {[1, 2, 3].map((s) => (
                  <button key={s} data-on={config.sorosLevels === s} onClick={() => patch({ sorosLevels: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
