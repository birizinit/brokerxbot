"use client"

import { useEffect, useMemo, useState } from "react"
import type { Profile, BotConfig } from "@/lib/storage"
import { storage } from "@/lib/storage"
import { getWallets, sumBalance } from "@/lib/api"
import { ASSETS, assetBySymbol } from "@/lib/assets"
import { useBot } from "@/lib/useBot"
import { TermsModal } from "@/components/TermsModal"
import {
  PowerIcon,
  WalletIcon,
  BoltIcon,
  ActivityIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LogoutIcon,
  InfoIcon,
} from "@/components/icons"

interface CentralProps {
  apiKey: string
  profile: Profile
  onLogout: () => void
}

const AMOUNTS = [1, 5, 10, 25, 50]
const MIN_OPS = 1
const MAX_OPS = 60

function money(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function Central({ apiKey, profile, onLogout }: CentralProps) {
  const [config, setConfig] = useState<BotConfig>(() => storage.getBotConfig())
  const [active, setActive] = useState<boolean>(() => storage.getBotActive())
  const [balance, setBalance] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [termsOpen, setTermsOpen] = useState(false)

  const { log, nextRunAt, clearLog } = useBot(apiKey, config, active)

  // Persiste config e estado — é o que mantém o bot ligado entre recarregamentos.
  useEffect(() => storage.setBotConfig(config), [config])
  useEffect(() => storage.setBotActive(active), [active])

  // Saldo da corretora, com atualização periódica.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const wallets = await getWallets(apiKey)
        if (alive) setBalance(sumBalance(wallets))
      } catch {
        /* silencioso: o saldo é informativo */
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [apiKey])

  // Relógio de 1s para o contador da próxima operação.
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
    // Ativar sempre passa pelo termo de aceite.
    setTermsOpen(true)
  }

  const acceptTerms = () => {
    storage.setTermsAccepted(true)
    setTermsOpen(false)
    setActive(true)
  }

  const okCount = useMemo(() => log.filter((e) => e.status === "ok").length, [log])

  const countdown = useMemo(() => {
    if (!active || !nextRunAt) return null
    const secs = Math.max(0, Math.ceil((nextRunAt - now) / 1000))
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }, [active, nextRunAt, now])

  return (
    <div className="central">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="Logo" />
          <span className="brand-name">
            Central<b>.</b>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="who">
            <div style={{ fontWeight: 700, fontSize: 14 }}>{profile.name}</div>
            <small>{profile.email}</small>
          </div>
          <button className="icon-btn" onClick={onLogout} aria-label="Sair" title="Sair">
            <LogoutIcon size={18} />
          </button>
        </div>
      </header>

      <section className="grid stat-grid">
        <div className="card stat">
          <div className="lab">
            <WalletIcon size={16} /> Saldo na corretora
          </div>
          <div className="val num">{balance === null ? "—" : `$ ${money(balance)}`}</div>
        </div>
        <div className="card stat">
          <div className="lab">
            <BoltIcon size={16} /> Operações por hora
          </div>
          <div className="val num">{config.opsPerHour}</div>
        </div>
        <div className="card stat">
          <div className="lab">
            <ActivityIcon size={16} /> Enviadas com sucesso
          </div>
          <div className="val num">{okCount}</div>
        </div>
      </section>

      <div className="grid main-grid">
        {/* Painel de ligar/desligar */}
        <div className="card bot-panel card-glow">
          <div className="bot-status">
            <h3>Robô de operações</h3>
            <span className="status-pill" data-on={active}>
              <span className="dot" data-on={active} />
              {active ? "Ativo" : "Inativo"}
            </span>
          </div>

          <button type="button" className="power-btn" data-on={active} onClick={handleToggle}>
            <span className="ring">
              <PowerIcon size={18} />
            </span>
            {active ? "Desativar robô" : "Ativar robô"}
          </button>

          {active && countdown && (
            <div className="note" style={{ marginTop: 14 }}>
              <ActivityIcon size={16} />
              <span>
                Próxima operação em <b className="num accent">{countdown}</b> — ritmo de{" "}
                {config.opsPerHour}/h em ativos sorteados.
              </span>
            </div>
          )}

          <div className="note">
            <InfoIcon size={16} />
            <span>
              O robô permanece ligado até você desativar manualmente. Ele não se desliga sozinho — se
              ficar ligado, segue operando.
            </span>
          </div>
        </div>

        {/* Configuração */}
        <div className="card config">
          <h3>Configuração</h3>

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
            <span className="hint">
              Aproximadamente 1 operação a cada{" "}
              {Math.max(2, Math.round(3600 / config.opsPerHour))} segundos.
            </span>
          </div>

          <div className="config-row">
            <div className="head">
              <span className="k">Valor por operação</span>
              <span className="v num">$ {config.amount}</span>
            </div>
            <div className="chips">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="chip"
                  data-on={config.amount === a}
                  onClick={() => patch({ amount: a })}
                >
                  ${a}
                </button>
              ))}
            </div>
          </div>

          <div className="config-row">
            <div className="head">
              <span className="k">Ativos</span>
              <span className="hint">Sorteados automaticamente</span>
            </div>
            <div className="asset-row">
              {ASSETS.map((a) => (
                <span className="asset-coin" key={a.symbol} title={a.name}>
                  <img src={a.logo} alt={a.name} />
                </span>
              ))}
            </div>
          </div>

          <div className="config-row">
            <div className="head">
              <span className="k">Tipo de conta</span>
            </div>
            <div className="seg">
              <button type="button" data-on={config.isDemo} onClick={() => patch({ isDemo: true })}>
                Demo
              </button>
              <button type="button" data-on={!config.isDemo} onClick={() => patch({ isDemo: false })}>
                Real
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log de operações */}
      <div className="card log-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ marginBottom: 0 }}>Histórico de operações</h3>
          {log.length > 0 && (
            <button className="chip" type="button" onClick={clearLog}>
              Limpar
            </button>
          )}
        </div>

        <div className="log" style={{ marginTop: 18 }}>
          {log.length === 0 ? (
            <div className="log-empty">
              Nenhuma operação ainda. Ative o robô para começar a operar.
            </div>
          ) : (
            log.map((e) => {
              const asset = assetBySymbol(e.symbol)
              const isBuy = e.direction === "BUY"
              return (
                <div className="log-item" key={e.id}>
                  <span className="coin">
                    {asset.logo ? <img src={asset.logo} alt={asset.name} /> : null}
                    <span className="coin-dir" data-dir={e.direction}>
                      {isBuy ? <ArrowUpIcon size={11} strokeWidth={2.6} /> : <ArrowDownIcon size={11} strokeWidth={2.6} />}
                    </span>
                  </span>
                  <div className="log-body">
                    <div className="l1">
                      <span>{asset.name}</span>
                      <span className="faint num" style={{ fontSize: 12 }}>
                        {e.symbol}
                      </span>
                      <span className="tag" data-kind={e.status}>
                        {e.status === "ok" ? "OK" : "Erro"}
                      </span>
                      {e.isDemo && (
                        <span className="tag" data-kind="demo">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="l2">
                      {timeOf(e.time)} · {isBuy ? "Compra" : "Venda"} · {e.message}
                    </div>
                  </div>
                  <span className={`log-amt num ${isBuy ? "up" : "down"}`}>$ {e.amount}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      <TermsModal
        open={termsOpen}
        isDemo={config.isDemo}
        onAccept={acceptTerms}
        onClose={() => setTermsOpen(false)}
      />
    </div>
  )
}
