import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { readSession } from "@/lib/crypto"
import { upsertBotConfig } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<Response> {
  const id = readSession(cookies().get("bx_session")?.value)
  if (!id) return Response.json({ ok: false }, { status: 401 })

  try {
    const config = await request.json()
    await upsertBotConfig(id, config)
    return Response.json({ ok: true })
  } catch (e) {
    console.error("POST /api/bot/config:", e)
    return Response.json({ ok: false, error: "falha ao salvar" }, { status: 500 })
  }
}
