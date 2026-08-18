import type { NextRequest } from "next/server"
import { listBuyers, addBuyer, removeBuyer, countBuyers } from "@/lib/db"
import { normalize } from "@/lib/compradores"
import { isAdmin } from "@/lib/admin-auth"
import { notifyAdmins } from "@/lib/push"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function configured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.APP_SECRET)
}

export async function GET(): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!configured()) return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })

  try {
    return Response.json({ ok: true, buyers: await listBuyers() })
  } catch (error) {
    console.error("Falha ao listar compradores:", error)
    return Response.json({ ok: false, error: "falha ao listar" }, { status: 500 })
  }
}

/** Libera um comprador. Body: { email, name?, note? }. */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!configured()) return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })

  let email = ""
  let name = ""
  let note: string | null = null
  try {
    const body = (await request.json()) as { email?: unknown; name?: unknown; note?: unknown }
    email = typeof body.email === "string" ? normalize(body.email).slice(0, 200) : ""
    name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : ""
    note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 300) : null
  } catch {
    return Response.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "E-mail inválido." }, { status: 400 })
  }

  try {
    const buyer = await addBuyer(email, name, note)

    // Notificação pedida: novo liberado na lista de permissões.
    const total = await countBuyers()
    await notifyAdmins({
      title: "Novo comprador liberado",
      body: `${name || email} agora pode criar conta. Total liberado: ${total}.`,
      url: "/admin",
      tag: "buyer-added",
    })

    return Response.json({ ok: true, buyer, total })
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return Response.json({ ok: false, error: "Esse e-mail já está liberado." }, { status: 409 })
    }
    console.error("Falha ao liberar comprador:", e)
    return Response.json({ ok: false, error: "falha ao liberar" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!configured()) return Response.json({ ok: false, error: "servidor não configurado" }, { status: 503 })

  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!id) return Response.json({ ok: false, error: "id ausente" }, { status: 400 })

  try {
    await removeBuyer(id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao remover comprador:", error)
    return Response.json({ ok: false, error: "falha ao remover" }, { status: 500 })
  }
}
