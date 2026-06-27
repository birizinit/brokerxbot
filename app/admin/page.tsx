"use client"

import { useEffect, useState, type FormEvent } from "react"
import { MailIcon, KeyIcon, EyeIcon, EyeOffIcon, LogoutIcon, SpinnerIcon, UserIcon, CloseIcon } from "@/components/icons"

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

export default function AdminPage() {
  const [auth, setAuth] = useState<Auth>("loading")
  const [clients, setClients] = useState<ClientRow[]>([])
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
        const d = await res.json().catch(() => ({}))
        setError(d.error === "credenciais inválidas" ? "E-mail ou senha incorretos." : "Não foi possível entrar.")
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
              <h1 className="title disp">Painel Admin</h1>
              <p className="subtitle">Acesso restrito aos clientes</p>
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
        <div className="content" style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="page-head">
            <div>
              <h1 className="disp page-title">Clientes</h1>
              <p className="page-sub">
                {clients.length} {clients.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={load}>
                Atualizar
              </button>
              <button className="btn btn-danger" onClick={logout}>
                <LogoutIcon size={17} /> Sair
              </button>
            </div>
          </div>

          <div className="card pad">
            {clients.length === 0 ? (
              <div className="table-empty">Nenhum cliente cadastrado ainda.</div>
            ) : (
              <div className="table-wrap">
                <table className="ttable">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>Cadastrado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="cell-asset">
                            <UserIcon size={15} /> {c.name}
                          </span>
                        </td>
                        <td className="faint">{c.email}</td>
                        <td className="num">{c.phone || "—"}</td>
                        <td className="num faint">{fmtDate(c.created_at)}</td>
                      </tr>
                    ))}
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
