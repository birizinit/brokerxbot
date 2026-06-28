"use client"

import { SectionCard, Switch, SegRow, ToggleRow } from "@/components/controls"
import type { BotConfig } from "@/lib/storage"
import type { UiPrefs } from "@/lib/prefs"
import { FlameIcon, LayersIcon, CheckIcon, ChevronRightIcon } from "@/components/icons"

type Patch = (c: Partial<BotConfig>) => void
type SetPrefs = (p: UiPrefs) => void

const PROFILES = [
  {
    key: "cons",
    name: "Conservador",
    desc: "Poucas operações · Gale 1 · Baixo risco",
    cfg: { opsPerHour: 4, amount: 2, galeEnabled: true, galeMaxSteps: 1, galeMultiplier: 2, sorosEnabled: false },
  },
  {
    key: "bal",
    name: "Balanceado",
    desc: "Configuração intermediária · Risco moderado",
    cfg: { opsPerHour: 8, amount: 5, galeEnabled: true, galeMaxSteps: 2, galeMultiplier: 2, sorosEnabled: false },
  },
  {
    key: "agr",
    name: "Agressivo",
    desc: "Mais operações · Até Gale 5 · Maior risco",
    cfg: { opsPerHour: 20, amount: 10, galeEnabled: true, galeMaxSteps: 5, galeMultiplier: 2.2, sorosEnabled: true, sorosLevels: 3 },
  },
] as const

function activeProfile(config: BotConfig): string | null {
  const p = PROFILES.find(
    (x) => x.cfg.opsPerHour === config.opsPerHour && x.cfg.galeMaxSteps === config.galeMaxSteps && x.cfg.galeEnabled === config.galeEnabled,
  )
  return p?.key ?? null
}

export function QuickProfiles({ config, patch }: { config: BotConfig; patch: Patch }) {
  const active = activeProfile(config)
  return (
    <SectionCard icon={<LayersIcon size={16} />} title="Perfis rápidos" sub="Aplicar configuração pré-definida">
      <div className="profiles">
        {PROFILES.map((p) => (
          <button key={p.key} type="button" className="profile" data-on={active === p.key} onClick={() => patch(p.cfg)}>
            <span className="p-txt">
              <span className="p-name">{p.name}</span>
              <span className="p-desc">{p.desc}</span>
            </span>
            {active === p.key ? (
              <span className="p-applied">
                <CheckIcon size={13} /> Aplicado
              </span>
            ) : (
              <ChevronRightIcon size={16} className="faint" />
            )}
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

export function GaleCard({
  config,
  patch,
  prefs,
  setPrefs,
  galeStep,
}: {
  config: BotConfig
  patch: Patch
  prefs: UiPrefs
  setPrefs: SetPrefs
  galeStep: number
}) {
  return (
    <SectionCard
      icon={<FlameIcon size={16} />}
      title="Sistema de Gale"
      sub="Recuperação automática de perdas"
      right={<Switch on={config.galeEnabled} onChange={(v) => patch({ galeEnabled: v })} />}
    >
      <SegRow
        label="Quantidade"
        hint={config.galeEnabled ? `nível atual: ${galeStep}` : undefined}
        value={config.galeEnabled ? config.galeMaxSteps : 0}
        options={[
          { v: 0, label: "Sem Gale" },
          { v: 1, label: "Gale 1" },
          { v: 2, label: "Gale 2" },
          { v: 3, label: "Gale 3" },
          { v: 4, label: "Gale 4" },
          { v: 5, label: "Gale 5" },
        ]}
        onChange={(v) => (v === 0 ? patch({ galeEnabled: false }) : patch({ galeEnabled: true, galeMaxSteps: Number(v) }))}
      />
      <SegRow
        label="Multiplicador"
        value={config.galeMultiplier}
        options={[1.8, 2.0, 2.2, 2.5].map((m) => ({ v: m, label: `${m.toFixed(1)}x` }))}
        onChange={(v) => patch({ galeMultiplier: Number(v) })}
      />
      <SegRow
        label="Tempo entre gales"
        value={prefs.galeDelay}
        options={[0, 10, 30, 60].map((d) => ({ v: d, label: `${d}s` }))}
        onChange={(v) => setPrefs({ ...prefs, galeDelay: Number(v) })}
      />
      <ToggleRow name="Somente após LOSS" on={prefs.galeOnlyAfterLoss} onChange={(v) => setPrefs({ ...prefs, galeOnlyAfterLoss: v })} />
      <ToggleRow name="Reiniciar sequência após WIN" on={prefs.galeRestartAfterWin} onChange={(v) => setPrefs({ ...prefs, galeRestartAfterWin: v })} />
    </SectionCard>
  )
}

export function SorosCard({ config, patch }: { config: BotConfig; patch: Patch }) {
  return (
    <SectionCard
      icon={<LayersIcon size={16} />}
      title="Sistema de Soros"
      sub="Reinvestimento progressivo"
      right={<Switch on={config.sorosEnabled} onChange={(v) => patch({ sorosEnabled: v })} />}
    >
      <SegRow
        label="Quantidade"
        value={config.sorosLevels}
        options={[
          { v: 1, label: "1 nível" },
          { v: 2, label: "2 níveis" },
          { v: 3, label: "3 níveis" },
        ]}
        onChange={(v) => patch({ sorosLevels: Number(v) })}
      />
      <SegRow
        label="Reinvestimento"
        value={config.sorosReinvest}
        options={[
          { v: 1, label: "100%" },
          { v: 0.75, label: "75%" },
          { v: 0.5, label: "50%" },
        ]}
        onChange={(v) => patch({ sorosReinvest: Number(v) })}
      />
    </SectionCard>
  )
}
