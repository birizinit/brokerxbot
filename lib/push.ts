// Envio de notificações Web Push para os administradores inscritos.
// SOMENTE no servidor. Falhas aqui nunca podem derrubar o fluxo que chamou —
// um cadastro não pode falhar porque uma notificação não saiu.

import webpush from "web-push"
import { listPushSubs, deletePushSub } from "@/lib/db"

export interface PushPayload {
  title: string
  body: string
  /** Caminho aberto ao clicar na notificação. */
  url?: string
  tag?: string
}

let configured = false

/** Configura o VAPID uma vez. Devolve false se as chaves não estiverem no ambiente. */
function configure(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false

  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@sniper.app", publicKey, privateKey)
  configured = true
  return true
}

export function pushEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

/**
 * Dispara uma notificação para todos os admins inscritos.
 * Inscrições mortas (410/404) são removidas do banco.
 */
export async function notifyAdmins(payload: PushPayload): Promise<number> {
  if (!configure()) return 0

  let subs
  try {
    subs = await listPushSubs()
  } catch (e) {
    console.error("push: falha ao listar inscrições:", e)
    return 0
  }

  const corpo = JSON.stringify(payload)
  let enviadas = 0

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          corpo,
        )
        enviadas++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await deletePushSub(s.endpoint).catch(() => {})
        } else {
          console.error("push: falha ao enviar:", status ?? e)
        }
      }
    }),
  )

  return enviadas
}

/** Marcos de usuários que geram notificação. */
export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000] as const

/** Maior marco já alcançado por `total`, ou null se ainda não chegou no primeiro. */
export function milestoneFor(total: number): number | null {
  let alcancado: number | null = null
  for (const m of MILESTONES) {
    if (total >= m) alcancado = m
  }
  return alcancado
}
