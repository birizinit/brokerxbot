"use client"

import { SectionCard, ToggleRow } from "@/components/controls"
import { INDICATORS, FILTERS, type UiPrefs } from "@/lib/prefs"
import { ChartIcon, CpuIcon } from "@/components/icons"

type SetPrefs = (p: UiPrefs) => void

export function IndicatorsCard({ prefs, setPrefs }: { prefs: UiPrefs; setPrefs: SetPrefs }) {
  return (
    <SectionCard icon={<ChartIcon size={16} />} title="Indicadores utilizados" sub="Análise técnica">
      <div className="toggle-list">
        {INDICATORS.map((it) => (
          <ToggleRow
            key={it.key}
            name={it.name}
            desc={it.desc}
            on={prefs.indicators[it.key] ?? false}
            onChange={(v) => setPrefs({ ...prefs, indicators: { ...prefs.indicators, [it.key]: v } })}
          />
        ))}
      </div>
    </SectionCard>
  )
}

export function FiltersCard({ prefs, setPrefs }: { prefs: UiPrefs; setPrefs: SetPrefs }) {
  return (
    <SectionCard icon={<CpuIcon size={16} />} title="Filtros inteligentes" sub="Critérios de entrada">
      <div className="toggle-list">
        {FILTERS.map((f) => (
          <ToggleRow
            key={f.key}
            name={f.name}
            on={prefs.filters[f.key] ?? false}
            onChange={(v) => setPrefs({ ...prefs, filters: { ...prefs.filters, [f.key]: v } })}
          />
        ))}
      </div>
    </SectionCard>
  )
}
