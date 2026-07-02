"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { AdminRow } from "@/components/admin/types"
import {
  UserIcon,
  MailIcon,
  KeyIcon,
  TrashIcon,
  CloseIcon,
  CheckIcon,
  SpinnerIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
} from "@/components/icons"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function AdminsTab() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [loaded, setLoaded] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  const load = async () => {
    const res = await fetch("/api/admin/admins", { cache: "no-store" })
    if (res.ok) {
      const d = await res.json()
      setAdmins(Array.isArray(d.admins) ? d.admins : [])
    }
    setLoaded(true)
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setOk("")
    if (!EMAIL_RE.test(email.trim())) return setError("Informe um e-mail válido.")
    if (password.length < 6) return setError("A senha precisa de ao menos 6 caracteres.")

    setBusy(true)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOk("Administrador criado.")
        setName("")
        setEmail("")
        setPassword("")
        load()
      } else {
        setError(d.error ?? "Não foi possível criar o administrador.")
      }
    } catch {
      setError("Falha de conexão.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (a: AdminRow) => {
    if (!window.confirm(`Remover o acesso de "${a.email}"?`)) return
    const res = await fetch(`/api/admin/admins?id=${encodeURIComponent(a.id)}`, { method: "DELETE" })
    if (res.ok) {
      setAdmins((prev) => prev.filter((x) => x.id !== a.id))
    } else {
      const d = await res.json().catch(() => ({}))
      window.alert(d.error ?? "Não foi possível remover.")
    }
  }

  return (
    <div className="a-admins-grid">
      <div className="card pad">
        <div className="a-chart-head">
          <h3 className="disp-title">
            <ShieldIcon size={16} /> Novo acesso de admin
          </h3>
          <span className="a-chart-sub">Cria um login para o painel administrativo</span>
        </div>

        <form className="form-grid" onSubmit={create} noValidate style={{ marginTop: 16 }}>
          <div className="field">
            <label className="label">
              <UserIcon size={15} /> Nome
            </label>
            <div className="input-wrap">
              <span className="lead">
                <UserIcon size={17} />
              </span>
              <input className="input has-lead" placeholder="Nome do admin" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
            </div>
          </div>

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
                placeholder="admin@email.com"
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
                placeholder="Mínimo 6 caracteres"
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
          {ok && (
            <div className="alert alert-ok">
              <CheckIcon size={16} /> <span>{ok}</span>
            </div>
          )}

          <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
            {busy ? (
              <>
                <SpinnerIcon size={18} className="spin" /> Criando...
              </>
            ) : (
              "Criar administrador"
            )}
          </button>
        </form>
      </div>

      <div className="card pad">
        <div className="a-chart-head">
          <h3 className="disp-title">Administradores</h3>
          <span className="a-chart-sub">Acessos com permissão total ao painel</span>
        </div>

        {!loaded ? (
          <div className="table-empty">Carregando...</div>
        ) : admins.length === 0 ? (
          <div className="table-empty">Somente o admin principal (variáveis de ambiente) está ativo.</div>
        ) : (
          <div className="a-admin-list">
            {admins.map((a) => (
              <div className="a-admin-row" key={a.id}>
                <span className="a-admin-avatar">
                  <ShieldIcon size={16} />
                </span>
                <div className="a-admin-info">
                  <span className="a-admin-name">{a.name || a.email}</span>
                  <span className="a-admin-mail">{a.email}</span>
                </div>
                <span className="a-admin-date num">{fmtDate(a.created_at)}</span>
                <button className="act-btn del" onClick={() => remove(a)} title="Remover acesso">
                  <TrashIcon size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="a-note">
          O <b>admin principal</b> (definido por variáveis de ambiente) não aparece na lista e não pode ser removido pelo painel.
        </p>
      </div>
    </div>
  )
}
