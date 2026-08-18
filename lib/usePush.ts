"use client"

import { useCallback, useEffect, useState } from "react"

export type PushState =
  | "carregando"
  | "indisponivel" // navegador não suporta, ou página sem HTTPS
  | "desligado" // suportado, servidor pronto, ainda não inscrito
  | "ligado"
  | "negado" // usuário bloqueou nas permissões do navegador
  | "sem-servidor" // faltam as chaves VAPID no servidor

/** Converte a chave VAPID (base64url) para o formato que o navegador espera. */
function decodeKey(base64: string): Uint8Array {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function suportado(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

export interface PushControls {
  state: PushState
  /** Verdadeiro se a página está rodando como app instalado. */
  instalado: boolean
  ativar: () => Promise<void>
  desativar: () => Promise<void>
  erro: string | null
}

/**
 * Registra o service worker e gerencia a inscrição de push do painel.
 * O envio real acontece no servidor (lib/push.ts).
 */
export function usePush(): PushControls {
  const [state, setState] = useState<PushState>("carregando")
  const [erro, setErro] = useState<string | null>(null)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    if (!suportado()) {
      setState("indisponivel")
      return
    }

    setInstalado(window.matchMedia("(display-mode: standalone)").matches)

    let vivo = true
    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js")
        const cfg = await fetch("/api/admin/push", { cache: "no-store" })
        const dados = cfg.ok ? await cfg.json() : null

        if (!vivo) return
        if (!dados?.enabled || !dados?.publicKey) {
          setState("sem-servidor")
          return
        }
        if (Notification.permission === "denied") {
          setState("negado")
          return
        }

        const atual = await reg.pushManager.getSubscription()
        if (!vivo) return
        setState(atual ? "ligado" : "desligado")
      } catch (e) {
        console.error("push: falha ao inicializar", e)
        if (vivo) setState("indisponivel")
      }
    })()

    return () => {
      vivo = false
    }
  }, [])

  const ativar = useCallback(async () => {
    setErro(null)
    try {
      const permissao = await Notification.requestPermission()
      if (permissao !== "granted") {
        setState(permissao === "denied" ? "negado" : "desligado")
        return
      }

      const cfg = await fetch("/api/admin/push", { cache: "no-store" })
      const dados = await cfg.json()
      if (!dados?.publicKey) {
        setState("sem-servidor")
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(dados.publicKey) as BufferSource,
        }))

      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), label: navigator.userAgent.slice(0, 120), test: true }),
      })
      if (!res.ok) {
        setErro("Não foi possível registrar este aparelho.")
        return
      }
      setState("ligado")
    } catch (e) {
      console.error("push: falha ao ativar", e)
      setErro("Não foi possível ativar as notificações neste aparelho.")
    }
  }, [])

  const desativar = useCallback(async () => {
    setErro(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/admin/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState("desligado")
    } catch (e) {
      console.error("push: falha ao desativar", e)
      setErro("Não foi possível desativar.")
    }
  }, [])

  return { state, instalado, ativar, desativar, erro }
}
