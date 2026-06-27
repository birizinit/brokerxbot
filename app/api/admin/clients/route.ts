import { cookies } from "next/headers"
import { listClients } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(): Promise<Response> {
  const session = process.env.ADMIN_SESSION
  const cookie = cookies().get("bx_admin")?.value

  if (!session || cookie !== session) {
    return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  }

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
