"use client"

import { SectionCard } from "@/components/controls"
import type { BotConfig } from "@/lib/storage"
import { ShieldIcon, TargetIcon } from "@/components/icons"

type Patch = (c: Partial<BotConfig>) => void

export function RiskCard({ config, patch, balance }: { config: BotConfig; patch: Patch; balance: number | null }) {
  const targetValue = balance != null && config.dailyTargetPct > 0 ? (balance * config.dailyTargetPct) / 100 : 0

  return (
    <SectionCard icon={<ShieldIcon size={16} />} title="Gerenciamento de risco" sub="Limites e meta diária">
      <div className="risk-fields">
        <div className="field">
          <label className="label up">Stop Win</label>
          <div className="input-wrap">
            <span className="lead">+$</span>
            <input
              className="input has-lead num"
              type="number"
              min={0}
              value={config.stopWin || ""}
              placeholder="0"
              onChange={(e) => patch({ stopWin: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <span className="hint">Parar o robô ao atingir</span>
        </div>

        <div className="field">
          <label className="label down">Stop Loss</label>
          <div className="input-wrap">
            <span className="lead">-$</span>
            <input
              className="input has-lead num"
              type="number"
              min={0}
              value={config.stopLoss || ""}
              placeholder="0"
              onChange={(e) => patch({ stopLoss: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <span className="hint">Parar automaticamente</span>
        </div>

        <div className="field">
          <label className="label">
            <TargetIcon size={14} /> Meta diária
          </label>
          <div className="input-wrap">
            <input
              className="input has-trail num"
              type="number"
              min={0}
              max={100}
              value={config.dailyTargetPct || ""}
              placeholder="0"
              onChange={(e) => patch({ dailyTargetPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            />
            <span className="trail">%</span>
          </div>
          <span className="hint">{targetValue > 0 ? `≈ $ ${targetValue.toFixed(2)} do saldo` : "% do saldo (para o robô)"}</span>
        </div>
      </div>
    </SectionCard>
  )
}
