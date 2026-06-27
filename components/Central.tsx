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
import { NotificationBell } from "@/components/NotificationBell"
import { GridIcon, RobotIcon, ChartIcon, ShieldIcon, GearIcon, BoltIcon, ChevronLeftIcon } from "@/components/icons"

interface CentralProps {
  apiKey: string
  profile: Profile
  onLogout: () => void
}

type TabId = "dashboard" | "robo" | "stats" | "manage" | "settings"

const TABS: { id: TabId; label: string; Icon: typeof GridIcon; title: string; sub: string }[] = [
  { id: "dashboard", label: "Dashboard", Icon: GridIcon, title: "Dashboard", sub: "Visão geral em tempo real do seu robô de operações" },
  { id: "robo", label: "Robô", Icon: RobotIcon, title: "Robô", sub: "Controle e situação do robô de operações" },
  { id: "stats", label: "Estatísticas", Icon: ChartIcon, title: "Estatísticas", sub: "Desempenho, evolução e histórico de operações" },
  { id: "manage", label: "Gerenciamento", Icon: ShieldIcon, title: "Gerenciamento", sub: "Gestão de risco, Sistema de Gale e Soros" },
  { id: "settings", label: "Configurações", Icon: GearIcon, title: "Configurações", sub: "Preferências da conta e da operação" },
]

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "BX"
}

export function Central({ apiKey, profile, onLogout }: CentralProps) {
  const [config, setConfig] = useState<BotConfig>(() => storage.getBotConfig())
  const [active, setActive] = useState<boolean>(() => storage.getBotActive())
  const [activatedAt, setActivatedAt] = useState<number | null>(() => storage.getBotActivatedAt())
  const [balance, setBalance] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [tab, setTab] = useState<TabId>("dashboard")
  const [termsOpen, setTermsOpen] = useState(false)
  const [riskMessage, setRiskMessage] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<boolean>(() => storage.getSidebarCollapsed())

  useEffect(() => storage.setSidebarCollapsed(collapsed), [collapsed])

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

  // Marca o início do "tempo ligado" e persiste para sobreviver a recarregamentos.
  useEffect(() => {
    if (active && !storage.getBotActivatedAt()) {
      const t = Date.now()
      storage.setBotActivatedAt(t)
      setActivatedAt(t)
    } else if (!active) {
      storage.setBotActivatedAt(null)
      setActivatedAt(null)
    }
  }, [active])

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

  const current = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <div className="app" data-collapsed={collapsed}>
      <aside className="sidebar" data-collapsed={collapsed}>
        <div className="side-brand">
          <img src="/logo.png" alt="Logo" />
          <div className="side-brand-txt">
            <span className="bn">
              NEON<b>BOT</b>
            </span>
            <span className="bt">TRADER PRO</span>
          </div>
        </div>

        <nav className="side-nav">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className="side-link" data-on={tab === id} onClick={() => setTab(id)}>
              <Icon size={18} />
              <span>{label}</span>
              {tab === id && <span className="side-dot" />}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <span className="online">
            <span className="dot" data-on={active} />
            {!collapsed && (active ? "Robô online" : "Robô pausado")}
          </span>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            <ChevronLeftIcon size={16} className="cev" />
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="search" aria-hidden="true">
            <span className="muted">Buscar ativos, operações...</span>
            <kbd>⌘K</kbd>
          </div>
          <div className="top-right">
            <span className="online-pill">
              <span className="dot" data-on={active} /> {active ? "Online" : "Pausado"}
            </span>
            <span className="acct-balance">
              <span className={`tag-acct ${config.isDemo ? "" : "real"}`}>{config.isDemo ? "DEMO" : "REAL"}</span>
              <span className="num">{balance === null ? "—" : `$ ${money(balance)}`}</span>
            </span>
            <NotificationBell ops={runtime.ops} riskMessage={riskMessage} />
            <span className="avatar">{initials(profile.name)}</span>
          </div>
        </header>

        <main className="content">
          <div className="page-head">
            <div>
              <h1 className="disp page-title">{current.title}</h1>
              <p className="page-sub">{current.sub}</p>
            </div>
            <button
              type="button"
              className={`acct-btn ${config.isDemo ? "" : "real"}`}
              onClick={() => patch({ isDemo: !config.isDemo })}
            >
              <BoltIcon size={15} /> {config.isDemo ? "CONTA DEMO" : "CONTA REAL"}
            </button>
          </div>

          {tab === "dashboard" && (
            <DashboardTab
              balance={balance}
              stats={stats}
              config={config}
              patch={patch}
              active={active}
              onToggle={handleToggle}
              activatedAt={activatedAt}
              now={now}
              tick={tick}
            />
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
      </div>

      <TermsModal open={termsOpen} isDemo={config.isDemo} onAccept={acceptTerms} onClose={() => setTermsOpen(false)} />
    </div>
  )
}
