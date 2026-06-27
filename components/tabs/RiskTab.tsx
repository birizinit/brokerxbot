"use client"

import { QuickProfiles, GaleCard, SorosCard } from "@/components/sections/StrategySections"
import { RiskCard } from "@/components/sections/RiskCard"
import type { BotConfig } from "@/lib/storage"
import type { UiPrefs } from "@/lib/prefs"

interface RiskTabProps {
  config: BotConfig
  patch: (c: Partial<BotConfig>) => void
  prefs: UiPrefs
  setPrefs: (p: UiPrefs) => void
  galeStep: number
  balance: number | null
}

export function RiskTab({ config, patch, prefs, setPrefs, galeStep, balance }: RiskTabProps) {
  return (
    <div className="tab-stack">
      <RiskCard config={config} patch={patch} balance={balance} />
      <QuickProfiles config={config} patch={patch} />
      <section className="grid two-grid">
        <GaleCard config={config} patch={patch} prefs={prefs} setPrefs={setPrefs} galeStep={galeStep} />
        <SorosCard config={config} patch={patch} />
      </section>
    </div>
  )
}
