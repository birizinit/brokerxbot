"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  MailIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  LogoutIcon,
  SpinnerIcon,
  UserIcon,
  CloseIcon,
  PhoneIcon,
  TrashIcon,
  DownloadIcon,
  SearchIcon,
} from "@/components/icons"

interface ClientRow {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
}

type Auth = "loading" | "out" | "in"

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function withinDays(s: string, days: number): boolean {
  return Date.now() - new Date(s).getTime() <= days * 86_400_000
}

function isToday(s: string): boolean {
  const d = new Date(s)
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function waLink(phone: string | null): string | null {
  if (!phone) return null
  let d = phone.replace(/\D/g, "")
  if (!d) return null
  if (d.length <= 11) d = "55" + d
  return `https://wa.me/${d}`
}

export default function AdminPage() {
  const [auth, setAuth] = useState<Auth>("loading")
  const [clients, setClients] = useState<ClientRow[]>([])
  const [query, setQuery] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const res = await fetch("/api/admin/clients", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      setClients(Array.isArray(data.clients) ? data.clients : [])
      setAuth("in")
    } else {
      setAuth("out")
    }
  }

  useEffect(() => {
    load()
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
        await load()
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
  }

  const removeClient = async (c: ClientRow) => {
    if (!window.confirm(`Excluir o cliente "${c.name}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/clients?id=${encodeURIComponent(c.id)}`, { method: "DELETE" })
    if (res.ok) setClients((prev) => prev.filter((x) => x.id !== c.id))
  }

  const exportCsv = () => {
    const header = "nome,email,telefone,cadastro"
    const lines = clients.map(
      (c) => `"${c.name.replace(/"/g, '""')}","${c.email}","${c.phone ?? ""}","${fmtDate(c.created_at)}"`,
    )
    const csv = "﻿" + [header, ...lines].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "clientes-sniperbot.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(q),
    )
  }, [clients, query])

  const counts = useMemo(
    () => ({
      total: clients.length,
      today: clients.filter((c) => isToday(c.created_at)).length,
      d7: clients.filter((c) => withinDays(c.created_at, 7)).length,
      d30: clients.filter((c) => withinDays(c.created_at, 30)).length,
    }),
    [clients],
  )

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
                <img src="/logo.png" alt="Sniper Bot" />
              </div>
              <h1 className="title disp">Painel Admin</h1>
              <p className="subtitle">Acesso restrito — Sniper Bot</p>
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
        <div className="content" style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="page-head">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/logo.png" alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
              <div>
                <h1 className="disp page-title">Clientes</h1>
                <p className="page-sub">Sniper Bot — painel administrativo</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={exportCsv} disabled={clients.length === 0}>
                <DownloadIcon size={16} /> CSV
              </button>
              <button className="btn btn-ghost" onClick={load}>
                Atualizar
              </button>
              <button className="btn btn-danger" onClick={logout}>
                <LogoutIcon size={17} /> Sair
              </button>
            </div>
          </div>

          <section className="grid metrics-grid" style={{ marginBottom: 16 }}>
            <div className="card metric">
              <div className="metric-top">
                <span className="metric-label">Total</span>
                <span className="metric-ic">
                  <UserIcon size={16} />
                </span>
              </div>
              <div className="metric-value num">{counts.total}</div>
            </div>
            <div className="card metric">
              <div className="metric-top">
                <span className="metric-label">Hoje</span>
              </div>
              <div className="metric-value num accent">{counts.today}</div>
            </div>
            <div className="card metric">
              <div className="metric-top">
                <span className="metric-label">Últimos 7 dias</span>
              </div>
              <div className="metric-value num">{counts.d7}</div>
            </div>
            <div className="card metric">
              <div className="metric-top">
                <span className="metric-label">Últimos 30 dias</span>
              </div>
              <div className="metric-value num">{counts.d30}</div>
            </div>
          </section>

          <div className="card pad">
            <div className="input-wrap" style={{ marginBottom: 16 }}>
              <span className="lead">
                <SearchIcon size={17} />
              </span>
              <input
                className="input has-lead"
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="table-empty">
                {clients.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum resultado para a busca."}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="ttable">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>Cadastrado em</th>
                      <th className="ta-r">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const wa = waLink(c.phone)
                      return (
                        <tr key={c.id}>
                          <td>
                            <span className="cell-asset">
                              <UserIcon size={15} /> {c.name}
                            </span>
                          </td>
                          <td className="faint">{c.email}</td>
                          <td className="num">{c.phone || "—"}</td>
                          <td className="num faint">{fmtDate(c.created_at)}</td>
                          <td>
                            <div className="row-actions">
                              {wa && (
                                <a className="act-btn wa" href={wa} target="_blank" rel="noreferrer" title="WhatsApp">
                                  <PhoneIcon size={15} />
                                </a>
                              )}
                              <a className="act-btn" href={`mailto:${c.email}`} title="Enviar e-mail">
                                <MailIcon size={15} />
                              </a>
                              <button className="act-btn del" onClick={() => removeClient(c)} title="Excluir">
                                <TrashIcon size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
