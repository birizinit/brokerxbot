"use client"

import { SectionCard } from "@/components/controls"
import { IndicatorsCard, FiltersCard } from "@/components/sections/TechnicalSections"
import { ScheduleCard, NotifPrefsCard } from "@/components/sections/SystemSections"
import type { BotConfig, Profile } from "@/lib/storage"
import type { UiPrefs } from "@/lib/prefs"
import { UserIcon, LogoutIcon, ShieldIcon } from "@/components/icons"

interface SettingsTabProps {
  config: BotConfig
  patch: (c: Partial<BotConfig>) => void
  prefs: UiPrefs
  setPrefs: (p: UiPrefs) => void
  profile: Profile
  onLogout: () => void
  onOpenTerms: () => void
}

export function SettingsTab({ config, patch, prefs, setPrefs, profile, onLogout, onOpenTerms }: SettingsTabProps) {
  return (
    <div className="tab-stack">
      <section className="grid two-grid">
        <IndicatorsCard prefs={prefs} setPrefs={setPrefs} />
        <FiltersCard prefs={prefs} setPrefs={setPrefs} />
      </section>

      <ScheduleCard prefs={prefs} setPrefs={setPrefs} />

      <NotifPrefsCard prefs={prefs} setPrefs={setPrefs} />

      <SectionCard icon={<UserIcon size={16} />} title="Conta" sub="Sessão e tipo de operação">
        <div className="kv-list">
          <div className="kv">
            <span className="muted">Nome</span>
            <span>{profile.name}</span>
          </div>
          <div className="kv">
            <span className="muted">E-mail</span>
            <span className="faint">{profile.email}</span>
          </div>
          <div className="kv">
            <span className="muted">Tipo de conta</span>
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
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={onOpenTerms}>
            <ShieldIcon size={17} /> Ver termo de aceite
          </button>
          <button className="btn btn-danger" onClick={onLogout}>
            <LogoutIcon size={17} /> Sair
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
