import { NextResponse, type NextRequest } from "next/server"
import { getAccountByEmail } from "@/lib/db"
import { verifyPassword, makeSession } from "@/lib/crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<Response> {
  if (!process.env.DATABASE_URL || !process.env.APP_SECRET) {
    return NextResponse.json({ ok: false, error: "servidor não configurado" }, { status: 503 })
  }

  let email = ""
  let password = ""
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown }
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }

  try {
    const acc = await getAccountByEmail(email)
    if (!acc || !verifyPassword(password, acc.password_hash)) {
      return NextResponse.json({ ok: false, error: "E-mail ou senha incorretos." }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set("bx_session", makeSession(acc.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    console.error("Falha no login:", e)
    return NextResponse.json({ ok: false, error: "Falha ao entrar." }, { status: 500 })
  }
}
