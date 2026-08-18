"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import type { BuyerRow } from "@/components/admin/types"
import {
  MailIcon,
  UserIcon,
  TrashIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  SpinnerIcon,
  DownloadIcon,
  ShieldIcon,
} from "@/components/icons"

type Filtro = "todos" | "cadastrados" | "pendentes"

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

function csvCell(v: string): string {
  return '"' + v.split('"').join('""') + '"'
}

export function BuyersTab({ onChange }: { onChange?: () => void }) {
  const [buyers, setBuyers] = useState<BuyerRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [query, setQuery] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("todos")

  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [ok, setOk] = useState("")

  const carregar = useCallback(async () => {
    const res = await fetch("/api/admin/buyers", { cache: "no-store" })
    if (res.ok) {
      const d = await res.json()
      setBuyers(Array.isArray(d.buyers) ? d.buyers : [])
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const liberar = async (e: FormEvent) => {
    e.preventDefault()
    setErro("")
    setOk("")
    setSalvando(true)
    try {
      const alvo = email.trim()
      const res = await fetch("/api/admin/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alvo, name: nome.trim() }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOk(alvo + " liberado.")
        setEmail("")
        setNome("")
        await carregar()
        onChange?.()
      } else {
        setErro(d.error ?? "Não foi possível liberar.")
      }
    } catch {
      setErro("Falha de conexão.")
    } finally {
      setSalvando(false)
    }
  }

  const remover = async (b: BuyerRow) => {
    const aviso = b.registered
      ? b.email +
        " já tem conta criada. Remover da lista NÃO exclui a conta nem bloqueia o login — só impede um cadastro novo. Continuar?"
      : "Remover " + b.email + " da lista de liberados?"
    if (!window.confirm(aviso)) return

    const res = await fetch("/api/admin/buyers?id=" + encodeURIComponent(b.id), { method: "DELETE" })
    if (res.ok) {
      await carregar()
      onChange?.()
    }
  }

  const exportar = () => {
    const linhas = buyers.map((b) =>
      [csvCell(b.name), csvCell(b.email), csvCell(b.registered ? "sim" : "nao"), csvCell(fmtDate(b.created_at))].join(","),
    )
    const csv = "﻿" + ["nome,email,cadastrou,liberado_em", ...linhas].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "compradores-liberados.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return buyers
      .filter((b) => (filtro === "todos" ? true : filtro === "cadastrados" ? b.registered : !b.registered))
      .filter((b) => !q || b.email.includes(q) || b.name.toLowerCase().includes(q))
  }, [buyers, query, filtro])

  const cadastrados = buyers.filter((b) => b.registered).length
  const pendentes = buyers.length - cadastrados

  return (
    <div className="a-stack">
      <section className="card pad">
        <div className="a-sec-head">
          <span className="a-sec-ic">
            <ShieldIcon size={17} />
          </span>
          <div>
            <h3 className="disp-title">Liberar comprador</h3>
            <p className="a-chart-sub">Só quem está nesta lista consegue criar conta</p>
          </div>
        </div>

        <form className="a-buyer-form" onSubmit={liberar} noValidate>
          <div className="input-wrap">
            <span className="lead">
              <MailIcon size={17} />
            </span>
            <input
              className="input has-lead"
              type="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="email-da-compra@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={salvando}
            />
          </div>
          <div className="input-wrap">
            <span className="lead">
              <UserIcon size={17} />
            </span>
            <input
              className="input has-lead"
              placeholder="Nome (opcional)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={salvando}
            />
          </div>
          <button type="submit" className="btn btn-accent" disabled={salvando || !email.trim()}>
            {salvando ? <SpinnerIcon size={17} className="spin" /> : <CheckIcon size={17} />}
            <span>{salvando ? "Liberando..." : "Liberar"}</span>
          </button>
        </form>

        {erro && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            <CloseIcon size={16} /> <span>{erro}</span>
          </div>
        )}
        {ok && (
          <div className="alert alert-ok" style={{ marginTop: 12 }}>
            <CheckIcon size={16} /> <span>{ok}</span>
          </div>
        )}
      </section>

      <section className="card pad">
        <div className="a-toolbar a-toolbar-wrap">
          <div className="input-wrap" style={{ flex: 1, minWidth: 160 }}>
            <span className="lead">
              <SearchIcon size={17} />
            </span>
            <input
              className="input has-lead"
              placeholder="Buscar e-mail ou nome..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={exportar} type="button">
            <DownloadIcon size={16} /> <span className="hide-xs">CSV</span>
          </button>
        </div>

        <div className="a-seg">
          <button type="button" data-on={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos <b>{buyers.length}</b>
          </button>
          <button type="button" data-on={filtro === "cadastrados"} onClick={() => setFiltro("cadastrados")}>
            Cadastrados <b>{cadastrados}</b>
          </button>
          <button type="button" data-on={filtro === "pendentes"} onClick={() => setFiltro("pendentes")}>
            Pendentes <b>{pendentes}</b>
          </button>
        </div>

        {carregando ? (
          <p className="a-chart-empty">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="a-chart-empty">Nenhum comprador nesse filtro.</p>
        ) : (
          <div className="a-buyer-list">
            {filtrados.map((b) => (
              <div key={b.id} className="a-buyer-row">
                <span
                  className={"a-dot-status" + (b.registered ? " on" : "")}
                  title={b.registered ? "Já criou conta" : "Ainda não se cadastrou"}
                />
                <div className="a-buyer-info">
                  <span className="a-buyer-mail">{b.email}</span>
                  <span className="a-buyer-meta">
                    {b.name || "sem nome"} · liberado em {fmtDate(b.created_at)}
                  </span>
                </div>
                <span className={"a-tag " + (b.registered ? "ok" : "wait")}>
                  {b.registered ? "cadastrado" : "pendente"}
                </span>
                <button className="icon-btn danger" onClick={() => remover(b)} title="Remover da lista" type="button">
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="a-note">
          Remover da lista impede um cadastro novo. Contas já criadas continuam funcionando — para cortar o acesso de
          quem já entrou, exclua a conta na aba Clientes.
        </p>
      </section>
    </div>
  )
}
