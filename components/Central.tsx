"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Profile, BotConfig } from "@/lib/storage"
import { storage, DEFAULT_BOT_CONFIG } from "@/lib/storage"
import { getWallets, sumBalance, getBotState, saveBotConfig, setBotActiveApi } from "@/lib/api"
import { computeStats } from "@/lib/stats"
import { computeStake } from "@/lib/strategy"
import { getPrefs, setPrefs as persistPrefs, type UiPrefs } from "@/lib/prefs"
import { toast } from "@/lib/toast"
import type { BotOp } from "@/lib/types"
import { TermsModal } from "@/components/TermsModal"
import { AlertModal } from "@/components/AlertModal"
import { NotificationBell } from "@/components/NotificationBell"
import { CentralSkeleton } from "@/components/Skeleton"
import { DashboardTab } from "@/components/tabs/DashboardTab"
import { RoboTab } from "@/components/tabs/RoboTab"
import { StatsTab } from "@/components/tabs/StatsTab"
import { RiskTab } from "@/components/tabs/RiskTab"
import { SettingsTab } from "@/components/tabs/SettingsTab"
import { GridIcon, RobotIcon, ChartIcon, ShieldIcon, GearIcon, BoltIcon, ChevronLeftIcon } from "@/components/icons"

interface CentralProps {
  apiKey: string
  profile: Profile
  onLogout: () => void
}

type TabId = "dashboard" | "robo" | "stats" | "manage" | "settings"

const TABS: { id: TabId; label: string; Icon: typeof GridIcon; title: string; sub: string }[] = [
  { id: "dashboard", label: "Dashboard", Icon: GridIcon, title: "Dashboard", sub: "Visão geral em tempo real da sua IA de operações" },
  { id: "robo", label: "IA", Icon: RobotIcon, title: "IA", sub: "Controle e situação da IA de operações" },
  { id: "stats", label: "Estatísticas", Icon: ChartIcon, title: "Estatísticas", sub: "Desempenho, evolução e histórico de operações" },
  { id: "manage", label: "Gerenciamento", Icon: ShieldIcon, title: "Gerenciamento", sub: "Gestão de risco, Sistema de Gale e Soros" },
  { id: "settings", label: "Configurações", Icon: GearIcon, title: "Configurações", sub: "Preferências da conta e da operação" },
]

function money(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "ST"
}

export function Central({ apiKey, profile, onLogout }: CentralProps) {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG)
  const [active, setActive] = useState(false)
  const [strategy, setStrategy] = useState({ galeStep: 0, sorosBank: 0, sorosWins: 0 })
  const [activatedAt, setActivatedAt] = useState<number | null>(null)
  const [nextRunAt, setNextRunAt] = useState<number | null>(null)
  const [stopReason, setStopReason] = useState<string | null>(null)
  const [ops, setOps] = useState<BotOp[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [tab, setTab] = useState<TabId>("dashboard")
  const [termsOpen, setTermsOpen] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<boolean>(() => storage.getSidebarCollapsed())
  const [prefs, setPrefsState] = useState<UiPrefs>(() => getPrefs())
  const [loaded, setLoaded] = useState(false)
  const dirty = useRef(false)
  const prevState = useRef<{ active: boolean; stop: string | null }>({ active: false, stop: null })

  useEffect(() => storage.setSidebarCollapsed(collapsed), [collapsed])
  const updatePrefs = (p: UiPrefs) => {
    setPrefsState(p)
    persistPrefs(p)
  }

  // Sincroniza o estado da IA (gerido pelo worker no servidor).
  const syncState = async (applyConfig: boolean) => {
    const s = await getBotState()
    if (!s) return
    // Avisa quando o worker parou a IA (estava ativa, parou com motivo novo).
    if (!applyConfig && prevState.current.active && !s.active && s.stopReason && s.stopReason !== prevState.current.stop) {
      toast(s.stopReason, "error")
    }
    prevState.current = { active: s.active, stop: s.stopReason }
    setActive(s.active)
    setStrategy(s.strategy)
    setActivatedAt(s.activatedAt)
    setNextRunAt(s.nextRunAt)
    setStopReason(s.stopReason)
    setOps(s.ops)
    if (applyConfig && s.config) setConfig({ ...DEFAULT_BOT_CONFIG, ...s.config })
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      await syncState(true)
      if (alive) setLoaded(true)
    })()
    const id = setInterval(() => syncState(false), 5000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // Salva a config no banco (debounce) sempre que o usuário muda algo.
  useEffect(() => {
    if (!loaded || !dirty.current) return
    const t = setTimeout(() => {
      saveBotConfig(config)
      toast("Configuração salva")
    }, 700)
    return () => clearTimeout(t)
  }, [config, loaded])

  const patch = (changes: Partial<BotConfig>) => {
    dirty.current = true
    setConfig((c) => ({ ...c, ...changes }))
  }

  // Saldo da wallet REAL (para exibição).
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const wallets = await getWallets(apiKey)
        if (alive) setBalance(sumBalance(wallets, "REAL"))
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
  }, [apiKey])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => computeStats(ops), [ops])
  const nextStake = useMemo(() => computeStake(config, strategy), [config, strategy])
  const tick = Math.floor(now / 15000)

  const handleToggle = async () => {
    if (active) {
      setActive(false)
      prevState.current = { active: false, stop: null }
      await setBotActiveApi(false)
      toast("IA desativada", "info")
      return
    }
    if (balance != null && balance < config.amount) {
      setActivateError(
        `Sua entrada por operação é $ ${money(config.amount)}, mas o saldo da sua conta real é $ ${money(balance)}. ` +
          `Deposite saldo na corretora para ativar a IA.`,
      )
      return
    }
    setTermsOpen(true)
  }

  const acceptTerms = async () => {
    storage.setTermsAccepted(true)
    setTermsOpen(false)
    await saveBotConfig(config)
    await setBotActiveApi(true)
    setActive(true)
    setStopReason(null)
    prevState.current = { active: true, stop: null }
    toast("IA ativada", "success")
    syncState(false)
  }

  const current = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <div className="app" data-collapsed={collapsed}>
      <aside className="sidebar" data-collapsed={collapsed}>
        <div className="side-brand">
          {collapsed ? (
            <img src="/logo.png" alt="Sniper Trader" className="side-logo-emblem" />
          ) : (
            <img src="/logo-full.png" alt="Sniper Trader" className="side-logo-full" />
          )}
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
            {!collapsed && (active ? "IA online" : "IA pausada")}
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
              <span className="tag-acct real">REAL</span>
              <span className="num">{balance === null ? "—" : `$ ${money(balance)}`}</span>
            </span>
            <NotificationBell ops={ops} riskMessage={stopReason} notif={prefs.notif} />
            <span className="avatar">{initials(profile.name)}</span>
          </div>
        </header>

        <main className="content">
          <div className="page-head">
            <div>
              <h1 className="disp page-title">{current.title}</h1>
              <p className="page-sub">{current.sub}</p>
            </div>
            <span className="acct-btn real">
              <BoltIcon size={15} /> CONTA REAL
            </span>
          </div>

          {!loaded ? (
            <CentralSkeleton />
          ) : (
          <>
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
              config={config}
              patch={patch}
              prefs={prefs}
              setPrefs={updatePrefs}
              active={active}
              onToggle={handleToggle}
              activatedAt={activatedAt}
              now={now}
              nextStake={nextStake}
              galeStep={strategy.galeStep}
              stats={stats}
              riskMessage={stopReason}
            />
          )}
          {tab === "stats" && <StatsTab ops={ops} stats={stats} />}
          {tab === "manage" && (
            <RiskTab config={config} patch={patch} prefs={prefs} setPrefs={updatePrefs} galeStep={strategy.galeStep} balance={balance} />
          )}
          {tab === "settings" && (
            <SettingsTab
              config={config}
              patch={patch}
              prefs={prefs}
              setPrefs={updatePrefs}
              profile={profile}
              onLogout={onLogout}
              onOpenTerms={() => setTermsOpen(true)}
            />
          )}
          </>
          )}
        </main>
      </div>

      <TermsModal open={termsOpen} isDemo={false} onAccept={acceptTerms} onClose={() => setTermsOpen(false)} />

      <AlertModal
        open={activateError != null}
        title="Saldo insuficiente"
        message={activateError ?? ""}
        onClose={() => setActivateError(null)}
      />
    </div>
  )
}
