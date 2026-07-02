import { NextResponse, type NextRequest } from "next/server"
import { getAdminByEmail } from "@/lib/db"
import { verifyPassword, makeAdminSession } from "@/lib/crypto"
import { ADMIN_COOKIE } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
}

export async function POST(request: NextRequest): Promise<Response> {
  let email = ""
  let password = ""
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown }
    email = typeof body.email === "string" ? body.email.trim() : ""
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }

  // 1) Admin bootstrap definido por variáveis de ambiente.
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPass = process.env.ADMIN_PASSWORD
  const envSession = process.env.ADMIN_SESSION
  if (adminEmail && adminPass && envSession) {
    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPass) {
      const res = NextResponse.json({ ok: true })
      // Mantém o valor literal (compatível com sessões já existentes).
      res.cookies.set(ADMIN_COOKIE, envSession, COOKIE_OPTS)
      return res
    }
  }

  // 2) Administradores criados pelo painel (tabela `admins`).
  if (process.env.DATABASE_URL && process.env.APP_SECRET) {
    try {
      const admin = await getAdminByEmail(email.toLowerCase())
      if (admin && verifyPassword(password, admin.password_hash)) {
        const res = NextResponse.json({ ok: true })
        res.cookies.set(ADMIN_COOKIE, makeAdminSession(admin.id), COOKIE_OPTS)
        return res
      }
    } catch (error) {
      console.error("Falha no login admin:", error)
      return NextResponse.json({ ok: false, error: "falha no servidor" }, { status: 500 })
    }
  }

  if (!adminEmail && !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "admin não configurado" }, { status: 503 })
  }

  return NextResponse.json({ ok: false, error: "credenciais inválidas" }, { status: 401 })
}
