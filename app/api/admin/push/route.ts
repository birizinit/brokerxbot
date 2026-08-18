import type { NextRequest } from "next/server"
import { savePushSub, deletePushSub } from "@/lib/db"
import { isAdmin } from "@/lib/admin-auth"
import { pushEnabled, notifyAdmins } from "@/lib/push"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Informa ao cliente se o push está configurado e qual a chave pública. */
export async function GET(): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  return Response.json({
    ok: true,
    enabled: pushEnabled(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
  })
}

/** Registra a inscrição do navegador. Body: { subscription, label?, test? }. */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!pushEnabled()) {
    return Response.json({ ok: false, error: "push não configurado no servidor" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as {
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      label?: unknown
      test?: unknown
    }
    const sub = body.subscription
    const endpoint = sub?.endpoint
    const p256dh = sub?.keys?.p256dh
    const auth = sub?.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return Response.json({ ok: false, error: "inscrição inválida" }, { status: 400 })
    }

    const label = typeof body.label === "string" ? body.label.slice(0, 120) : null
    await savePushSub({ endpoint, p256dh, auth }, label)

    if (body.test === true) {
      void notifyAdmins({
        title: "Notificações ativadas",
        body: "Este aparelho vai receber os avisos do painel.",
        url: "/admin",
        tag: "push-test",
      })
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao registrar push:", error)
    return Response.json({ ok: false, error: "falha ao registrar" }, { status: 500 })
  }
}

/** Cancela a inscrição. Body: { endpoint }. */
export async function DELETE(request: NextRequest): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })

  try {
    const body = (await request.json()) as { endpoint?: unknown }
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : ""
    if (!endpoint) return Response.json({ ok: false, error: "endpoint ausente" }, { status: 400 })
    await deletePushSub(endpoint)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao cancelar push:", error)
    return Response.json({ ok: false, error: "falha ao cancelar" }, { status: 500 })
  }
}
