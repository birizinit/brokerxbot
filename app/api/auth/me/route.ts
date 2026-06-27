import { cookies } from "next/headers"
import { getAccountById } from "@/lib/db"
import { readSession, decrypt } from "@/lib/crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(): Promise<Response> {
  const id = readSession(cookies().get("bx_session")?.value)
  if (!id) return Response.json({ ok: false }, { status: 401 })

  try {
    const acc = await getAccountById(id)
    if (!acc) return Response.json({ ok: false }, { status: 401 })
    return Response.json({
      ok: true,
      name: acc.name,
      email: acc.email,
      phone: acc.phone ?? "",
      apiKey: decrypt(acc.api_key_enc),
    })
  } catch (e) {
    console.error("Falha ao carregar sessão:", e)
    return Response.json({ ok: false }, { status: 500 })
  }
}
