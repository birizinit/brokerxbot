"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  MailIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  LogoutIcon,
  SpinnerIcon,
  CloseIcon,
  GridIcon,
  UserIcon,
  ShieldIcon,
} from "@/components/icons"
import type { AdminStats, ClientRow } from "@/components/admin/types"
import { OverviewTab } from "@/components/admin/OverviewTab"
import { ClientsTab } from "@/components/admin/ClientsTab"
import { AdminsTab } from "@/components/admin/AdminsTab"

type Auth = "loading" | "out" | "in"
type Tab = "overview" | "clients" | "admins"

const TABS: { id: Tab; label: string; Icon: typeof GridIcon }[] = [
  { id: "overview", label: "Visão geral", Icon: GridIcon },
  { id: "clients", label: "Clientes", Icon: UserIcon },
  { id: "admins", label: "Administradores", Icon: ShieldIcon },
]

export default function AdminPage() {
  const [auth, setAuth] = useState<Auth>("loading")
  const [tab, setTab] = useState<Tab>("overview")
  const [clients, setClients] = useState<ClientRow[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const loadClients = async () => {
    const res = await fetch("/api/admin/clients", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      setClients(Array.isArray(data.clients) ? data.clients : [])
      setAuth("in")
      return true
    }
    setAuth("out")
    return false
  }

  const loadStats = async () => {
    const res = await fetch("/api/admin/stats", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      setStats(data.stats ?? null)
    }
  }

  const loadAll = async () => {
    const ok = await loadClients()
    if (ok) loadStats()
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (res.ok) {
        setPassword("")
        await loadAll()
      } else {
        setError("E-mail ou senha incorretos.")
      }
    } catch {
      setError("Falha de conexão.")
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    setAuth("out")
    setClients([])
    setStats(null)
  }

  return (
    <div className="app" style={{ display: "block" }}>
      {auth === "loading" && (
        <div className="center">
          <SpinnerIcon size={28} className="spin" />
        </div>
      )}

      {auth === "out" && (
        <div className="center">
          <div className="auth" style={{ maxWidth: 400 }}>
            <div className="auth-head">
              <div className="auth-logo">
                <img src="/logo-full.png" alt="Sniper Trader" className="logo-full" />
              </div>
              <h1 className="title disp">Painel Admin</h1>
              <p className="subtitle">Acesso restrito — Sniper Trader</p>
            </div>
            <div className="card card-pad card-glow">
              <form className="form-grid" onSubmit={handleLogin} noValidate>
                <div className="field">
                  <label className="label">
                    <MailIcon size={15} /> E-mail
                  </label>
                  <div className="input-wrap">
                    <span className="lead">
                      <MailIcon size={17} />
                    </span>
                    <input
                      className="input has-lead"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">
                    <KeyIcon size={15} /> Senha
                  </label>
                  <div className="input-wrap">
                    <span className="lead">
                      <KeyIcon size={17} />
                    </span>
                    <input
                      className="input has-lead has-trail"
                      type={show ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={busy}
                    />
                    <button type="button" className="input-action" onClick={() => setShow((s) => !s)}>
                      {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <CloseIcon size={16} /> <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
                  {busy ? (
                    <>
                      <SpinnerIcon size={18} className="spin" /> Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {auth === "in" && (
        <div className="content" style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="page-head">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/logo-full.png" alt="Sniper Trader" style={{ height: 46, width: "auto", objectFit: "contain" }} />
              <div>
                <h1 className="disp page-title">Painel administrativo</h1>
                <p className="page-sub">Sniper Trader — gestão de usuários e IA</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={loadAll}>
                Atualizar
              </button>
              <button className="btn btn-danger" onClick={logout}>
                <LogoutIcon size={17} /> Sair
              </button>
            </div>
          </div>

          <nav className="a-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className="a-tab" data-on={tab === id} onClick={() => setTab(id)}>
                <Icon size={16} /> <span>{label}</span>
              </button>
            ))}
          </nav>

          {tab === "overview" && <OverviewTab clients={clients} stats={stats} />}
          {tab === "clients" && <ClientsTab clients={clients} onReload={loadAll} />}
          {tab === "admins" && <AdminsTab />}
        </div>
      )}

      <style jsx>{`
        :global(.spin) {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
