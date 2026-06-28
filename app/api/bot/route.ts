import { cookies } from "next/headers"
import { readSession } from "@/lib/crypto"
import { getBot, getOperations } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(): Promise<Response> {
  const id = readSession(cookies().get("bx_session")?.value)
  if (!id) return Response.json({ ok: false }, { status: 401 })

  try {
    const bot = await getBot(id)
    const operations = await getOperations(id)
    return Response.json({ ok: true, bot, operations })
  } catch (e) {
    console.error("GET /api/bot:", e)
    return Response.json({ ok: false, error: "falha ao carregar" }, { status: 500 })
  }
}
