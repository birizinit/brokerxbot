"use client"

import { useEffect, useMemo, useState } from "react"
import type { Profile, BotConfig } from "@/lib/storage"
import { storage } from "@/lib/storage"
import { getWallets, sumBalance } from "@/lib/api"
import { useBot } from "@/lib/useBot"
import { computeStats } from "@/lib/stats"
import { TermsModal } from "@/components/TermsModal"
import { DashboardTab } from "@/components/tabs/DashboardTab"
import { RoboTab } from "@/components/tabs/RoboTab"
import { StatsTab } from "@/components/tabs/StatsTab"
import { RiskTab } from "@/components/tabs/RiskTab"
import { SettingsTab } from "@/components/tabs/SettingsTab"
import { GridIcon, RobotIcon, ChartIcon, ShieldIcon, GearIcon } from "@/components/icons"

interface CentralProps {
  apiKey: string
  profile: Profile
  onLogout: () => void
}

type TabId = "dashboard" | "robo" | "stats" | "manage" | "settings"

const TABS: { id: TabId; label: string; Icon: typeof GridIcon }[] = [
  { id: "dashboard", label: "Dashboard", Icon: GridIcon },
  { id: "robo", label: "Robô", Icon: RobotIcon },
  { id: "stats", label: "Estatísticas", Icon: ChartIcon },
  { id: "manage", label: "Gerenciamento", Icon: ShieldIcon },
  { id: "settings", label: "Configurações", Icon: GearIcon },
]

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Central({ apiKey, profile, onLogout }: CentralProps) {
  const [config, setConfig] = useState<BotConfig>(() => storage.getBotConfig())
  const [active, setActive] = useState<boolean>(() => storage.getBotActive())
  const [balance, setBalance] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [tab, setTab] = useState<TabId>("dashboard")
  const [termsOpen, setTermsOpen] = useState(false)
  const [riskMessage, setRiskMessage] = useState<string | null>(null)

  const handleRiskStop = useMemo(
    () => (reason: string) => {
      setActive(false)
      setRiskMessage(reason)
      setTab("robo")
    },
    [],
  )

  const runtime = useBot(apiKey, config, active, handleRiskStop)
  const stats = useMemo(() => computeStats(runtime.ops), [runtime.ops])
  const tick = Math.floor(now / 15000)

  useEffect(() => storage.setBotConfig(config), [config])
  useEffect(() => storage.setBotActive(active), [active])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const wallets = await getWallets(apiKey)
        if (alive) setBalance(sumBalance(wallets))
      } catch {
        /* informativo */
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [apiKey, runtime.ops.length])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const patch = (changes: Partial<BotConfig>) => setConfig((c) => ({ ...c, ...changes }))

  const handleToggle = () => {
    if (active) {
      setActive(false)
      return
    }
    setTermsOpen(true)
  }

  const acceptTerms = () => {
    storage.setTermsAccepted(true)
    setTermsOpen(false)
    setRiskMessage(null)
    setActive(true)
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-inner">
          <div className="brand">
            <img src="/logo.png" alt="Logo" />
            <span className="brand-name">
              Broker<b>X</b>
            </span>
            <span className="pro-tag">TRADER</span>
          </div>

          <nav className="tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className="tab" data-on={tab === id} onClick={() => setTab(id)}>
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="nav-right">
            <span className="online">
              <span className="dot" data-on={active} />
              {active ? "Online" : "Pausado"}
            </span>
            <span className="nav-balance num">{balance === null ? "—" : `$ ${money(balance)}`}</span>
          </div>
        </div>
      </header>

      <main className="content">
        {tab === "dashboard" && (
          <DashboardTab balance={balance} stats={stats} opsPerHour={config.opsPerHour} tick={tick} />
        )}
        {tab === "robo" && (
          <RoboTab
            active={active}
            onToggle={handleToggle}
            nextRunAt={runtime.nextRunAt}
            now={now}
            nextStake={runtime.nextStake}
            galeStep={runtime.galeStep}
            config={config}
            stats={stats}
            riskMessage={riskMessage}
          />
        )}
        {tab === "stats" && <StatsTab ops={runtime.ops} stats={stats} />}
        {tab === "manage" && <RiskTab config={config} patch={patch} galeStep={runtime.galeStep} />}
        {tab === "settings" && (
          <SettingsTab
            config={config}
            patch={patch}
            profile={profile}
            onLogout={onLogout}
            onOpenTerms={() => setTermsOpen(true)}
          />
        )}
      </main>

      <TermsModal
        open={termsOpen}
        isDemo={config.isDemo}
        onAccept={acceptTerms}
        onClose={() => setTermsOpen(false)}
      />
    </div>
  )
}
