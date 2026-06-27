import type { NextRequest } from "next/server"
import { upsertClient } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "banco não configurado" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { name?: unknown; email?: unknown; phone?: unknown }
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : ""
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null

    if (!name || !email) {
      return Response.json({ ok: false, error: "nome e e-mail são obrigatórios" }, { status: 400 })
    }

    await upsertClient({ name, email, phone })
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Falha ao salvar cliente:", error)
    return Response.json({ ok: false, error: "falha ao salvar" }, { status: 500 })
  }
}
