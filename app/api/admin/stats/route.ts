import { adminStats } from "@/lib/db"
import { isAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(): Promise<Response> {
  if (!isAdmin()) return Response.json({ ok: false, error: "não autorizado" }, { status: 401 })
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "banco não configurado" }, { status: 503 })
  }

  try {
    const stats = await adminStats()
    return Response.json({ ok: true, stats })
  } catch (error) {
    console.error("Falha ao agregar métricas:", error)
    return Response.json({ ok: false, error: "falha ao agregar métricas" }, { status: 500 })
  }
}
