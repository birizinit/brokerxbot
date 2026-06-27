import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<Response> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPass = process.env.ADMIN_PASSWORD
  const session = process.env.ADMIN_SESSION

  if (!adminEmail || !adminPass || !session) {
    return NextResponse.json({ ok: false, error: "admin não configurado" }, { status: 503 })
  }

  try {
    const { email, password } = (await request.json()) as { email?: unknown; password?: unknown }
    const okEmail = typeof email === "string" && email.trim().toLowerCase() === adminEmail.toLowerCase()
    const okPass = typeof password === "string" && password === adminPass

    if (okEmail && okPass) {
      const res = NextResponse.json({ ok: true })
      res.cookies.set("bx_admin", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
      return res
    }

    return NextResponse.json({ ok: false, error: "credenciais inválidas" }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false, error: "requisição inválida" }, { status: 400 })
  }
}
