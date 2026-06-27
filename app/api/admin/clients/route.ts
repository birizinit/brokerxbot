import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { listClients, deleteClient } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function authed(): boolean {
  const session = process.env.ADMIN_SESSION
  const cookie = cookies().get("bx_admin")?.value
  return Boolean(session) && cookie === session
}

export async function GET(): Promise<Response> {
  if (!authed()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "banco não configurado" }, { status: 503 })
  }

  try {
    const clients = await listClients()
    return Response.json({ ok: true, clients })
  } catch (error) {
    console.error("Falha ao listar clientes:", error)
    return Response.json({ ok: false, error: "falha ao listar" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  if (!authed()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })

  const id = new URL(request.url).searchParams.get("id") ?? ""
  if (!id) return Response.json({ ok: false, error: "id ausente" }, { status: 400 })

  try {
    await deleteClient(id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao excluir cliente:", error)
    return Response.json({ ok: false, error: "falha ao excluir" }, { status: 500 })
  }
}
