"use client"

import { useMemo, useState, type FormEvent } from "react"
import type { ClientRow } from "@/components/admin/types"
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  TrashIcon,
  DownloadIcon,
  SearchIcon,
  KeyIcon,
  CloseIcon,
  SpinnerIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/icons"

interface ClientsTabProps {
  clients: ClientRow[]
  onReload: () => void
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function waLink(phone: string | null): string | null {
  if (!phone) return null
  let d = phone.replace(/\D/g, "")
  if (!d) return null
  if (d.length <= 11) d = "55" + d
  return `https://wa.me/${d}`
}

export function ClientsTab({ clients, onReload }: ClientsTabProps) {
  const [query, setQuery] = useState("")
  const [target, setTarget] = useState<ClientRow | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(q),
    )
  }, [clients, query])

  const removeClient = async (c: ClientRow) => {
    if (!window.confirm(`Excluir o cliente "${c.name}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/clients?id=${encodeURIComponent(c.id)}`, { method: "DELETE" })
    if (res.ok) onReload()
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

  return (
    <div className="card pad">
      <div className="a-toolbar">
        <div className="input-wrap" style={{ flex: 1 }}>
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
        <button className="btn btn-ghost" onClick={exportCsv} disabled={clients.length === 0}>
          <DownloadIcon size={16} /> CSV
        </button>
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
                        <button className="act-btn" onClick={() => setTarget(c)} title="Redefinir senha">
                          <KeyIcon size={15} />
                        </button>
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

      {target && <ResetPasswordModal client={target} onClose={() => setTarget(null)} />}
    </div>
  )
}

function ResetPasswordModal({ client, onClose }: { client: ClientRow; onClose: () => void }) {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError("A senha precisa de ao menos 6 caracteres.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, password }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(onClose, 1200)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Não foi possível redefinir a senha.")
      }
    } catch {
      setError("Falha de conexão.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="a-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="a-modal card card-glow" onClick={(e) => e.stopPropagation()}>
        <button className="a-modal-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={18} />
        </button>
        <div className="a-modal-ic">
          <KeyIcon size={22} />
        </div>
        <h2 className="a-modal-title">Redefinir senha</h2>
        <p className="a-modal-sub">
          Nova senha para <b>{client.name}</b> ({client.email}).
        </p>

        {done ? (
          <div className="alert alert-ok">
            <CheckIcon size={16} /> <span>Senha redefinida com sucesso.</span>
          </div>
        ) : (
          <form className="form-grid" onSubmit={submit} noValidate style={{ marginTop: 16 }}>
            <div className="field">
              <label className="label">
                <KeyIcon size={15} /> Nova senha
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
                  autoFocus
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

            <div className="a-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent" disabled={busy}>
                {busy ? (
                  <>
                    <SpinnerIcon size={18} className="spin" /> Salvando...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
